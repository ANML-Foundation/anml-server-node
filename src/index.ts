/**
 * @anml-foundation/server — ANML 1.0 Server SDK for Node.js/TypeScript
 *
 * Build, serialize, and serve ANML duckuments.
 */

// Types
export type {
  AnmlDocument as AnmlDocumentData,
  HttpMethod,
  StepStatus,
  DisclosureRequirement,
  UsageRight,
  InferenceMode,
  FieldType,
  DocumentRole,
  LanguagePolicy,
  StatusResult,
  RefuseReason,
  MetaEntry,
  Head,
  Disclosure,
  Constraints,
  Step,
  StateContext,
  Flow,
  State,
  Param,
  Action,
  Interact,
  Inform,
  Ask,
  Answer,
  Refuse,
  Knowledge,
  PersonaModel,
  PersonaLanguage,
  PersonaTone,
  PersonaVoice,
  PersonaVocabulary,
  Persona,
  Logo,
  Color,
  Font,
  Aesthetic,
  ImageElement,
  AudioElement,
  VideoElement,
  LinkElement,
  DataField,
  DataItem,
  DataElement,
  NavElement,
  BodySection,
  Body,
  Rights,
  Attribution,
  Footer,
  Status,
} from "./types.js";

// Builder
export { AnmlDocumentInstance as AnmlDocument, DocumentBuilder } from "./builder.js";
export type {
  StepInput,
  ParamInput,
  ActionInput,
  AskInput,
  MediaInput,
  PersonaInput,
} from "./builder.js";

// Serializer
export {
  toXml,
  toJson,
  serialize,
  CONTENT_TYPE_XML,
  CONTENT_TYPE_JSON,
  ANML_NAMESPACE,
} from "./serializer.js";

// Negotiation
export { negotiateContentType, parseAcceptHeader } from "./negotiation.js";
export type { AcceptEntry } from "./negotiation.js";

// Discovery
export {
  WELL_KNOWN_PATH,
  wellKnownPath,
  linkHeader,
  htmlLinkTag,
  discoveryDocument,
} from "./discovery.js";

// Validation
export { validate } from "./validation.js";
export type { ValidationError, ValidationResult } from "./validation.js";

// Integrity
export {
  computeSriHash,
  computeSriHashFromUrl,
  verifySriHash,
} from "./integrity.js";
export type { SriAlgorithm } from "./integrity.js";

// Trust
export {
  verifyTrust,
  parseTrustRecord,
  generateTrustRecord,
} from "./trust.js";
export type { TrustRecord, TrustVerificationResult } from "./trust.js";

// Middleware
export { anmlMiddleware, anmlFastifyPlugin } from "./middleware.js";
export type { AnmlMiddlewareOptions } from "./middleware.js";

// Errors
export {
  AnmlError,
  AnmlValidationError,
  AnmlSerializationError,
  AnmlNegotiationError,
  AnmlIntegrityError,
  AnmlTrustError,
} from "./errors.js";
