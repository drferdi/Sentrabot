<table width="100%">
<tr>
<td width="34%" align="center" valign="top">

<img src="https://i.ibb.co.com/jZwfy0vB/drferdiikskandar.png" alt="dr. Ferdi Iskandar" width="120" />
<br />
<b>dr. Ferdi Iskandar</b><br />
Lead Architect
<br />
<a href="https://ferdiiskandar.com"><img src="https://img.shields.io/badge/FERDIISKANDAR.COM-0D1117?style=for-the-badge&logo=vercel&logoColor=white" alt="ferdiiskandar.com" /></a>
<br />
<img src="https://img.shields.io/badge/KEDIRI%20INDONESIA-22D3EE?style=flat-square" alt="Kediri Indonesia" />
<img src="https://img.shields.io/badge/UTC%2B7-5B8CFF?style=flat-square" alt="UTC+7" />

</td>
<td width="66%" valign="top">

### [SENTRA / AGENT ORIGIN](https://sentrahai.com/)

<a href="https://ferdiiskandar.com"><img src="https://readme-typing-svg.demolab.com?font=Caveat&weight=700&size=33&duration=3400&pause=1500&color=EB5939&vCenter=true&width=710&height=44&lines=Technology+terbaik+adalah+yang+bekerja+dalam+diam." alt="Technology terbaik adalah yang bekerja dalam diam." /></a>

**Operational signal:** Kediri, Indonesia · UTC+7 · clinical intelligence under active construction

