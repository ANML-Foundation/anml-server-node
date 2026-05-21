/**
 * Fluent document builder for constructing valid ANML 1.0 duckuments.
 *
 * Usage:
 *   import { AnmlDocument } from '@anml-foundation/server';
 *   const doc = AnmlDocument.builder().title('My Service').build();
 */

import type {
  AnmlDocument as AnmlDocumentType,
  Action,
  Aesthetic,
  Body,
  Constraints,
  Disclosure,
  DisclosureRequirement,
  FieldType,
  Footer,
  Head,
  HttpMethod,
  ImageElement,
  AudioElement,
  VideoElement,
  LinkElement,
  DataElement,
  NavElement,
  Interact,
  Knowledge,
  Param,
  Persona,
  State,
  Step,
  StepStatus,
  UsageRight,
} from "./types.js";
import { toXml, toJson } from "./serializer.js";

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface StepInput {
  id: string;
  label?: string;
  status?: StepStatus;
  action?: string;
  required?: boolean;
  next?: string;
  condition?: string;
}

export interface ParamInput {
  name: string;
  required?: boolean;
  type?: FieldType;
  description?: string;
  min?: number;
  max?: number;
}

export interface ActionInput {
  method?: HttpMethod;
  endpoint: string;
  auth?: string;
  enctype?: string;
  confirm?: boolean;
  idempotent?: boolean;
  description?: string;
  params?: ParamInput[];
}

export interface AskInput {
  action: string;
  required?: boolean;
  purpose?: string;
  type?: FieldType;
}

export interface MediaInput {
  type: string;
  description?: string;
  alt?: string;
  integrity?: string;
}

export interface PersonaInput {
  tone?: string;
  instructions?: string;
  brandColor?: string;
  logoUrl?: string;
  model?: { name?: string; provider?: string; capability?: string };
  language?: { value?: string; policy?: "native" | "match" | "fixed" };
  voice?: { perspective?: "first" | "third"; name?: string };
  vocabulary?: { prefer?: string[]; avoid?: string[] };
}

// ─── Built Document (with convenience methods) ───────────────────────────────

export class AnmlDocumentInstance {
  private readonly _doc: AnmlDocumentType;

  constructor(doc: AnmlDocumentType) {
    this._doc = doc;
  }

  /** Get the raw document data. */
  get data(): AnmlDocumentType {
    return this._doc;
  }

  // Proxy all document properties
  get version() { return this._doc.version; }
  get role() { return this._doc.role; }
  get ttl() { return this._doc.ttl; }
  get lang() { return this._doc.lang; }
  get head() { return this._doc.head; }
  get constraints() { return this._doc.constraints; }
  get state() { return this._doc.state; }
  get interact() { return this._doc.interact; }
  get knowledge() { return this._doc.knowledge; }
  get persona() { return this._doc.persona; }
  get aesthetic() { return this._doc.aesthetic; }
  get body() { return this._doc.body; }
  get footer() { return this._doc.footer; }
  get status() { return this._doc.status; }

  /** Serialize to XML. */
  toXml(): string {
    return toXml(this._doc);
  }

  /** Serialize to JSON. */
  toJson(): string {
    return toJson(this._doc);
  }

