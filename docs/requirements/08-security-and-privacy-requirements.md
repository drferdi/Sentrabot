# Security and privacy requirements

**Document ID:** SENTRA-BOT-SEC-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standards:** OWASP ASVS v5.0 (selected), ISO/IEC 27001:2022 control themes, HIPAA Security Rule technical safeguards **as design doctrine for PHI — this product is not a hospital information system**

## 1. Scope and non-scope

This document covers the Sentra Bot self-hosted product in this repository.

Out of scope for the vulnerability programme: third-party model APIs, Composio/E2B/etc., and operator misconfiguration (`SECURITY.md`).

Sentra Bot is legally separated from RSIA Melinda DHAI information systems (`docs/legal/kebijakan-privasi.md`). It shall not mix patient-record operational data with product accounts.

## 2. Disclosure

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-DIS-001 | Vulnerabilities shall be reported to `security@sentrabot.com`, not public issues. | Implemented |
| SEC-DIS-002 | Supported versions: current `main` and latest release (beta). No bug bounty. | Implemented |

## 3. Authentication and session

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-AUTH-001 | Session tokens shall be server-issued (Better Auth); RPC handlers shall not trust client-supplied identity fields. | Implemented |
| SEC-AUTH-002 | CORS and cookies shall be origin-bound to configured public URLs. | Implemented |
| SEC-AUTH-003 | Signup can be disabled or allowlisted by the Owner after init. | Implemented |

## 4. Authorisation

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-AZN-001 | Workspace membership is required for workspace data access. | Implemented |
| SEC-AZN-002 | Thread/bot access shall resolve through ownership/membership, not unguessable-but-unchecked IDs alone. | Implemented |
| SEC-AZN-003 | Prompt text is not an access-control mechanism. Enforcement is capability, connector, credential, policy, and tool-gate layers. | Implemented |
| SEC-AZN-004 | Trusted host tools that affect the machine shall ASK by default. | Implemented |

## 5. Cryptography and secrets

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-CRY-001 | `ENCRYPTION_KEY` (64 hex) protects stored credentials; rotation must consider existing ciphertext. | Implemented |
| SEC-CRY-002 | `BETTER_AUTH_SECRET`, `SANDBOX_SUPERVISOR_TOKEN`, and `SCREEN_PROXY_SECRET` shall be distinct. | Implemented |
| SEC-CRY-003 | Supervisor API shall require a bearer token; default bind is loopback. | Implemented |
| SEC-CRY-004 | Screen URLs shall use a signed capability proxy so vendor desktop secrets are not exposed in the browser. | Implemented |
| SEC-CRY-005 | Connector credentials shall not appear in capability config, fixtures, logs, or snapshots. | Implemented |

## 6. Sandbox and host

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-SND-001 | The API shall not receive an unrestricted Docker socket; the supervisor owns lifecycle. | Implemented |
| SEC-SND-002 | Path containment shall apply inside sandboxes; Windows host containment uses Win32 handle identity (see architecture.md). | Implemented |
| SEC-SND-003 | `desktop` provider is trusted host execution, experimental, owner-only. | Implemented |
| SEC-SND-004 | Production Compose shall drop capabilities, prevent new privileges, and keep Postgres off the public interface. | Implemented |

## 7. Privacy and data minimisation

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-PRI-001 | Transcripts, memory, files, audit events, and locally managed credentials stay in the operator’s PostgreSQL and `DATA_DIR` unless an optional provider is enabled. | Implemented |
| SEC-PRI-002 | Optional providers receive only what architecture.md lists for that key. | Implemented |
| SEC-PRI-003 | PostHog, when configured, shall carry anonymous product metadata only. | Implemented |
| SEC-PRI-004 | Run logs shall not include prompts, tool arguments, message text, or stack traces. | Implemented |
| SEC-PRI-005 | Conversation content shall not be used to train Sentra-owned models (product policy; legal draft). | Specified |
| SEC-PRI-006 | PHI/PII shall not appear in logs, analytics, or URLs. | Specified (engineering rule; operator still responsible for what they paste into threads) |

## 8. Clinical boundary

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-CLN-001 | This baseline shall not provide a write path to a patient record or hospital EMR. | Implemented (no such adapter) |
| SEC-CLN-002 | Documentation shall not claim a shipped RME reconnaissance adapter unless code exists. | Implemented by this package (README corrected) |
| SEC-CLN-003 | Future clinical adapters, if approved, start read-only, one-patient, manual login, no stored clinical credentials. | Planned (doctrine) |

## 9. Supply chain

| ID | Requirement | Status |
| --- | --- | --- |
| SEC-SUP-001 | UI components shall not be installed from the live shadcn registry (`AGENTS.md`). | Implemented (process) |
| SEC-SUP-002 | Lockfile (`pnpm-lock.yaml`) is committed; CI uses `--frozen-lockfile`. | Implemented |

## 10. Legal drafts

Privacy and terms under `docs/legal/` are **drafts**. They must not be treated as in-force until counsel review. Public site HTML is a publication surface, not a substitute for that review.
