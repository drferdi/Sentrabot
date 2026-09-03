# Verification and validation plan

**Document ID:** SENTRA-BOT-VV-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC/IEEE 29148 (verification provisions); ISO/IEC/IEEE 12207 (verification and validation processes)

## 1. Purpose

Define how Sentra Bot demonstrates that implemented behaviour matches this requirements package (verification) and that the product is usable for the charter success criteria (validation).

## 2. Principles

- Default tests are **deterministic and offline**.
- Live vendor canaries are **not** pull-request gates.
- The product path is Pi + Docker + Graphile. Emulators are for tests.

## 3. Verification levels

| Level | Command | What it proves | PR CI |
| --- | --- | --- | --- |
| Static | `pnpm lint` | Biome lint/format | Yes |
| Types | `pnpm check` | TypeScript across the workspace | Yes |
| Build | `pnpm build` + Electron preload smoke | Production compile | Yes |
| Unit | `pnpm test` | Domain, contracts, adapters with fakes | Yes |
| Integration | `pnpm test:integration` | Postgres Testcontainers journeys, authz, Graphile, LISTEN/NOTIFY | Yes |
| E2E | `pnpm test:e2e` | Playwright vs emulated API | Yes |
| Topology | `pnpm test:topology` | Docker computer + worker recovery | No |
| Canary | `pnpm test:canary` | Live OpenRouter / E2B | No |
| Computer vision | `pnpm test:computer` | Real vision model + E2B | No |
| Performance | `pnpm perf:desktop` | Packaged renderer metrics | No |
| Nightly | `.github/workflows/nightly-verification.yml` | Longer path | Scheduled |

CI workflow: `.github/workflows/ci.yml`.

## 4. Requirement-to-method mapping (summary)

| Class | Method |
| --- | --- |
| FR-SYS, FR-AUTH, FR-BOT, FR-THR, FR-RUN | Unit + integration journeys (`packages/testkit`) |
| FR-CMP | Provider conformance tests + topology/computer e2e |
| FR-INT | Offline fakes; never live OAuth in PR CI |
| FR-PHN | Unit/contract; live WhatsApp out of CI |
| FR-BIL | `platform-policy` unit tests; commercial numbers reviewed against product doc |
| NFR-REL-001 | `packages/adapters/src/graphile-restart.postgres.test.ts` |
| SEC-* | Code review, architecture decision log, absence tests where applicable |

## 5. Validation (human)

Charter success criteria (CHAR-001 §7) are validated by an operator or agent following `SETUP_PROMPT.md` and `docs/self-host.md`:

1. Health endpoint ok with expected sandbox provider.
2. Signup and first-run.
3. Harmless test message if a model is connected.
4. Computer pane reaches `running` on Docker path.

UI changes that affect layout or client state require exercising the flow in a browser (project rule), not a screenshot only.

## 6. Independence

There is no separate independent V&V organisation. Independence is approximated by:

- CI on every PR;
- architecture decision log with evidence;
- this requirements package as a baseline distinct from implementation plans.

## 7. Exit criteria for a change

A requirements-affecting change is verified when:

1. Automated PR jobs listed above pass;
2. New behaviour has a test or an explicit reason it cannot (live vendor);
3. RTM and SRS status codes are updated if the world changed.
