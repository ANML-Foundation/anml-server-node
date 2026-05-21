/**
 * Fastify example — ANML-powered API service
 *
 * This example shows how to use the ANML server SDK with Fastify
 * to serve ANML duckuments.
 *
 * Run: npx ts-node --esm examples/fastify-example.ts
 */

import Fastify from "fastify";
import { AnmlDocument, anmlFastifyPlugin } from "@anml-foundation/server";

const app = Fastify({ logger: true });

// Register ANML plugin
app.register(anmlFastifyPlugin, {
  handler: (req) =>
    AnmlDocument.builder()
      .title("Search API")
      .ttl(60)
      .persona({ tone: "concise", instructions: "Return relevant results." })
      .action("search", {
        method: "POST",
        endpoint: "/api/search",
        params: [
          { name: "query", required: true, type: "string", description: "Search query" },
          { name: "limit", required: false, type: "number", min: 1, max: 100 },
        ],
      })
      .ask("query", { action: "search", required: true, purpose: "search" })
      .inform("We index over 1M documents.", { confidentiality: "public" })
      .body("Full-text search across our knowledge base.")
      .build()
      .data,
});

app.listen({ port: 3000 }, () => {
  console.log("ANML-powered search API running on http://localhost:3000");
});
