# ANML Express Checkout Example

A complete e-commerce checkout flow demonstrating the ANML server SDK with Express.

## What This Shows

- Multi-step workflow with `flow()` and `context()`
- Disclosure constraints requiring explicit consent for payment and address
- Content negotiation (XML or JSON based on Accept header)
- Discovery via `/.well-known/anml` and Link headers
- Brand/persona configuration for agent behavior guidance

## Running

```bash
# From the repo root
npm install
npm run build

# Then in this directory
npm install
npm run dev
```

## Testing

```bash
# Get the ANML document as JSON
curl http://localhost:3000/.well-known/anml

# Get as XML
curl -H "Accept: application/anml+xml" http://localhost:3000/.well-known/anml

# Create a checkout session
curl -X POST http://localhost:3000/api/checkout/sessions \
  -H "Content-Type: application/json" \
  -d '{"shipping_address": "123 Main St", "email": "user@example.com"}'
```

## How an Agent Would Use This

1. Agent discovers ANML support via `/.well-known/anml`
2. Reads the document, sees the checkout flow with 4 steps
3. Evaluates disclosure constraints — needs explicit consent for payment and address
4. Asks user for consent, then provides shipping address and email
5. Submits to `create-session` action endpoint
6. Receives updated state, proceeds to payment step
7. Confirms payment amount with user (action has `confirm: true`)
8. Submits payment method to `complete-payment` endpoint