[**Sentra Bot**](https://sentrahai.com/) — persistent AI teammates you actually own: bots with memory, routines, and computers.

<sub><code>CLINICAL SIGNAL → REASONING → VERIFICATION → HUMAN AUTHORITY → ACTION</code></sub>

</td>
</tr>
</table>

---

## 00 / WHAT THIS REPOSITORY IS

Sentra Bot is the operating layer of Sentra: **persistent, composable AI teammates you actually own**, running against your own models, your own data, and your own machines. This repository holds the full engine: the API, the web + desktop clients, the background worker, the sandbox/computer providers, and the RME bridge for read-only clinical record reconnaissance.

The guiding rules of this codebase:

- **The human holds the key.** Machines propose; a human reviews, verifies, and acts. Nothing signs itself.
- **Read-only until proven.** Clinical layers (like the RME adapter) start strictly read-only. No write reaches a patient record until the read path is verified end to end.
- **BYOD — models & computers.** Bring your own model and computer provider, or run the whole stack locally. No single-vendor lock-in.
- **Separable by design.** Reasoning, memory, orchestration, computers, and security are independent modules that can be inspected or replaced without the rest noticing.

---

## 01 / REPOSITORY LAYOUT

```
sentra-agent/
├── apps/
│   ├── api/       # HTTP API + auth + orchestration (Hono, port 3100)
│   ├── web/       # Web client (React + Vite, port 5173)
│   ├── desktop/   # Electron shell hosting the web client (Sentra Bot)
│   └── worker/    # Background worker: routines, wakeups, jobs
├── packages/
│   ├── adapter-kit/  # Ports & interfaces shared by API/worker/adapters
│   ├── adapters/     # Concrete adapters: sandboxes, executors, realtime, connectors, secrets
│   ├── auth/         # Better Auth wiring (sessions, signup policy)
│   ├── chat-ui/      # Cross-platform markdown rendering (web + native)
│   ├── contracts/    # Shared typed RPC/service contracts
│   ├── core/         # Pure domain logic: cron, events, search, secrets-guard
│   ├── db/           # Prisma schema + migrations + data-access repos
│   ├── memory/       # Per-bot markdown memory store
│   ├── testkit/      # Test harnesses: topology, computer e2e, canary, performance
│   ├── ui-tokens/    # Design tokens / theme primitives
│   └── ui-web/       # Shared React UI components
├── infra/
│   ├── compose/      # Docker Compose topologies + Dockerfile + Caddy + DEPLOY.md
│   └── sandboxes/    # Bot computer images: computer, desktop, supervisor
└── scripts/          # backup.sh / restore.sh
```

---

## 02 / TOP-LEVEL ARCHITECTURE

Sentra Bot is a **multi-process, event-driven** system: three long-running Node processes + one database + optional cloud computers.

```
  browser / Electron client (web)
        │          │
        ▼          ▼
   ┌────────┐  /api /rpc /health  ┌────────┐
   │  web   │◄───────────────────►│  api   │  :3100 (Hono + @orpc/server)
   └────────┘                     └────┬───┘
                                      │ Prisma / SQL
   ┌────────┐  job queue (Graphile)   ▼
   │ worker │◄─────────────────────────────►  PostgreSQL 16
   └───┬────┘                       (Supabase  OR  local Compose)
       │ sandbox API (supervisor :7091)
       ▼
   supervisor ──spawns──► bot computers
   (Docker)             Docker / E2B / Daytona / Box / desktop
```

**Runtime data flow:** a client calls the API over typed RPC (`/rpc/*`). The API enforces auth + membership, persists to Postgres via Prisma, emits thread events that fan out to connected clients (Postgres LISTEN/NOTIFY, or in-memory in tests), and dispatches background work (routines, wakeups, run continuation) through a job publisher consumed by the worker. Bot computers are sandboxes managed by a supervisor; workspace state is checkpointed back to a durable `DATA_DIR`, so cloud sandboxes are a runtime cache — not the source of truth.

---

## 03 / THE APPS

### 03.1 · API — `apps/api` (port 3100)

HTTP layer built with **Hono** + **@orpc/server**. Responsibilities:

- Auth routes under `/api/auth/*` (Better Auth; write endpoints blocked in v1).
- Typed RPC router under `/rpc/*`: bootstrap, bots, threads, routines, computers, connections, artifacts, usage, export, notifications, search.
- CORS with a trusted-origin allowlist (own origins, `rakazo://`, `exp://`, localhost).
- Health endpoint `GET /health` reporting runtime, sandbox provider, composio, job driver, realtime id.
- Wires the full stack: DB client, realtime fanout, job publisher, sandbox provider, secret store, memory, artifacts, agent runtime, auth.

### 03.2 · Web client — `apps/web` (port 5173)

React + Vite SPA. Talks to the API over RPC; in Compose it proxies `/api` and `/rpc` to the API container. Pages: Auth, Welcome, Onboarding, Shell, WindowChrome, WorkspaceSearch, ModelSettingsOverlay, PluginsOverlay, RoutineSchedule, HostComputerPrompt, BotContextMenu.

### 03.3 · Desktop — `apps/desktop`

Electron shell (`productName: "Sentra Bot"`) hosting the web client, plus the `SANDBOX_PROVIDER=desktop` ("run on this machine as you") path. It is a **client of the same API** — not a second backend.

### 03.4 · Worker — `apps/worker`

Long-running background process: consumes the job queue (Graphile by default), executes bot runs, reconciles scheduled routines. Shares the same packages as the API.

---

## 04 / THE PACKAGES

| Package | Role |
| --- | --- |
| `@rakazo/adapter-kit` | Interfaces/ports: job publisher, realtime fanout, sandbox provider, memory, home, artifacts, adapter context. |
| `@rakazo/adapters` | Concrete implementations: run executor, sandbox factory (docker/e2b/daytona/box/desktop/fake), Pi runtime, realtime (Postgres/in-memory), Graphile + in-memory job queues, secret store, Expo push, job reconciler, connectors/composio. |
| `@rakazo/auth` | Better Auth config, sessions, signup allowlist policy, blocked v1 paths. |
| `@rakazo/contracts` | Type-safe RPC contracts shared client↔server. |
| `@rakazo/core` | Pure logic: cron, events, run-state, search, secrets-guard, attachments, message pages. |
| `@rakazo/db` | Prisma schema + migrations + data-access repos (thread events, model credentials, isolation). |
| `@rakazo/memory` | Per-bot markdown memory store. |
| `@rakazo/testkit` | Harnesses: topology, computer e2e, canary, performance reports, playwright dashboard. |
| `@rakazo/ui-tokens` / `@rakazo/ui-web` / `@rakazo/chat-ui` | Theme + shared components + markdown rendering. |

---

## 05 / DATABASE

**ORM:** Prisma (schema `packages/db/prisma/schema.prisma`), migrations in `packages/db/prisma/migrations/`.

**Models include:** user, session, workspace, membership, bot, thread, message, run, event, routine, computer, computerExecutionLease, artifact, secret, userModelCredential, connection, memoryDocument, usageRecord, deploymentSettings.

**Two database backends:**

1. **Local Compose Postgres 16** — `docker-compose.yml` publishes Postgres on loopback only (`127.0.0.1:5433`), user/db/pass `rakazo`, named volume `pgdata`.
2. **Supabase (central)** — `DATABASE_URL` = pooled/transaction URL (port 6543, `?pgbouncer=true`) for the app; `DIRECT_URL` = direct URL (port 5432) for Prisma migrations.

> Prisma migrations always run against `DIRECT_URL` — a pooled URL cannot run `CREATE TABLE`.

**Jobs / wakeups:** `WAKEUP_DRIVER=graphile` uses a Postgres-backed Graphile Worker queue (same DB). `WAKEUP_DRIVER=memory` swaps to an in-memory queue (tests/dev only).

**Realtime:** thread events fan out via Postgres `LISTEN/NOTIFY` (`PostgresRealtimeFanout`) or an in-memory fanout when no pool exists.

---

## 06 / INFRASTRUCTURE & DEPLOYMENT TOPOLOGIES

All under `infra/compose/`. Every topology uses the same multi-stage `Dockerfile` (node:22, corepack, `pnpm install`, Prisma generate, web build, `USER node`).

### 06.1 · Local dev — `docker-compose.yml`
Services: `postgres`, `supervisor` (Docker sandbox with the Docker socket), `computer` (builds `sentra-agent/computer:local`), `data-init`, `api`, `worker`, `web`. Postgres on loopback `:5433`. The supervisor owns bot-container lifecycle; the API does **not** get a raw Docker socket.

### 06.2 · Single-VM production — `docker-compose.prod.yml`
Postgres + API + worker + web + **Caddy** (automatic HTTPS via Let's Encrypt). Hardened: `security_opt: no-new-privileges`, `cap_drop: ALL`, pid/mem limits, internal `data` network, health-checked services. Bot computers run in **E2B** by default here (`SANDBOX_PROVIDER=e2b`) so the VM never exposes a supervisor or browser containers.

### 06.3 · Central backend + Supabase — `docker-compose.supabase.yml`
Same API/web/worker/Caddy, but **no Postgres container** — the database is Supabase. End users run nothing locally; they just open the URL (or the desktop exe pointed at it) and log in.

### Caddy routing (`Caddyfile.prod`)
`/health`, `/api/*`, `/rpc/*` → `api:3100`; everything else → `web:5173`. zstd+gzip. `CADDYFILE_PATH` + `Caddyfile.cloudflare.example` support a Cloudflare allowlist front for Full (strict) TLS.

### Bot computers (sandbox providers)

| Provider | Where bots run | Notes |
| --- | --- | --- |
| `docker` | Local Compose supervisor | Default for local; quickest self-hosted |
| `e2b` | Remote E2B cloud desktop | Recommended for public/multi-user; workspace checkpointed locally |
| `daytona` | Daytona sandboxes | Remote computer contract |
| `box` | Box by ASCII managed desktop | One shared desktop; `noEnv`, 2h TTL refresh |
| `desktop` | The API/worker host ("this machine") | Only on an owned/trusted host |
| `fake` | None | Emulator for tests only |

### Host hardening
`sudo DEPLOY_USER=deploy bash infra/compose/harden-host.sh` — disables SSH passwords/root, rate-limits SSH, UFW allowlists, fail2ban, unattended upgrades, AppArmor, audit rules. `docker-daemon.json` enables live-restore + bounded logs.

### Backup / restore
`./scripts/backup.sh` (pg_dump + `data/` archive to `backups/<stamp>/`); `./scripts/restore.sh backups/<stamp>`. Production uses `backup-prod.sh` + a systemd timer (7-day rotation, mode 0600).

---

## 07 / ENVIRONMENT VARIABLES

Copy `.env.example` → `.env`. Never commit `.env` (gitignored, excluded from the Docker build context).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | App DB connection. Supabase: pooled/transaction (6543). |
| `DIRECT_URL` | Direct URL (5432) used by Prisma migrations. |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars). |
| `BETTER_AUTH_URL` / `WEB_ORIGIN` / `API_URL` | Public origins driving cookies/CORS. |
| `ENCRYPTION_KEY` | Encryption for stored credentials (64-char hex/passphrase). |
| `DATA_DIR` | Durable app data: bot homes, browser profiles, artifacts. |
| `SIGNUPS_ENABLED` / `SIGNUP_ALLOWLIST` | Registration control. |
| `SANDBOX_PROVIDER` | docker/e2b/daytona/box/desktop/fake. |
| `SANDBOX_SUPERVISOR_URL` / `SANDBOX_SUPERVISOR_TOKEN` | Supervisor address + shared credential (defaults to auth secret). |
| `SANDBOX_IDLE_MS` / `SANDBOX_COMMAND_TIMEOUT_MS` | Idle pause + command timeout. |
| `AGENT_RUNTIME` | pi (production) vs scripted (tests). |
| `WAKEUP_DRIVER` | graphile (prod) vs memory (tests). |
| `OPENROUTER_API_KEY` / `PI_DEFAULT_PROVIDER` / `PI_DEFAULT_MODEL` | Model provider + defaults (users can also bring keys). |
| `E2B_API_KEY` / `DAYTONA_API_KEY` / `DAYTONA_API_URL` / `DAYTONA_TARGET` / `BOX_API_KEY` / `BOX_API_URL` | Per sandbox-provider credentials. |
| `COMPOSIO_API_KEY` | Plugins/connectors (optional). |
| `EXPO_PUBLIC_API_URL` / `RAKAZO_WEB_URL` | Client overrides pointing clients at a central origin. |
| `SMTP_URL` / `VAPID_*` | Email + push (optional). |
| `OTEL_EXPORTER_OTLP_ENDPOINT` / `LOG_LEVEL` | Observability. |

---

## 08 / RUNNING IT

### Local (single machine, Docker)
```
cp .env.example .env    # set BETTER_AUTH_SECRET, ENCRYPTION_KEY, OPENROUTER_API_KEY
pnpm install
pnpm sandbox:build      # build sentra-agent/computer:local
docker compose --env-file .env -f infra/compose/docker-compose.yml up --build
# open http://127.0.0.1:5173 — first registered user becomes deployment owner
```

### Local (source, no Docker for web)
```
cp .env.example .env
pnpm install
pnpm sandbox:build
pnpm dev                # turbo: api + worker + web (+ supervisor)
# open http://127.0.0.1:5173
```

### Single-VM production
```
docker compose --env-file .env -f infra/compose/docker-compose.prod.yml up -d --build
curl --fail https://app.example.com/health
```

### Central + Supabase
1. Set `DATABASE_URL` (pooled 6543) + `DIRECT_URL` (direct 5432) to Supabase.
2. `pnpm --filter @rakazo/db exec prisma migrate deploy` (uses DIRECT_URL).
3. `docker compose --env-file .env -f infra/compose/docker-compose.supabase.yml up -d --build`.

### Database migrations (any topology)
```
pnpm db:generate
pnpm db:migrate      # or: pnpm --filter @rakazo/db exec prisma migrate deploy
```

---

## 09 / TESTING & QUALITY

```bash
pnpm check                 # type-check all packages
pnpm lint                  # biome
pnpm test                  # vitest unit tests
pnpm test:integration      # integration harness
pnpm test:e2e / test:topology
pnpm test:canary / test:computer
pnpm perf:desktop / perf:compare
```

CI (`.github/workflows/ci.yml`) runs check/lint/test on PRs and push; Playwright + nightly-verification cover browsers.

---

## 10 / RME BRIDGE (READ-ONLY CLINICAL RECONNAISSANCE)

The clinical layer starts **read-only by design**. The v0.1 adapter opens the RME in a headed Chromium browser, reads **one** patient, and produces structured, validated JSON — no writes. Login is manual by the user (credentials are never requested, stored, or committed). This is deliberately **not** expanded to all patients or clinical AI until one patient is manually verified end to end.

---

## 11 / BRANDING & LICENSING

The product is **Sentra Bot**. Internal package identifiers historically carry the `@rakazo/*` namespace (upstream naming); branding changes only what users see — internal identifiers are intentionally untouched. **License:** Apache 2.0 (see `LICENSE`). See `SECURITY.md` and `AGENTS.md` for the operating contract, and never commit secrets.

---

### 07 / CREDIT

Sentra Bot is built on the shoulders of **Rakazo** — the upstream open-source agent platform this repository is derived from (packaging, adapter architecture, and the persistent-bot engine). We thank the Rakazo authors and community. Everything Sentra-specific — branding, clinical/read-only direction, and the central Supabase deployment path — is layered on top of that foundation.

