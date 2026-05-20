/**
 * ANML 1.0 Fastify Adapter
 *
 * Provides a Fastify plugin for serving ANML documents with
 * content negotiation and discovery support.
 */

import type { AnmlDocument } from "../types.js";
import { negotiate, CONTENT_TYPE_JSON } from "../serializer.js";
import { WELL_KNOWN_PATH, linkHeader } from "../discovery.js";

/**
 * Minimal Fastify types to avoid requiring fastify as a hard dependency.
 */
interface FastifyRequest {
  url: string;
  headers: Record<string, string | string[] | undefined>;
  raw: unknown;
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

export interface AnmlFastifyOptions {
  /** Handler function that returns an ANML document for the request */
  handler: (req: FastifyRequest) => AnmlDocument | Promise<AnmlDocument>;
  /** Path to serve the ANML document on (default: WELL_KNOWN_PATH) */
  path?: string;
  /** Whether to include Link header on responses (default: true) */
  includeLinkHeader?: boolean;
}

/**
 * Fastify plugin for serving ANML documents.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { DocumentBuilder } from "@anml-foundation/server";
 * import { anmlPlugin } from "@anml-foundation/server/fastify";
 *
 * const app = Fastify();
 * app.register(anmlPlugin, {
 *   handler: (req) => new DocumentBuilder()
 *     .title("My Service")
 *     .build()
 * });
 * ```
 */
export async function anmlPlugin(
  fastify: FastifyInstance,
  options: AnmlFastifyOptions
): Promise<void> {
  const { handler, path = WELL_KNOWN_PATH, includeLinkHeader = true } = options;

  // Register the ANML endpoint
  fastify.get(path, async (req: FastifyRequest, reply: FastifyReply) => {
    const doc = await handler(req);
    const accept = (req.headers.accept as string) ?? CONTENT_TYPE_JSON;
    const { content, contentType } = negotiate(doc, accept);

    reply.status(200).type(contentType).send(content);
  });

  // Add Link header to all responses if configured
  if (includeLinkHeader) {
    fastify.addHook("onSend", (req: FastifyRequest, reply: FastifyReply, done: () => void) => {
      if (req.url !== path) {
        reply.header("Link", linkHeader(path));
      }
      done();
    });
  }
}

// Mark as a Fastify plugin
Object.defineProperty(anmlPlugin, Symbol.for("skip-override"), { value: true });
Object.defineProperty(anmlPlugin, Symbol.for("fastify.display-name"), { value: "anml-server" });
