/**
 * ANML 1.0 Serialization — XML and JSON output with content negotiation.
 */

import { XMLBuilder } from "fast-xml-parser";
import type {
  AnmlDocument,
  Action,
  Ask,
  Body,
  BodySection,
  Inform,
  Step,
} from "./types.js";

const ANML_NAMESPACE = "urn:ietf:params:xml:ns:anml:1.0";
const CONTENT_TYPE_XML = "application/anml+xml";
const CONTENT_TYPE_JSON = "application/anml+json";

// ─── JSON Serialization ──────────────────────────────────────────────────────

/**
 * Serialize an AnmlDocument to its JSON representation per the ANML 1.0 spec.
 */
export function toJson(doc: AnmlDocument): string {
  const json = buildJsonObject(doc);
  return JSON.stringify(json, null, 2);
}

function buildJsonObject(doc: AnmlDocument): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    anml: doc.version,
  };

  if (doc.lang) obj.lang = doc.lang;
  if (doc.ttl !== undefined) obj.ttl = doc.ttl;
  if (doc.role) obj.role = doc.role;
  if (doc.supportedVersions) obj["supported-versions"] = doc.supportedVersions;

  // Head
  if (doc.head) {
    const head: Record<string, unknown> = {};
    if (doc.head.title) head.title = doc.head.title;
    if (doc.head.meta && doc.head.meta.length > 0) {
      head.meta = doc.head.meta.map((m) => ({ name: m.name, value: m.value }));
    }
    obj.head = head;
  }

  // Constraints
  if (doc.constraints?.disclosure && doc.constraints.disclosure.length > 0) {
    obj.constraints = {
      disclosure: doc.constraints.disclosure.map((d) => ({
        field: d.field,
        requires: d.requires,
      })),
    };
  }

  // State
  if (doc.state) {
    const state: Record<string, unknown> = {};
    if (doc.state.context) {
      state.context = { step: doc.state.context.step };
    }
    if (doc.state.flow) {
      state.flow = {
        step: doc.state.flow.step.map((s) => buildStepJson(s)),
      };
    }
    obj.state = state;
  }

  // Interact
  if (doc.interact?.action && doc.interact.action.length > 0) {
    obj.interact = {
      action: doc.interact.action.map((a) => buildActionJson(a)),
    };
  }

  // Knowledge
  if (doc.knowledge) {
    const knowledge: Record<string, unknown> = {};
    if (doc.knowledge.inform && doc.knowledge.inform.length > 0) {
      knowledge.inform = doc.knowledge.inform.map((i) => buildInformJson(i));
    }
    if (doc.knowledge.ask && doc.knowledge.ask.length > 0) {
      knowledge.ask = doc.knowledge.ask.map((a) => buildAskJson(a));
    }
    if (doc.knowledge.answer && doc.knowledge.answer.length > 0) {
      knowledge.answer = doc.knowledge.answer.map((a) => ({
        field: a.field,
        value: a.value,
        ...(a.consent ? { consent: a.consent } : {}),
      }));
    }
    if (doc.knowledge.refuse && doc.knowledge.refuse.length > 0) {
      knowledge.refuse = doc.knowledge.refuse.map((r) => ({
        field: r.field,
        reason: r.reason,
        ...(r.constraint ? { constraint: r.constraint } : {}),
        ...(r.message ? { message: r.message } : {}),
      }));
    }
    obj.knowledge = knowledge;
  }

  // Persona
  if (doc.persona) {
    const persona: Record<string, unknown> = {};
    if (doc.persona.model) persona.model = doc.persona.model;
    if (doc.persona.language) persona.language = doc.persona.language;
    if (doc.persona.tone) persona.tone = doc.persona.tone;
    if (doc.persona.voice) persona.voice = doc.persona.voice;
    if (doc.persona.instructions) persona.instructions = doc.persona.instructions;
    if (doc.persona.vocabulary) persona.vocabulary = doc.persona.vocabulary;
    obj.persona = persona;
  }

  // Aesthetic
  if (doc.aesthetic) {
    const aesthetic: Record<string, unknown> = {};
    if (doc.aesthetic.displayName) aesthetic["display-name"] = doc.aesthetic.displayName;
    if (doc.aesthetic.logo && doc.aesthetic.logo.length > 0) {
      aesthetic.logo = doc.aesthetic.logo;
    }
    if (doc.aesthetic.colors && doc.aesthetic.colors.length > 0) {
      aesthetic.colors = { color: doc.aesthetic.colors };
    }
    if (doc.aesthetic.typography && doc.aesthetic.typography.length > 0) {
      aesthetic.typography = { font: doc.aesthetic.typography };
    }
    obj.aesthetic = aesthetic;
  }

  // Body
  if (doc.body) {
    obj.body = buildBodyJson(doc.body);
  }

  // Footer
  if (doc.footer) {
    const footer: Record<string, unknown> = {};
    if (doc.footer.rights) {
      footer.rights = { ...doc.footer.rights };
    }
    if (doc.footer.attribution && doc.footer.attribution.length > 0) {
      footer.attribution = doc.footer.attribution;
    }
    obj.footer = footer;
  }

  // Status
  if (doc.status) {
    obj.status = {
      code: doc.status.code,
      result: doc.status.result,
      ...(doc.status.message ? { message: doc.status.message } : {}),
      ...(doc.status.retryAfter !== undefined ? { "retry-after": doc.status.retryAfter } : {}),
    };
  }

  return obj;
}

