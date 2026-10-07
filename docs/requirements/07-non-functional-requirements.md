# Non-functional requirements

**Document ID:** SENTRA-BOT-NFR-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC 25010:2023 quality model, expressed as testable requirements

## 1. Functional suitability

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-FIT-001 | Core journeys (signup, send, approve, computer boot) shall be covered by automated tests that do not call live vendors. | Implemented |
| NFR-FIT-002 | Product-path defaults shall be `AGENT_RUNTIME=pi`, `WAKEUP_DRIVER=graphile`, `SANDBOX_PROVIDER=docker`. Test-only values (`scripted`, `memory`, `fake`) shall not be documented as production. | Implemented |

## 2. Performance efficiency

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-PERF-001 | Desktop performance shall be measurable with `pnpm perf:desktop` against scripted runtime and fake sandbox. | Implemented |
| NFR-PERF-002 | Run leases shall renew every 60 s; stalled work is bounded by lease expiry plus `SANDBOX_COMMAND_TIMEOUT_MS` (default 300000). | Implemented |
| NFR-PERF-003 | Sandbox idle pause default shall be `SANDBOX_IDLE_MS=600000` (minimum 30000). | Implemented |
| NFR-PERF-004 | SSE fan-out shall not carry event payloads on Postgres NOTIFY; durable rows are the truth. | Implemented |

## 3. Compatibility and portability

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-PRT-001 | Runtime shall support Node.js `^22.22.2 \|\| ^24.0.0 \|\| >=26.0.0` and pnpm 9.15. | Implemented |
| NFR-PRT-002 | Database shall be PostgreSQL 16 via Prisma. | Implemented |
| NFR-PRT-003 | Computer providers shall be replaceable through `SandboxProvider` without rewriting agent tools. | Implemented |
| NFR-PRT-004 | Published images shall document amd64 `edge` vs multi-arch release tags; operators must not assume `latest`. | Implemented |

## 4. Usability and accessibility

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-USE-001 | Interactive controls shall use semantic HTML (`button`, `a`) with accessible names where the UI is non-text. | Partial (convention in AGENTS.md / coding standard; not fully audited) |
| NFR-USE-002 | Approval UX shall be Allow / Deny (and Always where offered), not prompt-engineering instructions. | Implemented |
| NFR-USE-003 | Public documentation for Indonesian users shall exist in `apps/docs`. | Implemented |

## 5. Reliability

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-REL-001 | Worker death shall recover via keyed re-enqueue without waiting Graphile’s 4-hour stale-lock window. | Implemented |
| NFR-REL-002 | Illegal run-state transitions shall throw rather than persist. | Implemented |
| NFR-REL-003 | Compose production files shall include health checks and `no-new-privileges` posture as documented. | Implemented |

## 6. Security (quality view)

Detailed controls: [08-security-and-privacy-requirements.md](08-security-and-privacy-requirements.md).

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-SEC-001 | Secrets in git are forbidden. `.env` is gitignored and excluded from Docker context. | Implemented |
| NFR-SEC-002 | Stored credentials shall use versioned AES-GCM with per-record salt and row-bound AAD. | Implemented |
| NFR-SEC-003 | Postgres in local Compose shall bind loopback only (`127.0.0.1:5433`). | Implemented |

## 7. Maintainability

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-MNT-001 | Shared domain logic shall live in `packages/core`; RPC contracts in `packages/contracts`. | Implemented |
| NFR-MNT-002 | CI shall run lint, typecheck, production build, unit, integration, and Playwright e2e on pull requests. | Implemented |
| NFR-MNT-003 | Architecture decisions shall be appended to `docs/architecture.md` rather than restated in plans. | Implemented |

## 8. Operability

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-OPS-001 | Optional OpenTelemetry export via `OTEL_EXPORTER_OTLP_ENDPOINT`. | Implemented |
| NFR-OPS-002 | Log level via `LOG_LEVEL`. Run logs are structured JSON lines. | Implemented |
| NFR-OPS-003 | Operators shall have backup/restore and a documented single-VM production Compose path. | Implemented |
