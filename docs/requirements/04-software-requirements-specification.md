# Software requirements specification

**Document ID:** SENTRA-BOT-SRS-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC/IEEE 29148:2018 (software requirements specification)  
**Normative references:** `packages/contracts/src/rpc.ts`, `packages/db/prisma/schema.prisma`, `docs/architecture.md`

## 1. Introduction

### 1.1 Purpose

This SRS specifies functional requirements for Sentra Bot as implemented in this repository. Each requirement is atomic, testable, and status-coded.

### 1.2 Product perspective

Clients call `apps/api` over Better Auth (`/api/auth/*`) and typed oRPC (`/rpc/*`). Thread events are durable rows (`events.threadId`, `events.seq`) and are pushed over `threads.subscribe`. Agent execution runs in `apps/worker` when `WAKEUP_DRIVER=graphile` (product path) or in-process when `WAKEUP_DRIVER=memory` (tests).

### 1.3 Definitions

See [12-glossary.md](12-glossary.md).

### 1.4 Overview of requirement areas

`FR-SYS`, `FR-AUTH`, `FR-BOT`, `FR-THR`, `FR-RUN`, `FR-CMP`, `FR-MEM`, `FR-RTN`, `FR-INT`, `FR-APP`, `FR-MDL`, `FR-PHN`, `FR-VOI`, `FR-BIL`, `FR-OPS`, `FR-CLI`.

---

## 2. System services

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-SYS-001 | The API shall listen on `API_HOST:API_PORT` (default `127.0.0.1:3100`) and expose `/health`. | Implemented | `apps/api`, `.env.example` |
| FR-SYS-002 | The API shall expose the oRPC contract defined in `packages/contracts`. | Implemented | `packages/contracts/src/rpc.ts` |
| FR-SYS-003 | The worker shall consume keyed Graphile jobs (`run.continue`, `routine.wakeup`, `phone.deliver`, `computer.*`, `skill.*`, `history.compact`). | Implemented | `docs/architecture.md` |
| FR-SYS-004 | Job redelivery shall replace by `jobKey` rather than duplicate work. | Implemented | `packages/adapter-kit/src/background-jobs.ts` |
| FR-SYS-005 | A reconciler under a Postgres advisory lock shall re-enqueue queued runs, expired leases, and near-due routines. | Implemented | `apps/worker` |
| FR-SYS-006 | Core product startup shall not require any third-party API key. | Implemented | `.env.example` optional keys |
| FR-SYS-007 | `composeAgentRuntime` shall be the single composition of executor, sandbox, connectors, and job handlers for API and worker. | Implemented | `packages/adapters/src/agent-runtime-composition.ts` |

---

## 3. Authentication, identity, and tenancy

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-AUTH-001 | The system shall authenticate users with Better Auth sessions. | Implemented | `packages/auth` |
| FR-AUTH-002 | The first registered user on a fresh deployment shall become the deployment owner. | Implemented | self-host / onboarding |
| FR-AUTH-003 | Signup shall honour deployment settings (`signupsEnabled`, `signupAllowlist`) after initialization. | Implemented | `deployment.update` |
| FR-AUTH-004 | Every workspace-scoped RPC shall require membership (`requireMembership`). | Implemented | `apps/api/src/authed.ts` |
| FR-AUTH-005 | Users shall belong to an organization (workspace) with roles via Better Auth organization plugin tables. | Implemented | Prisma `Organization`, `Member` |
| FR-AUTH-006 | `BETTER_AUTH_SECRET` shall be at least 32 characters; cookies and CORS shall follow `BETTER_AUTH_URL` / `WEB_ORIGIN` / `API_URL`. | Implemented | `.env.example`, self-host doc |

---

## 4. Bots, groups, and onboarding

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-BOT-001 | A member shall create, update, duplicate, reorder, archive, restore, and remove bots. | Implemented | `bots.*` RPC |
| FR-BOT-002 | Removing a bot shall not delete memories unless `deleteMemories` is true. | Implemented | `bots.remove` |
| FR-BOT-003 | A bot shall be assignable to Team or Private computer mode. | Implemented | `bots.setComputer` |
| FR-BOT-004 | Members shall create groups that share a thread among multiple bots. | Implemented | `groups.*` |
| FR-BOT-005 | First-run onboarding shall seed a conversational flow and let the user choose a focus. | Implemented | `onboarding.*` |
| FR-BOT-006 | The product shall ship a catalog of 66 role templates for bot creation. | Implemented | `packages/bot-templates/CATALOG.md` |
| FR-BOT-007 | A bot may spawn a peer bot (own thread and computer) or a short-lived in-thread subagent. | Implemented | CHANGELOG; events `bot.spawned`, `thread.subagent` |

---

