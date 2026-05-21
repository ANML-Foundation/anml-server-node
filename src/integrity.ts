/**
 * ANML 1.0 Subresource Integrity (SRI) hash computation.
 *
 * Generates SRI hashes for media resources referenced in ANML documents.
 */

import { createHash } from "node:crypto";

export type SriAlgorithm = "sha256" | "sha384" | "sha512";

/**
 * Compute an SRI hash for a given buffer or string.
 *
 * @param data - The data to hash (Buffer or string)
 * @param algorithm - The hash algorithm (default: sha384)
 * @returns SRI hash string in the format "algorithm-base64hash"
 */
export function computeSriHash(
  data: Buffer | string,
  algorithm: SriAlgorithm = "sha384"
): string {
  const hash = createHash(algorithm);
  hash.update(data);
  const digest = hash.digest("base64");
  return `${algorithm}-${digest}`;
}

/**
 * Compute an SRI hash from a URL by fetching the resource.
 *
 * @param url - The URL of the resource to hash
 * @param algorithm - The hash algorithm (default: sha384)
 * @returns SRI hash string
 */
export async function computeSriHashFromUrl(
  url: string,
  algorithm: SriAlgorithm = "sha384"
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource at ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return computeSriHash(buffer, algorithm);
}

/**
 * Verify an SRI hash against data.
 *
 * @param data - The data to verify
 * @param expectedHash - The expected SRI hash string
 * @returns true if the hash matches
 */
export function verifySriHash(data: Buffer | string, expectedHash: string): boolean {
  const parts = expectedHash.split("-");
  if (parts.length < 2) return false;

  const algorithm = parts[0] as SriAlgorithm;
  if (!["sha256", "sha384", "sha512"].includes(algorithm)) return false;

  const computed = computeSriHash(data, algorithm);
  return computed === expectedHash;
}
