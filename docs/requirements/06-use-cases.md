# Use-case specification

**Document ID:** SENTRA-BOT-UCS-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** use-case form consistent with ISO/IEC 29148 operational scenarios

Actors: **User**, **Owner** (deployment owner), **Bot**, **Worker**, **Provider** (optional vendor).

---

## UC-01 First-run self-host

**Goal:** A new operator reaches a signed-in web UI on a local stack.  
**Preconditions:** Docker or `pnpm dev` dependencies available; `.env` created from `.env.example`.  
**Main flow:**

1. Operator starts Postgres, API, worker, web (Compose or turbo).
2. Operator opens `http://127.0.0.1:5173`.
3. Operator registers. System makes them Owner.
4. Operator completes onboarding and optionally connects a model.

**Success:** Health is ok; a session cookie is set; a workspace exists.  
**Status:** Implemented.

---

## UC-02 Send a message and receive a reply

**Preconditions:** Authenticated member; model credential or deployment key present.  
**Main flow:** User sends text on a bot thread → API creates task/run → Worker leases run → Pi runtime calls the model → assistant message persisted → SSE updates the client.  
**Extensions:** Attachments via `artifacts.create`; mentions of bots/groups/routines/connectors.  
**Status:** Implemented.

---

## UC-03 Consequential tool approval

**Preconditions:** Run in progress; tool is gated.  
**Main flow:** Executor records `external_effects` as `intended` → posts ask → run `waiting_input` → User Allow / Always / Deny → `run.continue`.  
**Success:** Deny never executes the effect; Always stores a workspace rule.  
**Status:** Implemented.

---

## UC-04 Use a Docker computer

**Preconditions:** `SANDBOX_PROVIDER=docker`; supervisor token set; computer image built.  
**Main flow:** User or agent boots computer → supervisor spawns container → tools observe/act/shell/files → checkpoint to `DATA_DIR` on completion/stop/idle.  
**Status:** Implemented.

---

## UC-05 Take control of a desktop

**Preconditions:** Computer running; for Team bots, no conflicting execution lease (or run is `waiting_takeover`).  
**Main flow:** User takeover → exclusive control lease → input events → release.  
**Failure:** HTTP 409 if the bot still holds an execution lease.  
**Status:** Implemented.

---

## UC-06 Schedule a routine

**Main flow:** User creates a routine with cron or `runAt` → Worker wakes at due time → new run on the bot thread → optional notify.  
**Failure:** Empty crons and webhook disabled.  
**Status:** Implemented.

---

## UC-07 Pair WhatsApp

**Preconditions:** All `WHATSAPP_*` required variables set.  
**Main flow:** User begins pairing for a bot → receives code and `waLink` → messages the business number → inbound messages create/continue the thread.  
**Voice notes:** Transcribe if configured; otherwise honest “not supported” copy.  
**Status:** Partial (pairing implemented; WhatsApp group-agent is planned).

---

## UC-08 Connect a managed integration

**Main flow:** User picks a catalog item → OAuth URL → complete → tools available to the executor under approval policy.  
**Revoke:** `connections.revoke`.  
**Status:** Implemented (optional keys).

---

## UC-09 Trusted host “This Mac”

**Preconditions:** Owner; `SANDBOX_PROVIDER=docker`; owner sets `computerHost=this-mac`.  
**Main flow:** Commands run on the API/worker host with bot home and user home as allowed roots; host-affecting tools ASK.  
**Status:** Implemented (experimental, owner-only).

---

## UC-10 Apply a server update

**Preconditions:** Updater sidecar reachable; caller is Owner.  
**Main flow:** `updater.check` → `updater.apply`. Rollback is not exposed on this RPC.  
**Status:** Implemented.

---

## UC-11 Downgrade from Plus to Free

**Main flow:** Grace elapses or user leaves paid plan → entitlements become Free limits → extra bots/schedules/integrations pause → data retained.  
**Status:** Specified (policy locked; confirm UX pause states in clients when changing billing UI).

---

## UC-12 Report a vulnerability

**Main flow:** Reporter emails `security@sentrabot.com` with repro and impact. No public GitHub issue.  
**Status:** Implemented (process).

---

## Use-case to requirement map

| Use case | Primary SRS IDs |
| --- | --- |
| UC-01 | FR-SYS-001, FR-AUTH-002, FR-BOT-005 |
| UC-02 | FR-THR-002, FR-RUN-001, FR-MDL-001 |
| UC-03 | FR-RUN-003, FR-RUN-005, FR-RUN-006 |
| UC-04 | FR-CMP-001, FR-CMP-003, FR-CMP-004 |
| UC-05 | FR-CMP-005, FR-CMP-006 |
| UC-06 | FR-RTN-001, FR-RTN-002 |
| UC-07 | FR-PHN-001, FR-PHN-002 |
| UC-08 | FR-INT-001 |
| UC-09 | FR-CMP-007, FR-RUN-007 |
| UC-10 | FR-OPS-001 |
| UC-11 | FR-BIL-001, FR-BIL-003, FR-BIL-004 |
| UC-12 | StR-012 |
