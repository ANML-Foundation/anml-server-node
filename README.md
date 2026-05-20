<p align="center">
  <img src="https://raw.githubusercontent.com/ANML-Foundation/.github/main/images/anml-foundation-logo.png" alt="ANML Foundation" width="200" />
</p>

<h1 align="center">@anml-foundation/server</h1>

<p align="center">
  ANML 1.0 Server SDK for Node.js/TypeScript — build, serialize, and serve ANML duckuments.
</p>

<p align="center">
  <a href="https://anmlfoundation.org">Website</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="./examples">Examples</a>
</p>

---

## What is this?

This is a **server SDK** — it helps you **build ANML servers**. You bring the business logic, we handle protocol compliance.

The SDK provides:

- **Fluent document builder** — construct valid ANML duckuments with a chainable API
- **Dual serialization** — XML (`application/anml+xml`) and JSON (`application/anml+json`)
- **Content negotiation** — automatically serve the right format based on Accept headers
- **Discovery helpers** — well-known URI, Link headers, HTML link tags
- **Document validation** — validate against the ANML 1.0 spec
- **SRI hash generation** — compute integrity hashes for media resources
- **Framework adapters** — Express, Fastify, and generic Node.js HTTP

## Installation

```bash
npm install @anml-foundation/server
```

## Quick Start

```typescript
import { DocumentBuilder } from "@anml-foundation/server";

const doc = new DocumentBuilder()
  .title("My Service")
  .ttl(3600)
  .persona({ tone: "friendly", instructions: "Be concise and helpful." })
  .action("search", {
    method: "POST",
    endpoint: "/api/search",
    params: [{ name: "query", required: true, type: "string" }],
  })
  .ask("query", { action: "search", required: true, purpose: "search" })
  .inform("We index over 1M documents.")
  .body("Search our knowledge base.")
  .build();

// Serialize
const xml = toXml(doc);   // application/anml+xml
const json = toJson(doc); // application/anml+json
```

## Framework Adapters

### Express

```typescript
import express from "express";
import { DocumentBuilder } from "@anml-foundation/server";
import { createAnmlMiddleware } from "@anml-foundation/server/express";

const app = express();

app.use(createAnmlMiddleware({
  handler: (req) => new DocumentBuilder()
    .title("My API")
    .action("submit", { method: "POST", endpoint: "/api/submit" })
    .build(),
}));

app.listen(3000);
```

The middleware:
- Serves your ANML document at `/.well-known/anml` (configurable)
- Adds `Link` headers to all other responses for discovery
- Handles content negotiation automatically

### Fastify

```typescript
import Fastify from "fastify";
import { DocumentBuilder } from "@anml-foundation/server";
import { anmlPlugin } from "@anml-foundation/server/fastify";

const app = Fastify();

app.register(anmlPlugin, {
  handler: (req) => new DocumentBuilder()
    .title("My API")
    .build(),
});

app.listen({ port: 3000 });
```

### Generic HTTP

```typescript
import { createServer } from "node:http";
import { DocumentBuilder } from "@anml-foundation/server";
import { createAnmlHandler } from "@anml-foundation/server/http";

const handle = createAnmlHandler({
  handler: (req) => new DocumentBuilder()
    .title("My API")
    .build(),
});

createServer(handle).listen(3000);
```

## API Reference

### DocumentBuilder

Fluent builder for constructing ANML documents.

| Method | Description |
|--------|-------------|
| `.title(title)` | Set document title |
| `.ttl(seconds)` | Set cache TTL |
| `.lang(bcp47)` | Set document language |
| `.meta(name, value)` | Add metadata entry |
| `.persona(opts)` | Set behavioral guidance (tone, instructions, model, language) |
| `.brand(opts)` | Set aesthetic/branding (name, logo, color, icon) |
| `.disclosure(field, opts)` | Add disclosure constraint |
| `.flow(steps)` | Define workflow steps |
| `.context(stepId)` | Set current workflow position |
| `.action(id, opts)` | Add an executable action |
| `.inform(content, opts)` | Add knowledge for the agent |
| `.ask(field, opts)` | Request information from the agent |
| `.media(url, opts)` | Add media element |
| `.rights(level)` | Set usage rights |
| `.body(content)` | Set body content |
| `.build()` | Build the AnmlDocument |
| `.toXml()` | Build and serialize to XML |
| `.toJson()` | Build and serialize to JSON |

### Serialization

```typescript
import { toXml, toJson, negotiate } from "@anml-foundation/server";

toXml(doc);    // → XML string
toJson(doc);   // → JSON string
negotiate(doc, acceptHeader); // → { content, contentType }
```

### Discovery

```typescript
import { WELL_KNOWN_PATH, linkHeader, htmlLinkTag } from "@anml-foundation/server";

WELL_KNOWN_PATH;          // "/.well-known/anml"
linkHeader("/api");       // Link header value
htmlLinkTag("/api");      // <link> HTML element
```

### Validation

```typescript
import { validate } from "@anml-foundation/server";

const errors = validate(doc);
// [{ path: "state.context.step", message: "...", severity: "error" }]
```

### Integrity (SRI)

```typescript
import { computeSriHash, verifySriHash } from "@anml-foundation/server";

const hash = computeSriHash(buffer, "sha384");
const valid = verifySriHash(buffer, hash);
```

## Examples

- [Express Checkout](./examples/express-checkout) — Complete e-commerce checkout flow

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for development)

## License

ISC — see [LICENSE](./LICENSE)
