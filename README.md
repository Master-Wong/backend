# Donations Portal — Backend

A TypeScript REST API for processing online donations via M-Pesa (async) or card
(synchronous). Built with Express, it validates every request server-side,
simulates payment providers, and exposes Swagger documentation.

> See the [root README](../README.md) for the problem statement, architecture,
> framework rationale, assumptions, security notes, and future improvements.

## Prerequisites

- Node.js **22** (matches CI; Node 20+ should also work).

## Scripts

```bash
npm install
npm run dev      # tsx watch → http://localhost:3001
npm run build    # compile TypeScript → dist/
npm start        # node dist/index.js (production)
npm test         # vitest
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/donations` | Submit a donation (rate-limited, idempotent) |
| `GET` | `/api/donations/:transactionId` | Poll donation status |
| `GET` | `/api-docs` | Swagger UI |
| `GET` | `/api-docs.json` | OpenAPI spec |

### Payment behaviour

```
POST /api/donations
        │
        ├─ M-Pesa: 202 pending → simulated STK callback → poll GET until completed/failed
        └─ Card:   201 completed or 402 payment failed (synchronous)
```

- **M-Pesa** returns `202 Accepted` with `status: pending` and a `Location`
  header. The client polls `GET /api/donations/:id` until the status is
  `completed` or `failed`.
- **Card** returns `201 Created` on success or `402 Payment Required` on failure.
- Amounts ending in **1** (e.g. 1, 11, 501, 1001) fail deterministically in both
  providers (useful for testing error paths).
- Card numbers are masked before storage; expiry and CVC are never persisted.

### Idempotency

`POST /api/donations` accepts an `Idempotency-Key` header. Replays with the same
key and body return the cached response; the same key with a different body
returns `409 Conflict`. The response echoes the key in the `Idempotency-Key`
header.

## How it works

- **`routes/donations.routes.ts`** wires rate limiting, idempotency middleware,
  and the donation controller.
- **`controller/donations.controller.ts`** validates input, delegates to
  payment providers, persists donations, and formats responses.
- **`validators/donationValidator.ts`** is the source of truth for request
  validation (amount, email, Kenyan phone numbers, card fields, etc.).
- **`providers/`** simulates M-Pesa STK push (async callback) and card charging
  (sync). Shared helpers in `providers/shared.ts` handle failure amounts and
  artificial delays.
- **`store/`** holds in-memory donation and idempotency caches (not durable
  across restarts).
- **`middleware/idempotency.middleware.ts`** deduplicates POST requests;
  **`middleware/error.middleware.ts`** returns consistent JSON for 404s and
  unhandled errors.
- **`config/swagger.ts`** documents the API; **`config/app.config.ts`** reads
  tunable env vars (delays, rate limits, TTLs).

## Layout

```
src/
├── index.ts              Express app, CORS, Swagger, routes
├── config/               app.config, swagger
├── routes/               donations.routes
├── controller/           donations.controller
├── middleware/           idempotency, error handling
├── validators/           donationValidator
├── providers/            mpesa, card, shared
├── store/                donationStore, idempotencyStore
└── types/                donation.types
```

## Configuration

Optional environment variables (defaults in parentheses):

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (`3001`) |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window (`60000`) |
| `RATE_LIMIT_MAX` | Max POSTs per window (`20`) |
| `IDEMPOTENCY_TTL_MS` | Idempotency cache TTL (`86400000`) |
| `MPESA_CALLBACK_DELAY_MS` | Simulated STK success delay (`3000`) |
| `MPESA_FAILURE_DELAY_MS` | Simulated STK failure delay (`5000`) |
| `CARD_SUCCESS_DELAY_MS` | Simulated card success delay (`800`) |
| `CARD_FAILURE_DELAY_MS` | Simulated card failure delay (`5000`) |

CORS allows all origins (`*`) and exposes `Idempotency-Key` as an allowed
header so the frontend can call the API from a separate host in production.

## Production

Deploy as a Node web service (e.g. Render):

| Setting | Value |
|---------|--------|
| **Root directory** | `BackEnd` |
| **Build command** | `npm ci && npm run build` |
| **Start command** | `npm start` |

Render sets `PORT` automatically. The app listens on `process.env.PORT || 3001`.

Point the frontend at the deployed URL via `VITE_API_BASE_URL` (see
`../FrontEnd/README.md`).

## Testing

```bash
npm test
```

Vitest covers validators, stores, idempotency middleware, payment providers,
and error handling.
