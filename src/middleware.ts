/**
 * ANML 1.0 Middleware — Express/Fastify adapters for serving ANML documents.
 */

import type { AnmlDocument } from "./types.js";
import { toXml, toJson, CONTENT_TYPE_XML, CONTENT_TYPE_JSON } from "./serializer.js";
import { negotiateContentType } from "./negotiation.js";
import { WELL_KNOWN_PATH, linkHeader, discoveryDocument } from "./discovery.js";

// ─── Generic Types ───────────────────────────────────────────────────────────

export interface AnmlMiddlewareOptions {
  /** Handler function that returns an ANML document for the request */
  handler: (req: unknown) => AnmlDocument | Promise<AnmlDocument>;
  /** Path to serve the ANML document on (default: /.well-known/anml) */
  path?: string;
  /** Whether to include Link header on all responses (default: true) */
  includeLinkHeader?: boolean;
  /** Discovery document options */
  discovery?: {
    title?: string;
    endpoints?: Array<{ path: string; description?: string }>;
  };
}

// ─── Express Adapter ─────────────────────────────────────────────────────────

interface ExpressRequest {
  path: string;
  method: string;
  get(name: string): string | undefined;
  headers: Record<string, string | string[] | undefined>;
}

interface ExpressResponse {
  status(code: number): ExpressResponse;
  type(contentType: string): ExpressResponse;
  setHeader(name: string, value: string): ExpressResponse;
  set(name: string, value: string): ExpressResponse;
  send(body: string): ExpressResponse;
  json(body: unknown): ExpressResponse;
}

type ExpressNext = (err?: unknown) => void;

/**
 * Create Express middleware that serves ANML documents with content negotiation.
 *
 * Adds:
 * - /.well-known/anml route (or custom path)
 * - Link headers on all responses for discovery
 * - Content negotiation based on Accept header
 */
export function anmlMiddleware(options: AnmlMiddlewareOptions) {
  const { handler, path: servePath = WELL_KNOWN_PATH, includeLinkHeader = true, discovery } = options;

  return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> => {
    // Serve discovery document at well-known path
    if (req.path === WELL_KNOWN_PATH && servePath !== WELL_KNOWN_PATH) {
      const doc = discoveryDocument(discovery);
      res.status(200).type(CONTENT_TYPE_JSON).send(doc);
      return;
    }

    // Serve ANML document at configured path
    if (req.path === servePath) {
      try {
        const doc = await handler(req);
        const accept = req.get?.("Accept") ?? req.headers?.accept as string ?? "";
        const contentType = negotiateContentType(accept);
        const content = contentType === CONTENT_TYPE_XML ? toXml(doc) : toJson(doc);
        res.status(200).type(contentType).send(content);
      } catch (err) {
        next(err);
      }
      return;
    }

    // Add Link header to non-ANML responses
    if (includeLinkHeader) {
      res.set("Link", linkHeader(servePath));
    }
    next();
  };
}

// ─── Fastify Adapter ─────────────────────────────────────────────────────────

interface FastifyRequest {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface FastifyReply {
  status(code: number): FastifyReply;
  header(name: string, value: string): FastifyReply;
  type(contentType: string): FastifyReply;
  send(payload: string): FastifyReply;
}

interface FastifyInstance {
  get(path: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>): void;
  addHook(hook: string, handler: (req: FastifyRequest, reply: FastifyReply, done: () => void) => void): void;
}

/**
 * Fastify plugin for serving ANML documents.
 */
export async function anmlFastifyPlugin(
  fastify: FastifyInstance,
  options: AnmlMiddlewareOptions
): Promise<void> {
  const { handler, path: servePath = WELL_KNOWN_PATH, includeLinkHeader = true } = options;

  fastify.get(servePath, async (req: FastifyRequest, reply: FastifyReply) => {
    const doc = await handler(req);
    const accept = (req.headers.accept as string) ?? "";
    const contentType = negotiateContentType(accept);
    const content = contentType === CONTENT_TYPE_XML ? toXml(doc) : toJson(doc);
    reply.status(200).type(contentType).send(content);
  });

  if (includeLinkHeader) {
    fastify.addHook("onSend", (req: FastifyRequest, reply: FastifyReply, done: () => void) => {
      if (req.url !== servePath) {
        reply.header("Link", linkHeader(servePath));
      }
      done();
    });
  }
}

// ─── Convenience Helpers (Express) ───────────────────────────────────────────

export interface DiscoveryOptions {
  /** URL path for the ANML document (default: /.well-known/anml) */
  url?: string;
}

/**
 * Express middleware that adds a Link header advertising ANML support
 * to all responses.
 *
 * Usage:
 *   app.use(anmlDiscovery({ url: '/.well-known/anml' }));
 */
export function anmlDiscovery(options?: DiscoveryOptions) {
  const url = options?.url ?? WELL_KNOWN_PATH;
  return (_req: ExpressRequest, res: ExpressResponse, next: ExpressNext): void => {
    res.set("Link", linkHeader(url));
    next();
  };
}

/**
 * Express route handler that serves an ANML document with content negotiation.
 *
 * Usage:
 *   app.get('/.well-known/anml', anmlHandler(async (req) => {
 *     return AnmlDocument.builder().title('My Service').build();
 *   }));
 */
export function anmlHandler(
  buildDoc: (req: unknown) => AnmlDocument | Promise<AnmlDocument>
) {
  return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> => {
    try {
      const doc = await buildDoc(req);
      const accept = req.get?.("Accept") ?? (req.headers?.accept as string) ?? "";
      const contentType = negotiateContentType(accept);
      const content = contentType === CONTENT_TYPE_XML ? toXml(doc) : toJson(doc);
      res.status(200).type(contentType).send(content);
    } catch (err) {
      next(err);
    }
  };
}
