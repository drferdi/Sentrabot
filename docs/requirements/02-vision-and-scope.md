# Vision and scope

**Document ID:** SENTRA-BOT-VIS-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC/IEEE 29148:2018 (system overview and boundaries)

## 1. Product vision

Sentra Bot is the operating layer for persistent, composable AI teammates that the operator owns. A bot can hold memory, run routines, use a computer, and call tools — against the operator's models, data, and machines.

Autonomy is a capability. Authority is a boundary.

```
PERCEIVE → REASON → VERIFY → HUMAN AUTHORITY → ACT
```

## 2. Positioning

Sentra Bot is not a thin model wrapper and not a single chatbot. This repository contains the runtime: API, clients, worker, jobs, memory, computer providers, connectors, artifacts, and realtime.

Upstream lineage is Rakazo (Apache-2.0). User-facing product identity is Sentra Bot. Internal packages use the `@sentrabot/*` namespace.

## 3. Intended users

| Persona | Need |
| --- | --- |
| Individual operator | Self-host or point a client at a deployment; own memory and secrets |
| Small-business owner (Indonesia-first) | WhatsApp as a daily channel; simple approval; affordable BYOK |
| Knowledge worker / student | Routines, documents, computer use, search |
| Deployment owner | Signup policy, computer host choice, updates, backups |
| Healthcare / regulated operator | Role templates and read-only doctrine; **no clinical write path in this baseline** |
| Contributor | Deterministic tests, typed contracts, documented topology |

## 4. Product surfaces

| Surface | Path | Role |
| --- | --- | --- |
| API | `apps/api` | Public runtime boundary: Better Auth, oRPC, health |
| Worker | `apps/worker` | Graphile jobs, run continuation, routines, reconciler |
| Web | `apps/web` | React + Vite client (default `127.0.0.1:5173`) |
| Desktop | `apps/desktop` | Electron shell of the web UI |
| Mobile | `apps/mobile` | Expo client; custom server at sign-in |
| Marketing site | `apps/site` (npm name `cora`) | Public landing and static legal pages |
| Public docs | `apps/docs` | Mintlify user documentation (Indonesian) |
| Role catalog | `packages/bot-templates` | 66 Chief-of-Staff production role packages |

## 5. Context diagram

```text
  Operator ── web / desktop / mobile / WhatsApp (optional)
                    │
                    ▼
              apps/api :3100
           (auth, oRPC, SSE)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   PostgreSQL   Graphile    DATA_DIR
        │       Worker          │
        └────── apps/worker ────┘
                    │
                    ▼
            SandboxProvider
         docker | e2b | daytona | box | desktop | fake
```

## 6. Scope of this baseline

### In scope — Implemented

- Workspace membership, bots, groups, threads, runs, artifacts, memory, routines, scratchpad.
- Computer lifecycle and human takeover.
- Approval rules and host-execution policy on trusted desktop computers.
- Optional model BYOK and selected OAuth model sign-in.
- Optional connectors (Composio, Pipedream), HTTPS MCP, OpenAPI tools.
- Optional WhatsApp Cloud API pairing and voice-note transcription.
- Voice providers behind a `VoiceProvider` interface.
- Self-host Compose topologies and published GHCR images.

### In scope — Specified (commercial)

- Free / Plus / Pro / Business active-bot ladder and Free limits in `docs/product/paket-free-batas-v1.md`.
- Entitlement principle: pause, do not delete, when a workspace exceeds plan limits.

### In scope — Experimental / frozen

- Hybrid control-plane relay (`/v1/relay/events`), off unless `SENTRABOT_CONTROL_PLANE_RELAY=enabled`.
- Trusted host execution (`SANDBOX_PROVIDER=desktop` / `computerHost=this-mac`), owner-only.

### Out of scope

- Clinical write to any patient record or hospital information system.
- A dedicated RME (electronic medical record) adapter in this repository — **not present in code**; do not document it as shipped.
- Prompt-only “safety”.
- Requiring OpenRouter, E2B, Composio, Xendit, or any other hosted vendor to boot the core stack.
- Nine consumer Indonesia bots (Study, Work, Rumah, …) as a shipped catalog — the shipped catalog is the 66 role packages in `packages/bot-templates`.

## 7. Operating principles (normative for design)

1. No hosted vendor is required to run the core product.
2. Frontends express intent and render state; the backend owns orchestration, authorization, validation, retries, and provider translation.
3. Shared behaviour lives in packages; only native navigation, storage, permissions, and interactions are platform-specific.
4. Sandboxes are runtime cache. Durable state is PostgreSQL and `DATA_DIR`.
5. Secrets never enter git, capability config, fixtures, logs, or snapshots.
