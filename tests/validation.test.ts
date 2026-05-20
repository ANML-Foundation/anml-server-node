import { describe, it, expect } from "vitest";
import { validate } from "../src/validation.js";
import { DocumentBuilder } from "../src/builder.js";
import type { AnmlDocument } from "../src/types.js";

describe("validate", () => {
  it("returns no errors for a valid document", () => {
    const doc = new DocumentBuilder()
      .title("Valid Document")
      .ttl(300)
      .disclosure("email", { requires: "explicit-consent" })
      .flow([
        { id: "step1", status: "current" },
        { id: "step2", status: "pending" },
      ])
      .context("step1")
      .action("submit", { method: "POST", endpoint: "/api/submit" })
      .ask("email", { action: "submit", required: true })
      .inform("Hello world")
      .rights("display")
      .build();

    const errors = validate(doc);
    expect(errors).toHaveLength(0);
  });

  it("reports missing version", () => {
    const doc = { version: "" } as AnmlDocument;
    const errors = validate(doc);

    expect(errors.some((e) => e.path === "version")).toBe(true);
  });

  it("warns on unsupported version", () => {
    const doc = { version: "2.0" } as AnmlDocument;
    const errors = validate(doc);

    const versionError = errors.find((e) => e.path === "version");
    expect(versionError?.severity).toBe("warning");
  });

  it("reports negative TTL", () => {
    const doc: AnmlDocument = { version: "1.0", ttl: -1 };
    const errors = validate(doc);

    expect(errors.some((e) => e.path === "ttl" && e.severity === "error")).toBe(true);
  });

  it("warns on non-integer TTL", () => {
    const doc: AnmlDocument = { version: "1.0", ttl: 3.5 };
    const errors = validate(doc);

    expect(errors.some((e) => e.path === "ttl" && e.severity === "warning")).toBe(true);
  });

  it("reports duplicate step ids", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      state: {
        flow: {
          step: [
            { id: "dup", status: "current" },
            { id: "dup", status: "pending" },
          ],
        },
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Duplicate step id"))).toBe(true);
  });

  it("reports context step not matching flow", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      state: {
        context: { step: "nonexistent" },
        flow: {
          step: [{ id: "step1", status: "current" }],
        },
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.path === "state.context.step")).toBe(true);
  });

  it("reports duplicate action ids", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      interact: {
        action: [
          { id: "act", endpoint: "/a" },
          { id: "act", endpoint: "/b" },
        ],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Duplicate action id"))).toBe(true);
  });

  it("reports action without endpoint", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      interact: {
        action: [{ id: "test", endpoint: "" }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("endpoint"))).toBe(true);
  });

  it("reports invalid HTTP method", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      interact: {
        action: [{ id: "test", endpoint: "/api", method: "INVALID" as any }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Invalid HTTP method"))).toBe(true);
  });

  it("reports ask referencing non-existent action", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      interact: {
        action: [{ id: "real-action", endpoint: "/api" }],
      },
      knowledge: {
        ask: [{ field: "email", action: "fake-action" }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("fake-action"))).toBe(true);
  });

  it("reports ask without field", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      knowledge: {
        ask: [{ field: "", action: "submit" }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.path.includes("ask") && e.message.includes("field"))).toBe(true);
  });

  it("reports inform without content", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      knowledge: {
        inform: [{ content: "" }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("content"))).toBe(true);
  });

  it("reports invalid disclosure requires value", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      constraints: {
        disclosure: [{ field: "email", requires: "invalid" as any }],
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Invalid requires value"))).toBe(true);
  });

  it("reports invalid usage in footer rights", () => {
    const doc: AnmlDocument = {
      version: "1.0",
      footer: {
        rights: { usage: "invalid" as any },
      },
    };
    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Invalid usage value"))).toBe(true);
  });
});
