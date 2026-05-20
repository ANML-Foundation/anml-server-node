import { describe, it, expect } from "vitest";
import { toXml, toJson, negotiate, CONTENT_TYPE_XML, CONTENT_TYPE_JSON } from "../src/serializer.js";
import { DocumentBuilder } from "../src/builder.js";
import type { AnmlDocument } from "../src/types.js";

describe("toJson", () => {
  it("serializes a minimal document", () => {
    const doc: AnmlDocument = { version: "1.0", head: { title: "Test" } };
    const json = JSON.parse(toJson(doc));

    expect(json.anml).toBe("1.0");
    expect(json.head.title).toBe("Test");
  });

  it("serializes TTL as a number", () => {
    const doc: AnmlDocument = { version: "1.0", ttl: 3600 };
    const json = JSON.parse(toJson(doc));

    expect(json.ttl).toBe(3600);
  });

  it("serializes constraints with disclosure array", () => {
    const doc = new DocumentBuilder()
      .disclosure("email", { requires: "explicit-consent" })
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.constraints.disclosure).toBeInstanceOf(Array);
    expect(json.constraints.disclosure[0].field).toBe("email");
    expect(json.constraints.disclosure[0].requires).toBe("explicit-consent");
  });

  it("serializes state with flow steps", () => {
    const doc = new DocumentBuilder()
      .flow([
        { id: "s1", label: "Step 1", status: "current" },
        { id: "s2", label: "Step 2", status: "pending", required: true },
      ])
      .context("s1")
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.state.context.step).toBe("s1");
    expect(json.state.flow.step).toHaveLength(2);
    expect(json.state.flow.step[1].required).toBe(true);
  });

  it("serializes actions with params", () => {
    const doc = new DocumentBuilder()
      .action("submit", {
        method: "POST",
        endpoint: "/api/submit",
        params: [{ name: "email", required: true }],
      })
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.interact.action[0].id).toBe("submit");
    expect(json.interact.action[0].param[0].name).toBe("email");
  });

  it("serializes knowledge section", () => {
    const doc = new DocumentBuilder()
      .inform("Hello", { ttl: 60 })
      .ask("name", { action: "submit", required: false, purpose: "greeting" })
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.knowledge.inform[0].content).toBe("Hello");
    expect(json.knowledge.inform[0].ttl).toBe(60);
    expect(json.knowledge.ask[0].field).toBe("name");
    expect(json.knowledge.ask[0].purpose).toBe("greeting");
  });

  it("serializes persona section", () => {
    const doc = new DocumentBuilder()
      .persona({ tone: "friendly", instructions: "Be concise." })
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.persona.tone.value).toBe("friendly");
    expect(json.persona.instructions).toBe("Be concise.");
  });

  it("serializes aesthetic section", () => {
    const doc = new DocumentBuilder()
      .brand({ name: "Acme", logoUrl: "https://acme.example/logo.png", color: "#fff" })
      .build();
    const json = JSON.parse(toJson(doc));

    expect(json.aesthetic["display-name"]).toBe("Acme");
    expect(json.aesthetic.logo[0].src).toBe("https://acme.example/logo.png");
    expect(json.aesthetic.colors.color[0].value).toBe("#fff");
  });

  it("serializes footer with rights", () => {
    const doc = new DocumentBuilder().rights("cache").build();
    const json = JSON.parse(toJson(doc));

    expect(json.footer.rights.usage).toBe("cache");
  });
});

describe("toXml", () => {
  it("produces valid XML with declaration and namespace", () => {
    const doc: AnmlDocument = { version: "1.0", head: { title: "Test" } };
    const xml = toXml(doc);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="urn:ietf:params:xml:ns:anml:1.0"');
    expect(xml).toContain("<title>Test</title>");
  });

  it("includes TTL as attribute on root element", () => {
    const doc: AnmlDocument = { version: "1.0", ttl: 300 };
    const xml = toXml(doc);

    expect(xml).toContain('ttl="300"');
  });

  it("serializes disclosure constraints", () => {
    const doc = new DocumentBuilder()
      .disclosure("payment", { requires: "explicit-consent" })
      .build();
    const xml = toXml(doc);

    expect(xml).toContain("<constraints>");
    expect(xml).toContain('field="payment"');
    expect(xml).toContain('requires="explicit-consent"');
  });

  it("serializes flow steps with attributes", () => {
    const doc = new DocumentBuilder()
      .flow([{ id: "checkout", label: "Checkout", status: "current" }])
      .build();
    const xml = toXml(doc);

    expect(xml).toContain('<step id="checkout"');
    expect(xml).toContain('label="Checkout"');
    expect(xml).toContain('status="current"');
  });

  it("serializes actions", () => {
    const doc = new DocumentBuilder()
      .action("pay", { method: "POST", endpoint: "/pay", confirm: true })
      .build();
    const xml = toXml(doc);

    expect(xml).toContain('<action id="pay"');
    expect(xml).toContain('method="POST"');
    expect(xml).toContain('endpoint="/pay"');
    expect(xml).toContain('confirm="true"');
  });

  it("serializes inform with text content", () => {
    const doc = new DocumentBuilder()
      .inform("Free shipping over $50", { ttl: 3600 })
      .build();
    const xml = toXml(doc);

    expect(xml).toContain("<knowledge>");
    expect(xml).toContain("Free shipping over $50");
    expect(xml).toContain('ttl="3600"');
  });

  it("serializes persona tone", () => {
    const doc = new DocumentBuilder()
      .persona({ tone: "formal" })
      .build();
    const xml = toXml(doc);

    expect(xml).toContain('<tone value="formal"');
  });
});

describe("negotiate", () => {
  const doc: AnmlDocument = { version: "1.0", head: { title: "Test" } };

  it("returns JSON for application/anml+json", () => {
    const result = negotiate(doc, "application/anml+json");

    expect(result.contentType).toBe(CONTENT_TYPE_JSON);
    expect(JSON.parse(result.content).anml).toBe("1.0");
  });

  it("returns XML for application/anml+xml", () => {
    const result = negotiate(doc, "application/anml+xml");

    expect(result.contentType).toBe(CONTENT_TYPE_XML);
    expect(result.content).toContain("<?xml");
  });

  it("respects q-values preferring XML", () => {
    const result = negotiate(doc, "application/anml+json;q=0.5, application/anml+xml;q=1.0");

    expect(result.contentType).toBe(CONTENT_TYPE_XML);
  });

  it("respects q-values preferring JSON", () => {
    const result = negotiate(doc, "application/anml+xml;q=0.5, application/anml+json;q=1.0");

    expect(result.contentType).toBe(CONTENT_TYPE_JSON);
  });

  it("defaults to JSON when no ANML type is specified", () => {
    const result = negotiate(doc, "text/html, */*");

    expect(result.contentType).toBe(CONTENT_TYPE_JSON);
  });

  it("handles empty accept header", () => {
    const result = negotiate(doc, "");

    expect(result.contentType).toBe(CONTENT_TYPE_JSON);
  });
});
