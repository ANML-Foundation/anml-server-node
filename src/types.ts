/**
 * ANML 1.0 Type Definitions
 * Complete type system for the Agentic Notation Markup Language.
 * Based on draft-jeskey-anml-00.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type StepStatus = "completed" | "current" | "pending" | "skipped";
export type DisclosureRequirement = "explicit-consent" | "implicit-consent" | "authentication" | "none";
export type UsageRight = "none" | "display" | "cache" | "store" | "train";
export type InferenceMode = "none" | "optional" | "required";
export type FieldType = "string" | "number" | "boolean" | "date" | "datetime" | "uri";
export type DocumentRole = "service" | "agent-response";
export type LanguagePolicy = "native" | "match" | "fixed";
export type StatusResult = "success" | "error" | "partial";
export type RefuseReason = "constraint-violation" | "user-denied" | "policy-violation" | "unsupported-field" | "trust-insufficient";

export interface MetaEntry { name: string; value: string; }
export interface Head { title?: string; meta?: MetaEntry[]; }
export interface Disclosure { field: string; requires: DisclosureRequirement; }
export interface Constraints { disclosure?: Disclosure[]; }
export interface Step { id: string; label?: string; status?: StepStatus; required?: boolean; action?: string; next?: string; condition?: string; }
export interface StateContext { step: string; }
export interface Flow { step: Step[]; }
export interface State { context?: StateContext; flow?: Flow; }
export interface Param { name: string; required?: boolean; type?: FieldType; description?: string; min?: number; max?: number; }
export interface Action { id: string; method?: HttpMethod; endpoint: string; auth?: string; enctype?: string; confirm?: boolean; idempotent?: boolean; description?: string; params?: Param[]; }
export interface Interact { action?: Action[]; }
export interface Inform { content: string; ttl?: number; confidentiality?: string; }
export interface Ask { field: string; action: string; required?: boolean; purpose?: string; type?: FieldType; }
export interface Answer { field: string; value: string; consent?: "explicit" | "implicit" | "delegated"; }
export interface Refuse { field: string; reason: RefuseReason; constraint?: string; message?: string; }
export interface Knowledge { inform?: Inform[]; ask?: Ask[]; answer?: Answer[]; refuse?: Refuse[]; }
export interface PersonaModel { name?: string; provider?: string; capability?: string; }
export interface PersonaLanguage { value?: string; policy?: LanguagePolicy; }
export interface PersonaTone { value: string; }
export interface PersonaVoice { perspective?: "first" | "third"; name?: string; }
export interface PersonaVocabulary { prefer?: string[]; avoid?: string[]; }
export interface Persona { model?: PersonaModel; language?: PersonaLanguage; tone?: PersonaTone; voice?: PersonaVoice; instructions?: string; vocabulary?: PersonaVocabulary; }
export interface Logo { src: string; alt?: string; type?: string; variant?: string; }
export interface Color { role: string; value: string; }
export interface Font { role: string; family: string; fallback?: string; }
export interface Aesthetic { displayName?: string; logo?: Logo[]; colors?: Color[]; typography?: Font[]; }
export interface ImageElement { src: string; inference?: InferenceMode; type?: string; width?: number; height?: number; usage?: UsageRight; description?: string; alt?: string; }
export interface AudioElement { src: string; inference?: InferenceMode; type?: string; duration?: number; lang?: string; usage?: UsageRight; transcript?: string; description?: string; }
export interface VideoElement { src: string; inference?: InferenceMode; type?: string; duration?: number; width?: number; height?: number; lang?: string; usage?: UsageRight; transcript?: string; description?: string; }
export interface LinkElement { href: string; rel?: string; type?: string; label?: string; }
export interface DataField { name: string; type?: FieldType; content: string; }
export interface DataItem { id?: string; field?: DataField[]; }
export interface DataElement { id?: string; label?: string; usage?: UsageRight; item?: DataItem[]; }
export interface NavElement { next?: string; prev?: string; cursor?: string; total?: number; }
export interface BodySection { id?: string; label?: string; usage?: UsageRight; content?: string; section?: BodySection[]; img?: ImageElement[]; audio?: AudioElement[]; video?: VideoElement[]; link?: LinkElement[]; data?: DataElement[]; nav?: NavElement; }
export interface Body { content?: string; usage?: UsageRight; section?: BodySection[]; img?: ImageElement[]; audio?: AudioElement[]; video?: VideoElement[]; link?: LinkElement[]; data?: DataElement[]; nav?: NavElement; }
export interface Rights { holder?: string; year?: string; license?: string; usage?: UsageRight; scope?: string; content?: string; }
export interface Attribution { required?: boolean; scope?: string; content: string; }
export interface Footer { rights?: Rights; attribution?: Attribution[]; }
export interface Status { code: string; result: StatusResult; message?: string; retryAfter?: number; }
export interface AnmlDocument { version: string; role?: DocumentRole; ttl?: number; lang?: string; supportedVersions?: string; head?: Head; constraints?: Constraints; state?: State; interact?: Interact; knowledge?: Knowledge; persona?: Persona; aesthetic?: Aesthetic; body?: Body; footer?: Footer; status?: Status; }
