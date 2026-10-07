# Interface and data requirements

**Document ID:** SENTRA-BOT-IRS-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standards:** ISO/IEC/IEEE 29148 (interface requirements); document-relational data design as implemented in Prisma

## 1. External interfaces

### 1.1 Client ↔ API

| Interface | Protocol | Notes |
| --- | --- | --- |
| Auth | HTTP ` /api/auth/* ` | Better Auth |
| Commands | HTTP oRPC `/rpc/*` | Contract: `packages/contracts/src/rpc.ts` |
| Events | oRPC event iterator SSE `threads.subscribe` | Resume by `seq` |
| Health | `GET /health` | `{ ok: true, version }` plus sandbox/revision fields as implemented |
| Screen proxy | Signed capability URLs | `SCREEN_PROXY_SECRET` |

### 1.2 API/worker ↔ Postgres

Prisma client. Application URL may be pooled (`DATABASE_URL`); migrations use `DIRECT_URL` on 5432. PgBouncer is not the migration surface.

### 1.3 Worker ↔ job queue

Graphile Worker in Postgres (`WAKEUP_DRIVER=graphile`). In-memory driver is test-only.

### 1.4 Supervisor

Sandbox supervisor HTTP API (default `127.0.0.1:7091`) with bearer token. Owns the Docker socket.

### 1.5 Optional provider interfaces

Enablement is “key present” unless noted. Data leaving the deployment is listed in `docs/architecture.md` § Optional remote providers.

| Provider | Env / setting | Data sent |
| --- | --- | --- |
| Model APIs | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, user BYOK | Prompts, tool results, memory context |
| Managed AI | `OPENAI_API_KEY` + budget micros | Same, via deployment key |
| E2B / Daytona / Box | respective keys | Workspace, files, screenshots, commands |
| Composio / Pipedream | respective keys | OAuth, tool args/results |
| Supermemory | `SUPERMEMORY_API_KEY` | Memory documents |
| SendBlue / WhatsApp | complete key sets | Phone numbers, bodies, media |
| Xendit | `XENDIT_API_KEY` | Billing references and amounts |
| PostHog | `PUBLIC_POSTHOG_*` | Anonymous product metadata |
| SMTP / VAPID | optional | Email / web push |

### 1.6 Experimental relay

`/v1/relay/events` mounts only when `SENTRABOT_CONTROL_PLANE_RELAY=enabled`. No golden-path client consumes it. The `/v1/events` alias was removed.

### 1.7 Desktop and mobile configuration

| Variable | Consumer |
| --- | --- |
| `SENTRABOT_WEB_URL` | Electron (tests/overrides) |
| `EXPO_PUBLIC_API_URL` | Mobile production builds |

There is no `RAKAZO_WEB_URL` in this repository.

## 2. User interface requirements

| ID | Requirement | Status |
| --- | --- | --- |
| IRS-UI-001 | Web is the canonical UI; Electron hosts it; mobile is a native client of the same RPC. | Implemented |
| IRS-UI-002 | Marketing site (`apps/site`) is not the signed-in product. | Implemented |
| IRS-UI-003 | Public docs (`apps/docs`) publish only user-safe pages; internal plans stay in `docs/`. | Implemented |

## 3. Data requirements

### 3.1 System of record

| Store | Contents |
| --- | --- |
| PostgreSQL | Users, sessions, workspaces, bots, threads, messages, events, runs, routines, computers, leases, artifacts metadata, secrets ciphertext, credentials, connections, usage, subscriptions, platform devices |
| `DATA_DIR` | Agent homes, browser profiles, artifacts bytes, push material as implemented |
| Sandbox disk | Ephemeral; not the source of truth |

### 3.2 Core entities (logical)

Mapped from `packages/db/prisma/schema.prisma` (not exhaustive):

- Identity: `User`, `Session`, `Account`, `Verification`
- Tenancy: `Organization`, `Member`, `Invitation`
- Product: `Bot`, `ChatGroup`, `Thread`, `Event`, `Run`, `Task`, `Routine`, `ScratchpadItem`
- Authority: `ActionApprovalRule`, `ExternalEffect`, `ActionAutoReviewPreference`
- Compute: `Computer`, execution leases
- Knowledge: `MemoryDocument`, `TaughtSkill`, `AgentSkill`, `Artifact`
- Integrations: `Connection`, `CapabilityInstall`, `McpServer`, `Secret`
- Platform (experimental hybrid): `Device`, `Runtime`, `KeyEnvelope`
- Billing: `Subscription`, `PaymentEvent`, `UsageReservation`, `UsageLedger`

### 3.3 Data rules

| ID | Requirement | Status |
| --- | --- | --- |
| DRS-001 | Documents remain relatively flat; relationships use IDs (no unbounded nested arrays as source of truth). | Implemented |
| DRS-002 | Foreign keys used in queries shall have indexes (Prisma schema). | Implemented |
| DRS-003 | Event ordering per thread is `seq` (integer), not wall-clock in queries. | Implemented |
| DRS-004 | Queries shall not use `Date.now()` internally (Convex-style rule does not apply here; still, API query handlers that need “now” take it from the request or worker clock, not cached query identity). Postgres worker/reconciler may use server time. | N/A to Convex; workers use real time by design |
| DRS-005 | `outbox_events.sentAt` is unused (no drain). Rows may accumulate. | Experimental debt |
| DRS-006 | Plan-limit enforcement must not delete bots, files, or memory; pause or archive. | Specified |

### 3.4 Retention and export

| ID | Requirement | Status |
| --- | --- | --- |
| DRS-007 | Bot export exists (`export.bot`). | Implemented |
| DRS-008 | Operator backup/restore covers database and documented file paths. | Implemented |
| DRS-009 | Account deletion for store review is an operator/process requirement for mobile submission (`docs/mobile-release.md`). | Specified |