function buildStepJson(s: Step): Record<string, unknown> {
  return {
    id: s.id,
    ...(s.label ? { label: s.label } : {}),
    ...(s.status ? { status: s.status } : {}),
    ...(s.required !== undefined ? { required: s.required } : {}),
    ...(s.action ? { action: s.action } : {}),
    ...(s.next ? { next: s.next } : {}),
    ...(s.condition ? { condition: s.condition } : {}),
  };
}

function buildActionJson(a: Action): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: a.id,
    endpoint: a.endpoint,
  };
  if (a.method) obj.method = a.method;
  if (a.auth) obj.auth = a.auth;
  if (a.enctype) obj.enctype = a.enctype;
  if (a.confirm !== undefined) obj.confirm = a.confirm;
  if (a.idempotent !== undefined) obj.idempotent = a.idempotent;
  if (a.description) obj.description = a.description;
  if (a.params && a.params.length > 0) {
    obj.param = a.params.map((p) => ({
      name: p.name,
      ...(p.required !== undefined ? { required: p.required } : {}),
      ...(p.type ? { type: p.type } : {}),
      ...(p.description ? { description: p.description } : {}),
      ...(p.min !== undefined ? { min: p.min } : {}),
      ...(p.max !== undefined ? { max: p.max } : {}),
    }));
  }
  return obj;
}

function buildInformJson(i: Inform): Record<string, unknown> {
  return {
    content: i.content,
    ...(i.ttl !== undefined ? { ttl: i.ttl } : {}),
    ...(i.confidentiality ? { confidentiality: i.confidentiality } : {}),
  };
}

function buildAskJson(a: Ask): Record<string, unknown> {
  return {
    field: a.field,
    action: a.action,
    ...(a.required !== undefined ? { required: a.required } : {}),
    ...(a.purpose ? { purpose: a.purpose } : {}),
    ...(a.type ? { type: a.type } : {}),
  };
}

function buildBodyJson(body: Body): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (body.content) obj.content = body.content;
  if (body.usage) obj.usage = body.usage;
  if (body.section && body.section.length > 0) {
    obj.section = body.section.map((s) => buildSectionJson(s));
  }
  if (body.img && body.img.length > 0) obj.img = body.img;
  if (body.audio && body.audio.length > 0) obj.audio = body.audio;
  if (body.video && body.video.length > 0) obj.video = body.video;
  if (body.link && body.link.length > 0) obj.link = body.link;
  if (body.data && body.data.length > 0) obj.data = body.data;
  if (body.nav) obj.nav = body.nav;
  return obj;
}

function buildSectionJson(s: BodySection): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (s.id) obj.id = s.id;
  if (s.label) obj.label = s.label;
  if (s.usage) obj.usage = s.usage;
  if (s.content) obj.content = s.content;
  if (s.section && s.section.length > 0) {
    obj.section = s.section.map((sub) => buildSectionJson(sub));
  }
  return obj;
}

// ─── XML Serialization ───────────────────────────────────────────────────────

/**
 * Serialize an AnmlDocument to its XML representation per the ANML 1.0 spec.
 */
export function toXml(doc: AnmlDocument): string {
  const xmlObj = buildXmlObject(doc);

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
  });

  const xmlBody = builder.build(xmlObj) as string;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}