## 5. Threads, messages, and realtime

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-THR-001 | A thread shall be addressed by exactly one of `botId` or `groupId`. | Implemented | contract `threadTarget` |
| FR-THR-002 | `threads.send` shall accept text and/or attachments, optional mentions, reply-to, and `clientNonce`. | Implemented | `rpc.ts` |
| FR-THR-003 | Clients shall resume event streams from the last durable `seq`. | Implemented | `threads.subscribe` |
| FR-THR-004 | SSE shall propagate events; the `events` table is the source of truth. | Implemented | architecture.md |
| FR-THR-005 | A user shall stop an in-flight run, follow up, clear a thread, and answer an ask. | Implemented | `threads.stop/followUp/clear/answer` |
| FR-THR-006 | Workspace search shall query threads and related objects from a single `search.query` RPC. | Implemented | `search.query` |

---

## 6. Runs and authority

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-RUN-001 | Run status shall follow `queued → leased → running → (waiting_input \| waiting_takeover \| completed \| failed \| cancelled)` and reject illegal transitions. | Implemented | `packages/core/src/run-state.ts` |
| FR-RUN-002 | Leases shall be fenced (`leaseFence`) and renewed; durable writes shall be conditioned on the fence. | Implemented | architecture.md |
| FR-RUN-003 | Consequential tool calls shall be recorded in `external_effects` with a unique `idempotencyKey` before execution. | Implemented | executor |
| FR-RUN-004 | An interrupted external call shall be left `ambiguous` and shall not be replayed blindly. | Implemented | executor |
| FR-RUN-005 | The tool gate shall evaluate `toolRequiresApproval` then workspace `action_approval_rules` then optional auto-review, then ALLOW or ASK. | Implemented | architecture.md |
| FR-RUN-006 | ASK shall park the run in `waiting_input` until the user answers `allow`, `always`, or `deny`. | Implemented | `threads.answer`, Ask cards |
| FR-RUN-007 | On a trusted host computer, `shell`, `write_file`, `launch_app`, and `open_path` shall ASK unless an always-allow rule matches. | Implemented | `applyHostExecutionPolicy` |
| FR-RUN-008 | Structured run logs shall emit identifiers and enums only — never prompts, arguments, or message text. | Implemented | `packages/core/src/run-log.ts` |

---

## 7. Computers and sandboxes

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-CMP-001 | `SandboxProvider` shall support lifecycle, desktop, execution, and file operations as defined in `docs/computer-runtime.md`. | Implemented | adapters |
| FR-CMP-002 | Supported providers shall include `docker`, `e2b`, `daytona`, `box`, `desktop`, `fake`, and `none`. | Implemented | `.env.example`, factory |
| FR-CMP-003 | Docker computers shall be managed by the sandbox supervisor (not an unrestricted Docker socket on the API). | Implemented | `infra/sandboxes/supervisor` |
| FR-CMP-004 | Workspace state shall checkpoint to `DATA_DIR` independently of the cloud sandbox lifetime. | Implemented | `AgentHomeStore` |
| FR-CMP-005 | A user shall boot, stop, recover, reset, update, take over, and release a bot computer. | Implemented | `computer.*` |
| FR-CMP-006 | Takeover of a Team bot with a live execution lease shall fail unless the run is `waiting_takeover`. | Implemented | computer-runtime.md |
| FR-CMP-007 | Trusted host execution shall be off by default and enableable only by the deployment owner when the configured provider is `docker`. | Implemented | CHANGELOG, deployment settings |
| FR-CMP-008 | `desktop` provider shall treat host execution as trusted, not isolated. | Implemented | architecture.md |
| FR-CMP-009 | Graphical tools shall return `MULTI_SCREEN_UNAVAILABLE` when a provider cannot allocate another Team display. | Implemented | computer-runtime.md |

---

## 8. Memory, artifacts, skills, routines

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-MEM-001 | Each bot shall have markdown memory documents listable and editable by members. | Implemented | `memory.*` |
| FR-MEM-002 | Memory shall export as markdown. | Implemented | `memory.exportMarkdown` |
| FR-MEM-003 | An optional semantic memory provider (Supermemory) may be connected; it is not required. | Implemented | `memory.connectProvider` |
| FR-MEM-004 | Artifacts shall upload with a size limit defined in the contracts package. | Implemented | `artifacts.*` |
| FR-RTN-001 | Routines shall support cron schedules, timezone, notify, webhook trigger, and one-shot `runAt`. | Implemented | `routines.*` |
| FR-RTN-002 | A routine without any schedule and with webhook disabled shall be rejected. | Implemented | contract superRefine |
| FR-SKL-001 | A user shall teach a skill by recording computer actions and save a playbook. | Implemented | `skills.*` |
| FR-SKL-002 | Workspace Agent Skills (`SKILL.md`) shall be persistable and injectable into the Pi runtime. | Implemented | `agentSkills.*` |
| FR-SKL-003 | Scratchpad items shall track bot tasks with status and notes. | Implemented | `scratchpad.*` |

