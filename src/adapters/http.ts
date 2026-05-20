/**
 * ANML 1.0 Generic HTTP Adapter
 *
 * Provides a handler for Node.js built-in http module.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { AnmlDocument } from "../types.js";
import { negotiate, CONTENT_TYPE_JSON } from "../serializer.js";
import { WELL_KNOWN_PATH, linkHeader } from "../discovery.js";

export interface AnmlHttpOptions {
  /** Handler function that returns an ANML document for the request */
  handler: (req: IncomingMessage) => AnmlDocument | Promise<AnmlDocument>;
  /** Path to serve the ANML document on (default: WELL_KNOWN_PATH) */
  path?: string;
  /** Whether to include Link header on responses (default: true) */
  includeLinkHeader?: boolean;
}

/**
 * Create a generic Node.js HTTP handler for serving ANML documents.
 *
 * @example
 * ```ts
 * import { createServer } from "node:http";
 * import { DocumentBuilder } from "@anml-foundation/server";
 * import { createAnmlHandler } from "@anml-foundation/server/http";
 *
 * const anmlHandler = createAnmlHandler({
 *   handler: (req) => new DocumentBuilder()
 *     .title("My Service")
 *     .build()
 * });
 *
 * const server = createServer(async (req, res) => {
 *   await anmlHandler(req, res);
 * });
 * ```
 */
export function createAnmlHandler(
  options: AnmlHttpOptions
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const { handler, path = WELL_KNOWN_PATH, includeLinkHeader = true } = options;

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname !== path) {
      // Add Link header to non-ANML responses if configured
      if (includeLinkHeader) {
        res.setHeader("Link", linkHeader(path));
      }
      // Not our path — don't handle
      res.statusCode = 404;
      res.end();
      return;
    }

    try {
      const doc = await handler(req);
      const accept = req.headers.accept ?? CONTENT_TYPE_JSON;
      const { content, contentType } = negotiate(doc, accept);

      res.statusCode = 200;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-cache");
      res.end(content);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  };
}

/**
 * Create a combined HTTP handler that serves ANML on the configured path
 * and passes through other requests.
 */
export function createAnmlServer(
  options: AnmlHttpOptions & {
    fallback?: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
  }
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const { handler, path = WELL_KNOWN_PATH, includeLinkHeader = true, fallback } = options;

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname === path) {
      try {
        const doc = await handler(req);
        const accept = req.headers.accept ?? CONTENT_TYPE_JSON;
        const { content, contentType } = negotiate(doc, accept);

        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        res.end(content);
      } catch {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
      return;
    }

    // Add Link header for discovery
    if (includeLinkHeader) {
      res.setHeader("Link", linkHeader(path));
    }

    if (fallback) {
      await fallback(req, res);
    } else {
      res.statusCode = 404;
      res.end();
    }
  };
}