function buildXmlObject(doc: AnmlDocument): Record<string, unknown> {
  const anml: Record<string, unknown> = {
    "@_xmlns": ANML_NAMESPACE,
  };

  if (doc.ttl !== undefined) anml["@_ttl"] = doc.ttl;
  if (doc.lang) anml["@_lang"] = doc.lang;
  if (doc.role) anml["@_role"] = doc.role;
  if (doc.supportedVersions) anml["@_supported-versions"] = doc.supportedVersions;

  // Head
  if (doc.head) {
    const head: Record<string, unknown> = {};
    if (doc.head.title) head.title = doc.head.title;
    if (doc.head.meta && doc.head.meta.length > 0) {
      head.meta = doc.head.meta.map((m) => ({
        "@_name": m.name,
        "@_value": m.value,
      }));
    }
    anml.head = head;
  }

  // Constraints
  if (doc.constraints?.disclosure && doc.constraints.disclosure.length > 0) {
    anml.constraints = {
      disclosure: doc.constraints.disclosure.map((d) => ({
        "@_field": d.field,
        "@_requires": d.requires,
      })),
    };
  }

  // State
  if (doc.state) {
    const state: Record<string, unknown> = {};
    if (doc.state.context) {
      state.context = { step: doc.state.context.step };
    }
    if (doc.state.flow) {
      state.flow = {
        step: doc.state.flow.step.map((s) => {
          const stepObj: Record<string, unknown> = { "@_id": s.id };
          if (s.label) stepObj["@_label"] = s.label;
          if (s.status) stepObj["@_status"] = s.status;
          if (s.required !== undefined) stepObj["@_required"] = String(s.required);
          if (s.action) stepObj["@_action"] = s.action;
          if (s.next) stepObj["@_next"] = s.next;
          if (s.condition) stepObj["@_condition"] = s.condition;
          return stepObj;
        }),
      };
    }
    anml.state = state;
  }

  // Interact
  if (doc.interact?.action && doc.interact.action.length > 0) {
    anml.interact = {
      action: doc.interact.action.map((a) => {
        const actionObj: Record<string, unknown> = {
          "@_id": a.id,
          "@_endpoint": a.endpoint,
        };
        if (a.method) actionObj["@_method"] = a.method;
        if (a.auth) actionObj["@_auth"] = a.auth;
        if (a.enctype) actionObj["@_enctype"] = a.enctype;
        if (a.confirm !== undefined) actionObj["@_confirm"] = String(a.confirm);
        if (a.idempotent !== undefined) actionObj["@_idempotent"] = String(a.idempotent);
        if (a.description) actionObj["@_description"] = a.description;
        if (a.params && a.params.length > 0) {
          actionObj.param = a.params.map((p) => {
            const paramObj: Record<string, unknown> = { "@_name": p.name };
            if (p.required !== undefined) paramObj["@_required"] = String(p.required);
            if (p.type) paramObj["@_type"] = p.type;
            if (p.description) paramObj["@_description"] = p.description;
            if (p.min !== undefined) paramObj["@_min"] = p.min;
            if (p.max !== undefined) paramObj["@_max"] = p.max;
            return paramObj;
          });
        }
        return actionObj;
      }),
    };
  }

  // Knowledge
  if (doc.knowledge) {
    const knowledge: Record<string, unknown> = {};
    if (doc.knowledge.inform && doc.knowledge.inform.length > 0) {
      knowledge.inform = doc.knowledge.inform.map((i) => {
        const informObj: Record<string, unknown> = { "#text": i.content };
        if (i.ttl !== undefined) informObj["@_ttl"] = i.ttl;
        if (i.confidentiality) informObj["@_confidentiality"] = i.confidentiality;
        return informObj;
      });
    }
    if (doc.knowledge.ask && doc.knowledge.ask.length > 0) {
      knowledge.ask = doc.knowledge.ask.map((a) => {
        const askObj: Record<string, unknown> = {
          "@_field": a.field,
          "@_action": a.action,
        };
        if (a.required !== undefined) askObj["@_required"] = String(a.required);
        if (a.purpose) askObj["@_purpose"] = a.purpose;
        if (a.type) askObj["@_type"] = a.type;
        return askObj;
      });
    }
    if (doc.knowledge.answer && doc.knowledge.answer.length > 0) {
      knowledge.answer = doc.knowledge.answer.map((a) => ({
        "@_field": a.field,
        "@_value": a.value,
        ...(a.consent ? { "@_consent": a.consent } : {}),
      }));
    }
    if (doc.knowledge.refuse && doc.knowledge.refuse.length > 0) {
      knowledge.refuse = doc.knowledge.refuse.map((r) => ({
        "@_field": r.field,
        "@_reason": r.reason,
        ...(r.constraint ? { "@_constraint": r.constraint } : {}),
        ...(r.message ? { "@_message": r.message } : {}),
      }));
    }
    anml.knowledge = knowledge;
  }

  // Persona
  if (doc.persona) {
    const persona: Record<string, unknown> = {};
    if (doc.persona.model) {
      const model: Record<string, unknown> = {};
      if (doc.persona.model.name) model["@_name"] = doc.persona.model.name;
      if (doc.persona.model.provider) model["@_provider"] = doc.persona.model.provider;
      if (doc.persona.model.capability) model["@_capability"] = doc.persona.model.capability;
      persona.model = model;
    }
    if (doc.persona.language) {
      const lang: Record<string, unknown> = {};
      if (doc.persona.language.policy) lang["@_policy"] = doc.persona.language.policy;
      if (doc.persona.language.value) lang["@_value"] = doc.persona.language.value;
      persona.language = lang;
    }
    if (doc.persona.tone) persona.tone = { "@_value": doc.persona.tone.value };
    if (doc.persona.voice) {
      const voice: Record<string, unknown> = {};
      if (doc.persona.voice.perspective) voice["@_perspective"] = doc.persona.voice.perspective;
      if (doc.persona.voice.name) voice["@_name"] = doc.persona.voice.name;
      persona.voice = voice;
    }
    if (doc.persona.instructions) persona.instructions = doc.persona.instructions;
    if (doc.persona.vocabulary) {
      const vocab: Record<string, unknown> = {};
      if (doc.persona.vocabulary.prefer) vocab.prefer = doc.persona.vocabulary.prefer;
      if (doc.persona.vocabulary.avoid) vocab.avoid = doc.persona.vocabulary.avoid;
      persona.vocabulary = vocab;
    }
    anml.persona = persona;
  }

  // Aesthetic
  if (doc.aesthetic) {
    const aesthetic: Record<string, unknown> = {};
    if (doc.aesthetic.displayName) aesthetic["display-name"] = doc.aesthetic.displayName;
    if (doc.aesthetic.logo && doc.aesthetic.logo.length > 0) {
      aesthetic.logo = doc.aesthetic.logo.map((l) => ({
        "@_src": l.src,
        ...(l.alt ? { "@_alt": l.alt } : {}),
        ...(l.type ? { "@_type": l.type } : {}),
        ...(l.variant ? { "@_variant": l.variant } : {}),
      }));
    }
    if (doc.aesthetic.colors && doc.aesthetic.colors.length > 0) {
      aesthetic.colors = {
        color: doc.aesthetic.colors.map((c) => ({
          "@_role": c.role,
          "@_value": c.value,
        })),
      };
    }
    if (doc.aesthetic.typography && doc.aesthetic.typography.length > 0) {
      aesthetic.typography = {
        font: doc.aesthetic.typography.map((f) => ({
          "@_role": f.role,
          "@_family": f.family,
          ...(f.fallback ? { "@_fallback": f.fallback } : {}),
        })),
      };
    }
    anml.aesthetic = aesthetic;
  }

  // Body
  if (doc.body) {
    anml.body = buildBodyXml(doc.body);
  }

  // Footer
  if (doc.footer) {
    const footer: Record<string, unknown> = {};
    if (doc.footer.rights) {
      const rights: Record<string, unknown> = {};
      if (doc.footer.rights.holder) rights["@_holder"] = doc.footer.rights.holder;
      if (doc.footer.rights.year) rights["@_year"] = doc.footer.rights.year;
      if (doc.footer.rights.license) rights["@_license"] = doc.footer.rights.license;
      if (doc.footer.rights.usage) rights["@_usage"] = doc.footer.rights.usage;
      if (doc.footer.rights.scope) rights["@_scope"] = doc.footer.rights.scope;
      if (doc.footer.rights.content) rights["#text"] = doc.footer.rights.content;
      footer.rights = rights;
    }
    if (doc.footer.attribution && doc.footer.attribution.length > 0) {
      footer.attribution = doc.footer.attribution.map((a) => ({
        "#text": a.content,
        ...(a.required !== undefined ? { "@_required": String(a.required) } : {}),
        ...(a.scope ? { "@_scope": a.scope } : {}),
      }));
    }
    anml.footer = footer;
  }

  // Status
  if (doc.status) {
    anml.status = {
      "@_code": doc.status.code,
      "@_result": doc.status.result,
      ...(doc.status.message ? { "@_message": doc.status.message } : {}),
      ...(doc.status.retryAfter !== undefined ? { "@_retry-after": doc.status.retryAfter } : {}),
    };
  }

  return { anml };
}