  /** Static factory to create a builder. */
  static builder(): DocumentBuilder {
    return new DocumentBuilder();
  }
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export class DocumentBuilder {
  private _head: Head = {};
  private _ttl?: number;
  private _lang?: string;
  private _constraints?: Constraints;
  private _state?: State;
  private _interact?: Interact;
  private _knowledge?: Knowledge;
  private _persona?: Persona;
  private _aesthetic?: Aesthetic;
  private _body?: Body;
  private _footer?: Footer;

  /** Set the document title. */
  title(title: string): this {
    this._head.title = title;
    return this;
  }

  /** Set the document TTL in seconds. */
  ttl(seconds: number): this {
    this._ttl = seconds;
    return this;
  }

  /** Set the document language (BCP 47 tag). */
  lang(lang: string): this {
    this._lang = lang;
    return this;
  }

  /** Add a meta entry to the head section. */
  meta(name: string, value: string): this {
    if (!this._head.meta) this._head.meta = [];
    this._head.meta.push({ name, value });
    return this;
  }

  /** Set persona/behavioral guidance. */
  persona(opts: PersonaInput): this {
    this._persona = {
      ...(opts.tone ? { tone: { value: opts.tone } } : {}),
      ...(opts.instructions ? { instructions: opts.instructions } : {}),
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.language ? { language: opts.language } : {}),
      ...(opts.voice ? { voice: opts.voice } : {}),
      ...(opts.vocabulary ? { vocabulary: opts.vocabulary } : {}),
    };

    // Handle brandColor and logoUrl as aesthetic shortcuts
    if (opts.brandColor || opts.logoUrl) {
      if (!this._aesthetic) this._aesthetic = {};
      if (opts.brandColor) {
        this._aesthetic.colors = [{ role: "primary", value: opts.brandColor }];
      }
      if (opts.logoUrl) {
        if (!this._aesthetic.logo) this._aesthetic.logo = [];
        this._aesthetic.logo.push({ src: opts.logoUrl, alt: "Logo" });
      }
    }

    return this;
  }

  /** Add a disclosure constraint. */
  disclosure(field: string, opts?: { requires?: DisclosureRequirement }): this {
    if (!this._constraints) this._constraints = { disclosure: [] };
    if (!this._constraints.disclosure) this._constraints.disclosure = [];
    this._constraints.disclosure.push({
      field,
      requires: opts?.requires ?? "explicit-consent",
    });
    return this;
  }

  /** Define the workflow flow steps. */
  flow(steps: StepInput[]): this {
    if (!this._state) this._state = {};
    this._state.flow = {
      step: steps.map((s) => ({
        id: s.id,
        ...(s.label ? { label: s.label } : {}),
        ...(s.status ? { status: s.status } : {}),
        ...(s.action ? { action: s.action } : {}),
        ...(s.required !== undefined ? { required: s.required } : {}),
        ...(s.next ? { next: s.next } : {}),
        ...(s.condition ? { condition: s.condition } : {}),
      })),
    };
    return this;
  }

  /** Set the current context step. */
  context(step: string): this {
    if (!this._state) this._state = {};
    this._state.context = { step };
    return this;
  }

  /** Add an action to the interact section. */
  action(id: string, opts: ActionInput): this {
    if (!this._interact) this._interact = { action: [] };
    if (!this._interact.action) this._interact.action = [];
    const action: Action = {
      id,
      endpoint: opts.endpoint,
      ...(opts.method ? { method: opts.method } : {}),
      ...(opts.auth ? { auth: opts.auth } : {}),
      ...(opts.enctype ? { enctype: opts.enctype } : {}),
      ...(opts.confirm !== undefined ? { confirm: opts.confirm } : {}),
      ...(opts.idempotent !== undefined ? { idempotent: opts.idempotent } : {}),
      ...(opts.description ? { description: opts.description } : {}),
    };
    if (opts.params && opts.params.length > 0) {
      action.params = opts.params.map((p) => ({
        name: p.name,
        ...(p.required !== undefined ? { required: p.required } : {}),
        ...(p.type ? { type: p.type } : {}),
        ...(p.description ? { description: p.description } : {}),
        ...(p.min !== undefined ? { min: p.min } : {}),
        ...(p.max !== undefined ? { max: p.max } : {}),
      }));
    }
    this._interact.action.push(action);
    return this;
  }

  /** Add an inform element to the knowledge section. */
  inform(content: string, opts?: { confidentiality?: string; ttl?: number }): this {
    if (!this._knowledge) this._knowledge = {};
    if (!this._knowledge.inform) this._knowledge.inform = [];
    this._knowledge.inform.push({
      content,
      ...(opts?.confidentiality ? { confidentiality: opts.confidentiality } : {}),
      ...(opts?.ttl !== undefined ? { ttl: opts.ttl } : {}),
    });
    return this;
  }

