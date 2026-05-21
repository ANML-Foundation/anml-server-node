/**
 * ANML 1.0 Content Negotiation
 *
 * Parses Accept headers and determines the best ANML content type to serve.
 */

import { CONTENT_TYPE_XML, CONTENT_TYPE_JSON } from "./serializer.js";

export interface AcceptEntry {
  type: string;
  q: number;
}

/**
 * Parse an Accept header into sorted entries.
 */
export function parseAcceptHeader(acceptHeader: string): AcceptEntry[] {
  if (!acceptHeader || acceptHeader.trim() === "") {
    return [];
  }

  const entries = acceptHeader.split(",").map((entry) => {
    const parts = entry.trim().split(";");
    const type = parts[0]!.trim().toLowerCase();
    let q = 1.0;
    for (const part of parts.slice(1)) {
      const match = part.trim().match(/^q\s*=\s*([\d.]+)$/);
      if (match) {
        q = parseFloat(match[1]!);
      }
    }
    return { type, q };
  });

  // Sort by q-value descending
  entries.sort((a, b) => b.q - a.q);
  return entries;
}

/**
 * Negotiate the best ANML content type based on an Accept header.
 *
 * Returns the appropriate content type string. Defaults to XML
 * if no preference is expressed.
 *
 * @param acceptHeader - The raw Accept header value
 * @returns The negotiated content type
 */
export function negotiateContentType(acceptHeader: string): string {
  const entries = parseAcceptHeader(acceptHeader);

  for (const entry of entries) {
    if (entry.type === CONTENT_TYPE_XML || entry.type === "application/xml") {
      return CONTENT_TYPE_XML;
    }
    if (entry.type === CONTENT_TYPE_JSON || entry.type === "application/json") {
      return CONTENT_TYPE_JSON;
    }
  }

  // Default to XML per spec
  return CONTENT_TYPE_XML;
}
