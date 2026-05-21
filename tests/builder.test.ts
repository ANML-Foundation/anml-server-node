import { describe, it, expect } from "vitest";
import { AnmlDocument, DocumentBuilder } from "../src/builder.js";

describe("DocumentBuilder", () => {
  it("creates a builder via AnmlDocument.builder()", () => {
    const doc = AnmlDocument.builder().title("Test").build();
    expect(doc.version).toBe("1.0");
    expect(doc.head?.title).toBe("Test");
  });

  it("builds a minimal document with just a title", () => {
    const doc = new DocumentBuilder().title("Test").build();
    expect(doc.version).toBe("1.0");
    expect(doc.head?.title).toBe("Test");
  });

  it("sets TTL and language", () => {
    const doc = new DocumentBuilder().ttl(300).lang("en").build();
    expect(doc.ttl).toBe(300);
    expect(doc.lang).toBe("en");
  });

  it("adds meta entries", () => {
    const doc = new DocumentBuilder()
      .meta("type", "service")
      .meta("author", "test")
      .build();
    expect(doc.head?.meta).toHaveLength(2);
    expect(doc.head?.meta?.[0]).toEqual({ name: "type", value: "service" });
  });

  it("sets persona with tone and instructions", () => {
    const doc = new DocumentBuilder()
      .persona({ tone: "friendly", instructions: "Be helpful." })
      .build();
    expect(doc.persona?.tone?.value).toBe("friendly");
    expect(doc.persona?.instructions).toBe("Be helpful.");
  });

  it("sets persona with brandColor and logoUrl", () => {
    const doc = AnmlDocument.builder()
      .persona({
        tone: "helpful",
        instructions: "Show itemized totals.",
        brandColor: "#4F46E5",
        logoUrl: "https://acme.example.com/logo.png",
      })
      .build();
    expect(doc.persona?.tone?.value).toBe("helpful");
    expect(doc.aesthetic?.colors?.[0]?.value).toBe("#4F46E5");
    expect(doc.aesthetic?.logo?.[0]?.src).toBe("https://acme.example.com/logo.png");
  });

  it("adds disclosure constraints", () => {
    const doc = new DocumentBuilder()
      .disclosure("email", { requires: "explicit-consent" })
      .disclosure("name", { requires: "implicit-consent" })
      .build();
    expect(doc.constraints?.disclosure).toHaveLength(2);
    expect(doc.constraints?.disclosure?.[0]).toEqual({
      field: "email",
      requires: "explicit-consent",
    });
  });

  it("defines flow steps", () => {
    const doc = new DocumentBuilder()
      .flow([
        { id: "step1", label: "First", status: "completed" },
        { id: "step2", label: "Second", status: "current" },
        { id: "step3", label: "Third", status: "pending" },
      ])
      .build();
    expect(doc.state?.flow?.step).toHaveLength(3);
    expect(doc.state?.flow?.step?.[1]?.status).toBe("current");
  });

  it("adds actions with params", () => {
    const doc = new DocumentBuilder()
      .action("submit", {
        method: "POST",
        endpoint: "/api/submit",
        auth: "required",
        confirm: true,
        params: [
          { name: "email", required: true, type: "string" },
        ],
      })
      .build();
    const action = doc.interact?.action?.[0];
    expect(action?.id).toBe("submit");
    expect(action?.method).toBe("POST");
    expect(action?.confirm).toBe(true);
    expect(action?.params?.[0]?.name).toBe("email");
  });

  it("adds inform and ask to knowledge", () => {
    const doc = new DocumentBuilder()
      .inform("We ship worldwide.", { confidentiality: "public", ttl: 3600 })
      .ask("email", { action: "submit", required: true, purpose: "receipt" })
      .build();
    expect(doc.knowledge?.inform?.[0]?.content).toBe("We ship worldwide.");
    expect(doc.knowledge?.inform?.[0]?.ttl).toBe(3600);
    expect(doc.knowledge?.ask?.[0]?.field).toBe("email");
    expect(doc.knowledge?.ask?.[0]?.required).toBe(true);
  });

  it("adds media elements", () => {
    const doc = new DocumentBuilder()
      .media("https://example.com/logo.png", { type: "image/png", description: "Acme logo" })
      .build();
    expect(doc.body?.img).toHaveLength(1);
    expect(doc.body?.img?.[0]?.src).toBe("https://example.com/logo.png");
    expect(doc.body?.img?.[0]?.description).toBe("Acme logo");
  });

  it("sets rights", () => {
    const doc = new DocumentBuilder().rights("cache").build();
    expect(doc.footer?.rights?.usage).toBe("cache");
  });

  it("sets body content", () => {
    const doc = new DocumentBuilder().body("Hello, world!").build();
    expect(doc.body?.content).toBe("Hello, world!");
  });

  it("chains all methods fluently (full checkout example)", () => {
    const doc = AnmlDocument.builder()
      .title("Acme Electronics — Checkout")
      .ttl(300)
      .persona({
        tone: "helpful",
        instructions: "Show itemized totals. Confirm before payment.",
        brandColor: "#4F46E5",
        logoUrl: "https://acme.example.com/logo.png",
      })
      .disclosure("payment-credential", { requires: "explicit-consent" })
      .disclosure("shipping-address", { requires: "explicit-consent" })
      .flow([
        { id: "browse", label: "Browse", status: "completed" },
        { id: "checkout", label: "Checkout", status: "current", action: "submit-order" },
        { id: "confirm", label: "Confirmed", status: "pending" },
      ])
      .action("submit-order", {
        method: "POST",
        endpoint: "/api/orders",
        auth: "required",
        confirm: true,
      })
      .inform("Free shipping on orders over $75.", { ttl: 3600, confidentiality: "public" })
      .ask("email", { action: "submit-order", required: true, purpose: "receipt" })
      .ask("shipping-address", { action: "submit-order", required: true, purpose: "delivery" })
      .media("https://acme.example.com/logo.png", { type: "image/png", description: "Acme logo" })
      .rights("cache")
      .body("4K Monitor x1 — $599.00 | USB-C Cable x2 — $29.98")
      .build();

    expect(doc.version).toBe("1.0");
    expect(doc.head?.title).toBe("Acme Electronics — Checkout");
    expect(doc.ttl).toBe(300);
    expect(doc.persona?.tone?.value).toBe("helpful");
    expect(doc.constraints?.disclosure).toHaveLength(2);
    expect(doc.state?.flow?.step).toHaveLength(3);
    expect(doc.interact?.action).toHaveLength(1);
    expect(doc.knowledge?.inform).toHaveLength(1);
    expect(doc.knowledge?.ask).toHaveLength(2);
    expect(doc.body?.img).toHaveLength(1);
    expect(doc.footer?.rights?.usage).toBe("cache");
    expect(doc.body?.content).toBe("4K Monitor x1 — $599.00 | USB-C Cable x2 — $29.98");
  });

  it("provides toXml() convenience method", () => {
    const xml = AnmlDocument.builder().title("Test").build().toXml();
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("urn:ietf:params:xml:ns:anml:1.0");
    expect(xml).toContain("<title>Test</title>");
  });

  it("provides toJson() convenience method", () => {
    const json = AnmlDocument.builder().title("Test").build().toJson();
    const parsed = JSON.parse(json);
    expect(parsed.anml).toBe("1.0");
    expect(parsed.head.title).toBe("Test");
  });

  it("builder toXml() shortcut works", () => {
    const xml = new DocumentBuilder().title("Quick").toXml();
    expect(xml).toContain("<title>Quick</title>");
  });

  it("builder toJson() shortcut works", () => {
    const json = new DocumentBuilder().title("Quick").toJson();
    const parsed = JSON.parse(json);
    expect(parsed.head.title).toBe("Quick");
  });
});
