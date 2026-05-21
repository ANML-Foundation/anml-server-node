/**
 * ANML 1.0 Error Types
 */

export class AnmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnmlError";
  }
}

export class AnmlValidationError extends AnmlError {
  public readonly errors: Array<{ path: string; message: string; severity: string }>;

  constructor(errors: Array<{ path: string; message: string; severity: string }>) {
    super(`ANML validation failed with ${errors.length} error(s)`);
    this.name = "AnmlValidationError";
    this.errors = errors;
  }
}

export class AnmlSerializationError extends AnmlError {
  constructor(message: string) {
    super(message);
    this.name = "AnmlSerializationError";
  }
}

export class AnmlNegotiationError extends AnmlError {
  constructor(acceptHeader: string) {
    super(`Cannot negotiate content type for Accept: "${acceptHeader}"`);
    this.name = "AnmlNegotiationError";
  }
}

export class AnmlIntegrityError extends AnmlError {
  constructor(message: string) {
    super(message);
    this.name = "AnmlIntegrityError";
  }
}

export class AnmlTrustError extends AnmlError {
  public readonly domain: string;

  constructor(domain: string, message: string) {
    super(message);
    this.name = "AnmlTrustError";
    this.domain = domain;
  }
}
