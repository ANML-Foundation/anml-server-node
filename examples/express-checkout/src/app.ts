/**
 * ANML Express Checkout Example
 *
 * A complete e-commerce checkout flow demonstrating the ANML server SDK.
 * This shows how to build a multi-step checkout experience that agents
 * can navigate programmatically.
 */

import express from "express";
import { DocumentBuilder } from "@anml-foundation/server";
import { createAnmlMiddleware } from "@anml-foundation/server/express";

const app = express();
app.use(express.json());

// ─── ANML Middleware ─────────────────────────────────────────────────────────

const anml = createAnmlMiddleware({
  handler: (req) => {
    return new DocumentBuilder()
      .title("Checkout — Acme Electronics")
      .ttl(300)
      .lang("en")
      .brand({
        name: "Acme Electronics",
        logoUrl: "https://acme.example/logo.png",
        color: "#2563eb",
      })
      .persona({
        tone: "helpful",
        instructions:
          "Show itemized totals. Confirm amount before payment. Use clear, concise language.",
      })
      .disclosure("payment-credential", { requires: "explicit-consent" })
      .disclosure("shipping-address", { requires: "explicit-consent" })
      .flow([
        { id: "cart", label: "Cart", status: "completed" },
        {
          id: "checkout",
          label: "Checkout",
          status: "current",
          action: "create-session",
        },
        {
          id: "payment",
          label: "Payment",
          status: "pending",
          action: "complete-payment",
          required: true,
        },
        { id: "confirm", label: "Confirmed", status: "pending" },
      ])
      .context("checkout")
      .action("create-session", {
        method: "POST",
        endpoint: "/api/checkout/sessions",
        auth: "required",
        enctype: "application/json",
        params: [
          {
            name: "shipping_address",
            required: true,
            description: "Delivery address",
          },
          {
            name: "email",
            required: true,
            type: "string",
            description: "For receipt",
          },
        ],
      })
      .action("complete-payment", {
        method: "POST",
        endpoint: "/api/checkout/sessions/{id}/pay",
        auth: "required",
        confirm: true,
        params: [{ name: "payment_method", required: true }],
      })
      .inform(
        "Accepted: Visa, Mastercard, Apple Pay, Google Pay. Free shipping over $75. 30-day returns.",
        { confidentiality: "public", ttl: 3600 }
      )
      .ask("shipping_address", {
        action: "create-session",
        required: true,
        purpose: "shipping-calculation",
      })
      .ask("email", {
        action: "create-session",
        required: true,
        purpose: "receipt",
      })
      .ask("payment_method", {
        action: "complete-payment",
        required: true,
        purpose: "payment",
      })
      .rights("display")
      .body(
        "4K Monitor x1 — $599.00 | USB-C Cable x2 — $29.98 | Subtotal: $628.98"
      )
      .build();
  },
});

app.use(anml);

// ─── API Routes ──────────────────────────────────────────────────────────────

app.post("/api/checkout/sessions", (req, res) => {
  // In a real app, create a checkout session in your database
  res.json({
    session_id: "sess_" + Math.random().toString(36).slice(2, 10),
    status: "created",
    total: "$628.98",
    shipping: "Free",
  });
});

app.post("/api/checkout/sessions/:id/pay", (req, res) => {
  // In a real app, process payment
  res.json({
    session_id: req.params.id,
    status: "paid",
    confirmation_number: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`🦆 ANML Checkout Example listening on :${PORT}`);
  console.log(`   ANML endpoint: http://localhost:${PORT}/.well-known/anml`);
});
