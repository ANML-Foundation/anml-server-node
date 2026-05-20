/**
 * ANML 1.0 Express Adapter
 *
 * Provides Express middleware for serving ANML documents with
 * content negotiation and discovery support.
 */

import type { Router, Request, Response, NextFunction } from "express";
import type { AnmlDocument } from "../types.js";
import { negotiate, CONTENT_TYPE_JSON } from "../serializer.js";
import { WELL_KNOWN_PATH, linkHeader } from "../discovery.js";

export interface AnmlExpressOptions {
  /** Handler function that returns an ANML document for the request */
  handler: (req: Request) => AnmlDocument | Promise<AnmlDocument>;
  /** Path to serve the ANML document on (default: WELL_KNOWN_PATH) */
  path?: string;
  /** Whether to include Link header on responses (default: true) */
  includeLinkHeader?: boolean;
  /** Additional paths to serve the ANML document on */
  additionalPaths?: string[];
}

/**
 * Create Express middleware that serves ANML documents with content negotiation.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { DocumentBuilder } from "@anml-foundation/server";
 * import { createAnmlMiddleware } from "@anml-foundation/server/express";
 *
 * const app = express();
 * app.use(createAnmlMiddleware({
 *   handler: (req) => new DocumentBuilder()
 *     .title("My Service")
 *     .build()
 * }));
 * ```
 */
export function createAnmlMiddleware(options: AnmlExpressOptions): Router {
  // Dynamic import to avoid requiring express as a hard dependency
  const { handler, path, includeLinkHeader = true, additionalPaths = [] } = options;
  const servePath = path ?? WELL_KNOWN_PATH;

  // We return a function that acts as middleware
  const middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const paths = [servePath, ...additionalPaths];

    if (!paths.includes(req.path)) {
      // Add Link header to non-ANML responses if configured
      if (includeLinkHeader) {
        res.setHeader("Link", linkHeader(servePath));
      }
      next();
      return;
    }

    try {
      const doc = await handler(req);
      const accept = req.get("Accept") ?? CONTENT_TYPE_JSON;
      const { content, contentType } = negotiate(doc, accept);

      res.status(200).type(contentType).send(content);
    } catch (err) {
      next(err);
    }
  };

  // Cast to Router type for Express compatibility
  return middleware as unknown as Router;
}

/**
 * Create a simple Express route handler for serving an ANML document.
 */
export function anmlHandler(
  handler: (req: Request) => AnmlDocument | Promise<AnmlDocument>
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doc = await handler(req);
      const accept = req.get("Accept") ?? CONTENT_TYPE_JSON;
      const { content, contentType } = negotiate(doc, accept);
      res.status(200).type(contentType).send(content);
    } catch (err) {
      next(err);
    }
  };
}
