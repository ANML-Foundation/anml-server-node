/**
 * @anml-foundation/server — ANML 1.0 Server SDK for Node.js/TypeScript
 *
 * Build, serialize, and serve ANML duckuments.
 */

// Types
export type {
  AnmlDocument,
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
export { DocumentBuilder } from "./builder.js";
export type {
  StepInput,
  ParamInput,
  ActionInput,
  AskInput,
  MediaInput,
  PersonaInput,
  BrandInput,
} from "./builder.js";

// Serializer
export {
  toXml,
  toJson,
  negotiate,
  CONTENT_TYPE_XML,
  CONTENT_TYPE_JSON,
  ANML_NAMESPACE,
} from "./serializer.js";
export type { NegotiatedResponse } from "./serializer.js";

// Discovery
export {
  WELL_KNOWN_PATH,
  linkHeader,
  htmlLinkTag,
  discoveryDocument,
} from "./discovery.js";

// Validation
export { validate } from "./validation.js";
export type { ValidationError } from "./validation.js";

// Integrity
export {
  computeSriHash,
  computeSriHashFromUrl,
  verifySriHash,
} from "./integrity.js";
export type { SriAlgorithm } from "./integrity.js";
