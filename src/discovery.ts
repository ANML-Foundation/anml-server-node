/**
 * ANML 1.0 Discovery — Well-known URI handler and Link header generation.
 */

import { CONTENT_TYPE_XML } from "./serializer.js";

/**
 * The well-known path for ANML discovery per RFC 8615.
 */
export const WELL_KNOWN_PATH = "/.well-known/anml";

/**
 * Returns the well-known path string.
 */
export function wellKnownPath(): string {
  return WELL_KNOWN_PATH;
}

/**
 * Generate an HTTP Link header value advertising ANML support.
 *
 * @param anmlUrl - The URL where the ANML document is served
 * @returns A Link header value string
 */
export function linkHeader(anmlUrl: string): string {
  return `<${anmlUrl}>; rel="alternate"; type="${CONTENT_TYPE_XML}"`;
}

/**
 * Generate an HTML <link> element for ANML discovery.
 *
 * @param anmlUrl - The URL where the ANML document is served
 * @returns An HTML link element string
 */
export function htmlLinkTag(anmlUrl: string): string {
  return `<link rel="alternate" type="${CONTENT_TYPE_XML}" href="${anmlUrl}" />`;
}

/**
 * Generate a JSON discovery document for the well-known endpoint.
 */
export function discoveryDocument(opts?: {
  title?: string;
  endpoints?: Array<{ path: string; description?: string }>;
}): string {
  const doc: Record<string, unknown> = {
    anml: "1.0",
    head: {
      title: opts?.title ?? "ANML Service",
      meta: [{ name: "type", value: "discovery" }],
    },
  };

  if (opts?.endpoints && opts.endpoints.length > 0) {
    doc.body = {
      data: [
        {
          id: "endpoints",
          label: "Available ANML Endpoints",
          item: opts.endpoints.map((ep, i) => ({
            id: `endpoint-${i}`,
            field: [
              { name: "path", type: "string", content: ep.path },
              ...(ep.description
                ? [{ name: "description", type: "string", content: ep.description }]
                : []),
            ],
          })),
        },
      ],
    };
  }

  return JSON.stringify(doc, null, 2);
}