function buildBodyXml(body: Body): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (body.usage) obj["@_usage"] = body.usage;
  if (body.content) obj["#text"] = body.content;
  if (body.section && body.section.length > 0) {
    obj.section = body.section.map((s) => buildSectionXml(s));
  }
  if (body.img && body.img.length > 0) {
    obj.img = body.img.map((i) => ({
      "@_src": i.src,
      ...(i.type ? { "@_type": i.type } : {}),
      ...(i.inference ? { "@_inference": i.inference } : {}),
      ...(i.width ? { "@_width": i.width } : {}),
      ...(i.height ? { "@_height": i.height } : {}),
      ...(i.usage ? { "@_usage": i.usage } : {}),
      ...(i.description ? { description: i.description } : {}),
    }));
  }
  if (body.audio && body.audio.length > 0) {
    obj.audio = body.audio.map((a) => ({
      "@_src": a.src,
      ...(a.type ? { "@_type": a.type } : {}),
      ...(a.inference ? { "@_inference": a.inference } : {}),
      ...(a.duration ? { "@_duration": a.duration } : {}),
      ...(a.lang ? { "@_lang": a.lang } : {}),
      ...(a.usage ? { "@_usage": a.usage } : {}),
      ...(a.transcript ? { transcript: a.transcript } : {}),
      ...(a.description ? { description: a.description } : {}),
    }));
  }
  if (body.video && body.video.length > 0) {
    obj.video = body.video.map((v) => ({
      "@_src": v.src,
      ...(v.type ? { "@_type": v.type } : {}),
      ...(v.inference ? { "@_inference": v.inference } : {}),
      ...(v.duration ? { "@_duration": v.duration } : {}),
      ...(v.width ? { "@_width": v.width } : {}),
      ...(v.height ? { "@_height": v.height } : {}),
      ...(v.lang ? { "@_lang": v.lang } : {}),
      ...(v.usage ? { "@_usage": v.usage } : {}),
      ...(v.transcript ? { transcript: v.transcript } : {}),
      ...(v.description ? { description: v.description } : {}),
    }));
  }
  if (body.link && body.link.length > 0) {
    obj.link = body.link.map((l) => ({
      "@_href": l.href,
      ...(l.rel ? { "@_rel": l.rel } : {}),
      ...(l.type ? { "@_type": l.type } : {}),
      ...(l.label ? { "@_label": l.label } : {}),
    }));
  }
  if (body.nav) {
    const nav: Record<string, unknown> = {};
    if (body.nav.next) nav["@_next"] = body.nav.next;
    if (body.nav.prev) nav["@_prev"] = body.nav.prev;
    if (body.nav.cursor) nav["@_cursor"] = body.nav.cursor;
    if (body.nav.total !== undefined) nav["@_total"] = body.nav.total;
    obj.nav = nav;
  }
  return obj;
}

