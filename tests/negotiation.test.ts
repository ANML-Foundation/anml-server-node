import { describe, it, expect } from "vitest";
import { negotiateContentType, parseAcceptHeader } from "../src/negotiation.js";
import { CONTENT_TYPE_XML, CONTENT_TYPE_JSON } from "../src/serializer.js";

describe("parseAcceptHeader", () => {
  it("parses simple accept header", () => {
    const entries = parseAcceptHeader("application/anml+xml");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.type).toBe("application/anml+xml");
    expect(entries[0]?.q).toBe(1.0);
  });

  it("parses multiple types with q-values", () => {
    const entries = parseAcceptHeader("application/anml+json;q=0.5, application/anml+xml;q=1.0");
    expect(entries).toHaveLength(2);
    expect(entries[0]?.type).toBe("application/anml+xml");
    expect(entries[0]?.q).toBe(1.0);
    expect(entries[1]?.type).toBe("application/anml+json");
    expect(entries[1]?.q).toBe(0.5);
  });

  it("returns empty array for empty header", () => {
    const entries = parseAcceptHeader("");
    expect(entries).toHaveLength(0);
  });
});

describe("negotiateContentType", () => {
  it("returns XML for application/anml+xml", () => {
    expect(negotiateContentType("application/anml+xml")).toBe(CONTENT_TYPE_XML);
  });

  it("returns JSON for application/anml+json", () => {
    expect(negotiateContentType("application/anml+json")).toBe(CONTENT_TYPE_JSON);
  });

  it("returns XML for application/xml", () => {
    expect(negotiateContentType("application/xml")).toBe(CONTENT_TYPE_XML);
  });

  it("returns JSON for application/json", () => {
    expect(negotiateContentType("application/json")).toBe(CONTENT_TYPE_JSON);
  });

  it("respects q-values preferring XML", () => {
    const result = negotiateContentType("application/anml+json;q=0.5, application/anml+xml;q=1.0");
    expect(result).toBe(CONTENT_TYPE_XML);
  });

  it("respects q-values preferring JSON", () => {
    const result = negotiateContentType("application/anml+xml;q=0.5, application/anml+json;q=1.0");
    expect(result).toBe(CONTENT_TYPE_JSON);
  });

  it("defaults to XML when no ANML type is specified", () => {
    const result = negotiateContentType("text/html, */*");
    expect(result).toBe(CONTENT_TYPE_XML);
  });

  it("defaults to XML for empty accept header", () => {
    const result = negotiateContentType("");
    expect(result).toBe(CONTENT_TYPE_XML);
  });
});
