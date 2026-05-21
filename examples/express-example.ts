/**
 * Express example — ANML-powered checkout service
 *
 * This example shows how to use the ANML server SDK with Express
 * to serve ANML duckuments with content negotiation and discovery.
 *
 * Run: npx ts-node --esm examples/express-example.ts
 */

import express from "express";
import { AnmlDocument, anmlMiddleware } from "@anml-foundation/server";

const app = express();

// Add ANML middleware — serves /.well-known/anml and adds Link headers
app.use(
  anmlMiddleware({
    handler: (req) =>
      AnmlDocument.builder()
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
        .build()
        .data,
  })
);

// Your normal API routes
app.post("/api/orders", (req, res) => {
  res.json({ orderId: "ORD-12345", status: "confirmed" });
});

app.listen(3000, () => {
  console.log("ANML-powered checkout running on http://localhost:3000");
  console.log("Try: curl http://localhost:3000/.well-known/anml");
});