function buildSectionXml(s: BodySection): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (s.id) obj["@_id"] = s.id;
  if (s.label) obj["@_label"] = s.label;
  if (s.usage) obj["@_usage"] = s.usage;
  if (s.content) obj["#text"] = s.content;
  if (s.section && s.section.length > 0) {
    obj.section = s.section.map((sub) => buildSectionXml(sub));
  }
  return obj;
}

// ─── Content Negotiation ─────────────────────────────────────────────────────

export interface NegotiatedResponse {
  content: string;
  contentType: string;
}

/**
 * Negotiate the best serialization format based on the Accept header.
 * Defaults to JSON if no preference is expressed.
 */
export function negotiate(doc: AnmlDocument, acceptHeader: string): NegotiatedResponse {
  const normalized = acceptHeader.toLowerCase();

  // Parse accept header entries with q-values
  const entries = normalized.split(",").map((entry) => {
    const parts = entry.trim().split(";");
    const type = parts[0]!.trim();
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

  for (const entry of entries) {
    if (entry.type === CONTENT_TYPE_XML || entry.type === "application/xml") {
      return { content: toXml(doc), contentType: CONTENT_TYPE_XML };
    }
    if (entry.type === CONTENT_TYPE_JSON || entry.type === "application/json") {
      return { content: toJson(doc), contentType: CONTENT_TYPE_JSON };
    }
  }

  // Default to JSON for agent consumption
  return { content: toJson(doc), contentType: CONTENT_TYPE_JSON };
}

export { CONTENT_TYPE_XML, CONTENT_TYPE_JSON, ANML_NAMESPACE };
