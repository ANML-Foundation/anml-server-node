/**
 * ANML 1.0 Trust Delegation — DNS TXT record verification.
 *
 * Verifies that a domain has delegated trust to an ANML service
 * via DNS TXT records.
 */

import { resolveTxt } from "node:dns/promises";

export interface TrustRecord {
  domain: string;
  delegateTo: string;
  version: string;
  capabilities?: string[];
}

export interface TrustVerificationResult {
  trusted: boolean;
  records: TrustRecord[];
  error?: string;
}

const ANML_TXT_PREFIX = "anml-trust=";

/**
 * Parse an ANML trust TXT record value.
 *
 * Expected format: anml-trust=<delegate-domain>;v=1.0;cap=serve,discover
 */
export function parseTrustRecord(domain: string, txtValue: string): TrustRecord | null {
  if (!txtValue.startsWith(ANML_TXT_PREFIX)) return null;

  const value = txtValue.slice(ANML_TXT_PREFIX.length);
  const parts = value.split(";").map((p) => p.trim());

  if (parts.length === 0 || !parts[0]) return null;

  const delegateTo = parts[0];
  let version = "1.0";
  let capabilities: string[] | undefined;

  for (const part of parts.slice(1)) {
    if (part.startsWith("v=")) {
      version = part.slice(2);
    } else if (part.startsWith("cap=")) {
      capabilities = part.slice(4).split(",").map((c) => c.trim());
    }
  }

  return { domain, delegateTo, version, capabilities };
}

/**
 * Verify trust delegation for a domain by checking DNS TXT records.
 *
 * Looks for TXT records at _anml.<domain> that delegate trust
 * to the specified service domain.
 *
 * @param domain - The domain to check trust for
 * @param serviceDomain - The service domain that should be trusted
 * @returns TrustVerificationResult
 */
export async function verifyTrust(
  domain: string,
  serviceDomain: string
): Promise<TrustVerificationResult> {
  const lookupDomain = `_anml.${domain}`;

  try {
    const records = await resolveTxt(lookupDomain);
    const flatRecords = records.map((r) => r.join(""));

    const trustRecords: TrustRecord[] = [];
    for (const txt of flatRecords) {
      const parsed = parseTrustRecord(domain, txt);
      if (parsed) trustRecords.push(parsed);
    }

    const trusted = trustRecords.some(
      (r) => r.delegateTo === serviceDomain || r.delegateTo === "*"
    );

    return { trusted, records: trustRecords };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DNS lookup failed";
    return { trusted: false, records: [], error: message };
  }
}

/**
 * Generate the DNS TXT record value for trust delegation.
 *
 * @param serviceDomain - The domain to delegate trust to
 * @param capabilities - Optional capabilities to grant
 * @returns The TXT record value to set
 */
export function generateTrustRecord(
  serviceDomain: string,
  capabilities?: string[]
): string {
  let record = `${ANML_TXT_PREFIX}${serviceDomain};v=1.0`;
  if (capabilities && capabilities.length > 0) {
    record += `;cap=${capabilities.join(",")}`;
  }
  return record;
}