  /** Add an ask element to the knowledge section. */
  ask(field: string, opts: AskInput): this {
    if (!this._knowledge) this._knowledge = {};
    if (!this._knowledge.ask) this._knowledge.ask = [];
    this._knowledge.ask.push({
      field,
      action: opts.action,
      ...(opts.required !== undefined ? { required: opts.required } : {}),
      ...(opts.purpose ? { purpose: opts.purpose } : {}),
      ...(opts.type ? { type: opts.type } : {}),
    });
    return this;
  }

  /** Add a media element (image) to the body. */
  media(url: string, opts: MediaInput): this {
    if (!this._body) this._body = {};
    if (!this._body.img) this._body.img = [];
    this._body.img.push({
      src: url,
      type: opts.type,
      ...(opts.description ? { description: opts.description } : {}),
      ...(opts.alt ? { alt: opts.alt } : {}),
    });
    return this;
  }

  /** Add an image element to the body. */
  image(img: ImageElement): this {
    if (!this._body) this._body = {};
    if (!this._body.img) this._body.img = [];
    this._body.img.push(img);
    return this;
  }

  /** Add an audio element to the body. */
  audio(audio: AudioElement): this {
    if (!this._body) this._body = {};
    if (!this._body.audio) this._body.audio = [];
    this._body.audio.push(audio);
    return this;
  }

  /** Add a video element to the body. */
  video(video: VideoElement): this {
    if (!this._body) this._body = {};
    if (!this._body.video) this._body.video = [];
    this._body.video.push(video);
    return this;
  }

  /** Add a link element to the body. */
  link(link: LinkElement): this {
    if (!this._body) this._body = {};
    if (!this._body.link) this._body.link = [];
    this._body.link.push(link);
    return this;
  }

  /** Add a data element to the body. */
  data(data: DataElement): this {
    if (!this._body) this._body = {};
    if (!this._body.data) this._body.data = [];
    this._body.data.push(data);
    return this;
  }

  /** Set navigation/pagination on the body. */
  nav(nav: NavElement): this {
    if (!this._body) this._body = {};
    this._body.nav = nav;
    return this;
  }

  /** Set the usage rights level. */
  rights(level: UsageRight): this {
    if (!this._footer) this._footer = {};
    this._footer.rights = { usage: level };
    return this;
  }

  /** Set the body content as plain text. */
  body(content: string): this {
    if (!this._body) this._body = {};
    this._body.content = content;
    return this;
  }

  /** Build the final AnmlDocument instance with convenience methods. */
  build(): AnmlDocumentInstance {
    const doc: AnmlDocumentType = { version: "1.0" };

    if (this._ttl !== undefined) doc.ttl = this._ttl;
    if (this._lang) doc.lang = this._lang;

    if (this._head.title || (this._head.meta && this._head.meta.length > 0)) {
      doc.head = this._head;
    }
    if (this._constraints) doc.constraints = this._constraints;
    if (this._state) doc.state = this._state;
    if (this._interact) doc.interact = this._interact;
    if (this._knowledge) doc.knowledge = this._knowledge;
    if (this._persona) doc.persona = this._persona;
    if (this._aesthetic) doc.aesthetic = this._aesthetic;
    if (this._body) doc.body = this._body;
    if (this._footer) doc.footer = this._footer;

    return new AnmlDocumentInstance(doc);
  }

  /** Convenience: build and serialize to XML. */
  toXml(): string {
    return toXml(this.build().data);
  }

  /** Convenience: build and serialize to JSON. */
  toJson(): string {
    return toJson(this.build().data);
  }
}

// Re-export for convenience — allows: import { AnmlDocument } from "./builder.js"
export { AnmlDocumentInstance as AnmlDocument };

