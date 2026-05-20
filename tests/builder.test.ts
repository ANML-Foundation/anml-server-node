import { describe, it, expect } from "vitest";
import { DocumentBuilder } from "../src/builder.js";

describe("DocumentBuilder", () => {
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
    expect(doc.head?.meta?.[1]).toEqual({ name: "author", value: "test" });
  });

  it("sets persona with tone and instructions", () => {
    const doc = new DocumentBuilder()
      .persona({ tone: "friendly", instructions: "Be helpful." })
      .build();

    expect(doc.persona?.tone?.value).toBe("friendly");
    expect(doc.persona?.instructions).toBe("Be helpful.");
  });

  it("sets brand/aesthetic information", () => {
    const doc = new DocumentBuilder()
      .brand({
        name: "Acme",
        logoUrl: "https://acme.example/logo.png",
        color: "#2563eb",
        iconUrl: "https://acme.example/icon.png",
      })
      .build();

    expect(doc.aesthetic?.displayName).toBe("Acme");
    expect(doc.aesthetic?.logo).toHaveLength(2);
    expect(doc.aesthetic?.logo?.[0]?.src).toBe("https://acme.example/logo.png");
    expect(doc.aesthetic?.logo?.[1]?.variant).toBe("icon");
    expect(doc.aesthetic?.colors?.[0]?.value).toBe("#2563eb");
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

  it("defines flow steps and context", () => {
    const doc = new DocumentBuilder()
      .flow([
        { id: "step1", label: "First", status: "completed" },
        { id: "step2", label: "Second", status: "current" },
        { id: "step3", label: "Third", status: "pending", required: true },
      ])
      .context("step2")
      .build();

    expect(doc.state?.flow?.step).toHaveLength(3);
    expect(doc.state?.flow?.step?.[2]?.required).toBe(true);
    expect(doc.state?.context?.step).toBe("step2");
  });

  it("adds actions with params", () => {
    const doc = new DocumentBuilder()
      .action("submit", {
        method: "POST",
        endpoint: "/api/submit",
        auth: "required",
        enctype: "application/json",
        confirm: true,
        params: [
          { name: "email", required: true, type: "string", description: "User email" },
          { name: "age", required: false, type: "number" },
        ],
      })
      .build();

    const action = doc.interact?.action?.[0];
    expect(action?.id).toBe("submit");
    expect(action?.method).toBe("POST");
    expect(action?.endpoint).toBe("/api/submit");
    expect(action?.confirm).toBe(true);
    expect(action?.params).toHaveLength(2);
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

  it("sets body content", () => {
    const doc = new DocumentBuilder()
      .body("Hello, world!")
      .build();

    expect(doc.body?.content).toBe("Hello, world!");
  });

  it("sets rights", () => {
    const doc = new DocumentBuilder().rights("display").build();

    expect(doc.footer?.rights?.usage).toBe("display");
  });

  it("adds media elements", () => {
    const doc = new DocumentBuilder()
      .media("https://example.com/img.png", {
        mediaType: "image/png",
        description: "A test image",
        alt: "Test",
      })
      .build();

    expect(doc.body?.img).toHaveLength(1);
    expect(doc.body?.img?.[0]?.src).toBe("https://example.com/img.png");
    expect(doc.body?.img?.[0]?.description).toBe("A test image");
  });

  it("chains all methods fluently", () => {
    const doc = new DocumentBuilder()
      .title("Checkout")
      .ttl(300)
      .lang("en")
      .brand({ name: "Shop", color: "#000" })
      .persona({ tone: "helpful" })
      .disclosure("payment", { requires: "explicit-consent" })
      .flow([
        { id: "cart", status: "completed" },
        { id: "pay", status: "current" },
      ])
      .context("pay")
      .action("pay-action", { method: "POST", endpoint: "/pay" })
      .inform("Free shipping over $50")
      .ask("card", { action: "pay-action", required: true })
      .rights("cache")
      .body("Your cart total: $42.00")
      .build();

    expect(doc.version).toBe("1.0");
    expect(doc.head?.title).toBe("Checkout");
    expect(doc.ttl).toBe(300);
    expect(doc.aesthetic?.displayName).toBe("Shop");
    expect(doc.persona?.tone?.value).toBe("helpful");
    expect(doc.constraints?.disclosure).toHaveLength(1);
    expect(doc.state?.flow?.step).toHaveLength(2);
    expect(doc.interact?.action).toHaveLength(1);
    expect(doc.knowledge?.inform).toHaveLength(1);
    expect(doc.knowledge?.ask).toHaveLength(1);
    expect(doc.footer?.rights?.usage).toBe("cache");
    expect(doc.body?.content).toBe("Your cart total: $42.00");
  });

  it("provides toXml() convenience method", () => {
    const xml = new DocumentBuilder().title("Test").toXml();

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("urn:ietf:params:xml:ns:anml:1.0");
    expect(xml).toContain("<title>Test</title>");
  });

  it("provides toJson() convenience method", () => {
    const json = new DocumentBuilder().title("Test").toJson();
    const parsed = JSON.parse(json);

    expect(parsed.anml).toBe("1.0");
    expect(parsed.head.title).toBe("Test");
  });
});
