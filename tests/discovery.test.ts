import { describe, it, expect } from "vitest";
import {
  WELL_KNOWN_PATH,
  linkHeader,
  htmlLinkTag,
  discoveryDocument,
} from "../src/discovery.js";

describe("discovery", () => {
  describe("WELL_KNOWN_PATH", () => {
    it("is /.well-known/anml", () => {
      expect(WELL_KNOWN_PATH).toBe("/.well-known/anml");
    });
  });

  describe("linkHeader", () => {
    it("generates a valid Link header value", () => {
      const header = linkHeader("/api/checkout");

      expect(header).toBe(
        '</api/checkout>; rel="alternate"; type="application/anml+xml"'
      );
    });

    it("handles absolute URLs", () => {
      const header = linkHeader("https://example.com/.well-known/anml");

      expect(header).toContain("https://example.com/.well-known/anml");
      expect(header).toContain('rel="alternate"');
      expect(header).toContain('type="application/anml+xml"');
    });
  });

  describe("htmlLinkTag", () => {
    it("generates a valid HTML link element", () => {
      const tag = htmlLinkTag("/api/checkout");

      expect(tag).toBe(
        '<link rel="alternate" type="application/anml+xml" href="/api/checkout" />'
      );
    });
  });

  describe("discoveryDocument", () => {
    it("generates a minimal discovery document", () => {
      const json = JSON.parse(discoveryDocument());

      expect(json.anml).toBe("1.0");
      expect(json.head.title).toBe("ANML Service");
      expect(json.head.meta[0].name).toBe("type");
      expect(json.head.meta[0].value).toBe("discovery");
    });

    it("includes custom title", () => {
      const json = JSON.parse(discoveryDocument({ title: "My API" }));

      expect(json.head.title).toBe("My API");
    });

    it("includes endpoint listing", () => {
      const json = JSON.parse(
        discoveryDocument({
          endpoints: [
            { path: "/api/checkout", description: "Checkout flow" },
            { path: "/api/products", description: "Product catalog" },
          ],
        })
      );

      expect(json.body.data[0].item).toHaveLength(2);
      expect(json.body.data[0].item[0].field[0].content).toBe("/api/checkout");
      expect(json.body.data[0].item[0].field[1].content).toBe("Checkout flow");
    });
  });
});
