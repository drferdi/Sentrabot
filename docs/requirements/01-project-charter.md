# Project charter

**Document ID:** SENTRA-BOT-CHAR-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** aligned with ISO 21500 / PMBOK charter content, scoped to a software product

## 1. Project title

Sentra Bot — persistent, operator-owned AI teammates with explicit human authority.

## 2. Sponsor and owner

| Role | Party |
| --- | --- |
| Sponsor / owner | Dr. Ferdi Iskandar, Chief, Sentra Artificial Intelligence |
| Legal entity | PT Adianda Putri Iskandar |
| Programme home | Sentra Artificial Intelligence (sentrahai.com) |
| Product | Sentra Bot (this repository) |

## 3. Problem statement

Most AI assistants are a single hosted chat box. Conversation history, credentials, and tool access live on a vendor's infrastructure. Autonomy is implied by prompt wording rather than enforced by the runtime.

Operators who need durable agents — memory, routines, computers, integrations — also need:

- data and secrets that stay on infrastructure they control;
- a replaceable model and computer provider;
- a hard stop before irreversible action;
- clients on web, desktop, and mobile against one API.

## 4. Project purpose

Deliver a self-hostable agent runtime and clients so a person or organisation can run persistent bots that perceive, reason, wait for human authority, and then act — without binding the core product to a single hosted vendor.

## 5. In scope (charter)

- One product across web, Electron desktop, and Expo mobile, with shared contracts in packages.
- API (`apps/api`) as the public runtime boundary; worker as the execution lane.
- Optional providers (models, sandboxes, connectors, voice, billing, phone) behind interfaces.
- Human approval for consequential tools.
- Self-host and published-image deployment paths.

## 6. Out of scope (charter)

- A hosted vendor as a requirement to run the core product.
- Clinical write access to patient records.
- Treating prompt text as an access-control mechanism.
- Publishing legal terms without counsel review.
- The experimental hybrid control-plane relay as the current golden path (`SENTRABOT_CONTROL_PLANE_RELAY`).

## 7. Success criteria

The charter is met when an operator can:

1. Install from source or published images and complete first-run signup.
2. Create a bot, send a message, and receive a model reply when a model is connected.
3. Run a computer task on the configured sandbox provider, with workspace state checkpointed to `DATA_DIR`.
4. See an approval card for a consequential tool and allow or deny it.
5. Exercise web, and where packaged, desktop and mobile, against the same API.
6. Pass the repository verification gate (`pnpm check`, `pnpm lint`, `pnpm test`, and Docker-backed integration/e2e as documented).

## 8. High-level risks

See [13-risk-register.md](13-risk-register.md). Charter-level risks: secret handling, sandbox escape, optional-vendor lock-in, overstated clinical claims, and unpublished legal drafts.

## 9. Constraints

- Public repository: no secrets, production data, or private URLs in git.
- Apache-2.0 with retained Rakazo provenance (`NOTICE`).
- Node.js 22+ / 24+ / 26+, pnpm 9.15, PostgreSQL 16.
- Tests deterministic and offline by default.

## 10. Related documents

- [02-vision-and-scope.md](02-vision-and-scope.md)
- [docs/architecture.md](../architecture.md)
- [AGENTS.md](../../AGENTS.md)
