<p align="center">
  <img src="https://raw.githubusercontent.com/ANML-Foundation/.github/main/images/anml-foundation-logo.png" alt="ANML Foundation" width="200" />
</p>

<h1 align="center">@anml-foundation/server</h1>

<p align="center">
  ANML 1.0 Server SDK for Node.js/TypeScript — document builder, serialization, discovery, and validation.
</p>

<p align="center">
  <a href="https://anmlfoundation.org">Website</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-overview">API Overview</a> ·
  <a href="./examples">Examples</a>
</p>

---

## What is this?

This is a **server SDK** — a toolkit for building ANML-powered services. You bring the business logic, we handle protocol compliance.

The SDK provides:

- **Fluent document builder** — construct valid ANML duckuments with a chainable API
- **Dual serialization** — XML (`application/anml+xml`) and JSON (`application/anml+json`)
- **Content negotiation** — automatically serve the right format based on Accept headers
- **Discovery helpers** — well-known URI, Link headers, HTML link tags
- **Document validation** — validate against the ANML 1.0 spec
- **SRI hash generation** — compute integrity hashes for media resources
- **Trust delegation** — DNS TXT record verification for trust chains
- **Framework adapters** — Express and Fastify middleware

## Installation

```bash
npm install @anml-foundation/server
```

## Quick Start

```typescript
import { AnmlDocument } from '@anml-foundation/server';

const doc = AnmlDocument.builder()
  .title('Acme Electronics — Checkout')
  .ttl(300)
  .persona({
    tone: 'helpful',
    instructions: 'Show itemized totals. Confirm before payment.',
    brandColor: '#4F46E5',
    logoUrl: 'https://acme.example.com/logo.png',
  })
  .disclosure('payment-credential', { requires: 'explicit-consent' })
  .disclosure('shipping-address', { requires: 'explicit-consent' })
  .flow([
    { id: 'browse', label: 'Browse', status: 'completed' },
    { id: 'checkout', label: 'Checkout', status: 'current', action: 'submit-order' },
    { id: 'confirm', label: 'Confirmed', status: 'pending' },
  ])
  .action('submit-order', {
    method: 'POST',
    endpoint: '/api/orders',
    auth: 'required',
    confirm: true,
  })
  .inform('Free shipping on orders over $75.', { ttl: 3600, confidentiality: 'public' })
  .ask('email', { action: 'submit-order', required: true, purpose: 'receipt' })
  .ask('shipping-address', { action: 'submit-order', required: true, purpose: 'delivery' })
  .media('https://acme.example.com/logo.png', { type: 'image/png', description: 'Acme logo' })
  .rights('cache')
  .body('4K Monitor x1 — $599.00 | USB-C Cable x2 — $29.98')
  .build();

// Serialize
const xml = doc.toXml();
const json = doc.toJson();
```

## Express Integration

```typescript
import express from 'express';
import { AnmlDocument, anmlMiddleware } from '@anml-foundation/server';

const app = express();

// Adds /.well-known/anml route and Link headers
app.use(anmlMiddleware({
  handler: (req) => AnmlDocument.builder()
    .title('My Service')
    .action('search', { method: 'POST', endpoint: '/api/search' })
    .build()
    .data,
}));

app.listen(3000);
```

## API Overview

### Document Builder

| Method | Description |
|--------|-------------|
| `AnmlDocument.builder()` | Create a new builder |
| `.title(title)` | Set document title |
| `.ttl(seconds)` | Set cache TTL |
| `.lang(bcp47)` | Set document language |
| `.persona(opts)` | Set behavioral guidance (tone, instructions, brandColor, logoUrl) |
| `.disclosure(field, opts)` | Add disclosure constraint |
| `.flow(steps)` | Define workflow steps |
| `.action(id, opts)` | Add an executable action |
| `.inform(content, opts)` | Add knowledge for the agent |
| `.ask(field, opts)` | Request information from the agent |
| `.media(url, opts)` | Add media element |
| `.rights(level)` | Set usage rights |
| `.body(content)` | Set body content |
| `.build()` | Build the document |

### Serialization

```typescript
import { toXml, toJson, serialize } from '@anml-foundation/server';

toXml(doc);                        // → XML string
toJson(doc);                       // → JSON string
serialize(doc, contentType);       // → dispatches based on content type
```

### Content Negotiation

```typescript
import { negotiateContentType } from '@anml-foundation/server';

const contentType = negotiateContentType(req.headers.accept);
// → "application/anml+xml" or "application/anml+json"
```

### Discovery

```typescript
import { wellKnownPath, linkHeader, htmlLinkTag } from '@anml-foundation/server';

wellKnownPath();            // "/.well-known/anml"
linkHeader('/api');          // Link header value
htmlLinkTag('/api');         // <link> HTML element
```

### Validation

```typescript
import { validate } from '@anml-foundation/server';

const result = validate(doc);
// { valid: true, errors: [] }
// { valid: false, errors: [{ path: "...", message: "...", severity: "error" }] }
```

### Integrity (SRI)

```typescript
import { computeSriHash, verifySriHash } from '@anml-foundation/server';

const hash = computeSriHash(buffer, 'sha384');
const valid = verifySriHash(buffer, hash);
```

### Trust Delegation

```typescript
import { verifyTrust, generateTrustRecord } from '@anml-foundation/server';

// Verify trust via DNS TXT at _anml.example.com
const result = await verifyTrust('example.com', 'api.myservice.com');
// { trusted: true, records: [...] }

// Generate the TXT record value to set
const txt = generateTrustRecord('api.myservice.com', ['serve', 'discover']);
// "anml-trust=api.myservice.com;v=1.0;cap=serve,discover"
```

## Examples

- [Express Example](./examples/express-example.ts) — E-commerce checkout flow
- [Fastify Example](./examples/fastify-example.ts) — Search API service

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for development)

## License

ISC — see [LICENSE](./LICENSE)