---

## 9. Models, voice, integrations, phone

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-MDL-001 | Users shall connect model credentials and set a default model. | Implemented | `models.*` |
| FR-MDL-002 | Users shall probe OpenAI-compatible endpoints; public hostnames require an explicit allow flag. | Implemented | `SENTRABOT_OPENAI_COMPAT_ALLOW_PUBLIC` |
| FR-MDL-003 | Device-code OAuth shall support ChatGPT Plus/Pro, GitHub Copilot, and SuperGrok / X Premium as implemented by Pi. | Implemented | CHANGELOG |
| FR-MDL-004 | Claude Pro browser login shall not be offered (localhost callback incompatible with the web app). | Implemented | CHANGELOG (explicit omission) |
| FR-VOI-001 | Speech shall sit behind a `VoiceProvider` interface (ElevenLabs, OpenAI, Cartesia). Keys remain on the server. | Implemented | CHANGELOG, `voice.*` |
| FR-INT-001 | Managed app catalogs (Composio, Pipedream Connect) shall be optional. | Implemented | `connections.*` |
| FR-INT-002 | Users shall install HTTPS MCP servers (including OAuth) and bound OpenAPI sources. Credentials shall use the secret store. | Implemented | `mcp.*`, `capabilities.*` |
| FR-INT-003 | Connector tests shall remain deterministic and offline. | Implemented | CONTRIBUTING.md, testkit |
| FR-PHN-001 | WhatsApp Cloud API shall enable pairing when all required env vars are set. | Implemented | `phone.whatsapp.*` |
| FR-PHN-002 | Inbound WhatsApp voice notes shall transcribe when `PHONE_TRANSCRIBE_*` is configured; otherwise reply that voice is not supported — not drop silently. | Implemented | `.env.example` |
| FR-PHN-003 | Phone-channel system copy locale shall default to `id`. Agent replies shall follow the user's language. | Implemented | `PHONE_LOCALE` |

---

## 10. Billing, plans, operations

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-BIL-001 | Plan limits for Free shall match `docs/product/paket-free-batas-v1.md` (3 active bots, quotas listed there). | Specified | `packages/core/src/platform-policy.ts` `freePlanLimits` |
| FR-BIL-002 | Subscription states shall include `free`, `checkout_pending`, `active_plus`, `past_due`, `grace_period`. | Implemented | `platform-policy.ts` |
| FR-BIL-003 | Payment grace shall be 7 calendar days; then the workspace returns to Free without deleting data. | Specified | product doc; Xendit path partial |
| FR-BIL-004 | Exceeding active-bot (or other) limits shall pause excess items, not delete them. | Specified | product doc |
| FR-BIL-005 | Customer-facing copy shall not promise token counts. | Specified | product doc |
| FR-OPS-001 | Deployment owner shall check and apply product updates via the updater sidecar when present. Rollback stays ops-only. | Implemented | `updater.*` |
| FR-OPS-002 | Health shall optionally report `GIT_SHA` as `revision`. | Implemented | `.env.example` |
| FR-OPS-003 | Backup and restore scripts shall exist for operator use. | Implemented | `scripts/backup.sh`, `restore.sh` |

---

## 11. Clients

| ID | Requirement | Status | Verification |
| --- | --- | --- | --- |
| FR-CLI-001 | Web shall proxy `/api` and `/rpc` to the API in development. | Implemented | `apps/web` |
| FR-CLI-002 | Desktop shall host the web UI and support `SENTRABOT_WEB_URL` override for tests. | Implemented | `apps/desktop` |
| FR-CLI-003 | Mobile shall allow a custom HTTPS API origin at sign-in. | Implemented | `apps/mobile` |
| FR-CLI-004 | Production mobile builds shall require `EXPO_PUBLIC_API_URL` as HTTPS. | Implemented | `apps/mobile/app.config.ts` |
| FR-CLI-005 | Store identifiers and EAS secrets shall not be committed. | Implemented | `docs/mobile-release.md` |

---

## 12. Explicit non-requirements

| ID | Statement |
| --- | --- |
| FR-NX-001 | This repository shall not ship a clinical write adapter. |
| FR-NX-002 | This repository does not contain an RME reconnaissance adapter; README doctrine must not claim one is shipped. |
| FR-NX-003 | The hybrid relay at `/v1/relay/events` is not part of the golden path. |
| FR-NX-004 | `outbox_events` is write-only debt (billing writer, no drain) until hybrid work resumes. |
