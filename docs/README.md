# Documentation map

This directory is the controlled documentation set for **Sentra Bot**.

Public product copy lives in `apps/docs` (Mintlify) and `apps/site`. Implementation plans live under `docs/superpowers/` and `docs/plans/`. They are not the requirements baseline.

## Start here

| Audience | Read first |
| --- | --- |
| New contributor | [CONTRIBUTING.md](../CONTRIBUTING.md), then [architecture.md](architecture.md) |
| Product / programme | [requirements/README.md](requirements/README.md) |
| Operator / self-host | [self-host.md](self-host.md) |
| Security reviewer | [SECURITY.md](../SECURITY.md), [requirements/08-security-and-privacy-requirements.md](requirements/08-security-and-privacy-requirements.md) |
| Legal / policy (draft) | [legal/](legal/) |

## Baseline (as-built)

| Document | Role |
| --- | --- |
| [architecture.md](architecture.md) | Runtime topology and decision log. Single source of truth for *how the system is wired today*. |
| [requirements/](requirements/) | ISO/IEC/IEEE 29148 requirements package. Single source of truth for *what the product must do*. |
| [self-host.md](self-host.md) | Operator runbook for local, Compose, published images, and production. |
| [computer-runtime.md](computer-runtime.md) | Sandbox provider contract and workspace durability. |
| [performance.md](performance.md) | Desktop performance measurement. |
| [mobile-release.md](mobile-release.md) | Mobile store-release process (no production identifiers in git). |
| [product/paket-free-batas-v1.md](product/paket-free-batas-v1.md) | Locked Free-plan limits (Chief, 2026-09-01). |

## Brand, legal, and internal plans

| Path | Status |
| --- | --- |
| [brand/](brand/) | Brand assets and guidelines |
| [legal/](legal/) | Draft privacy, terms, and about copy — **not legal-reviewed** |
| [plans/](plans/) | Internal product strategy notes |
| [superpowers/](superpowers/) | Implementation specs and plans; some items are frozen or superseded by `architecture.md` |

## Document language

- Requirements, architecture, operator, and contributor documents are **English** (international project language).
- Public Indonesian user-facing copy lives in `apps/docs` and `apps/site`.
- When numbers disagree, the English requirements package and `architecture.md` win for engineering; `docs/product/paket-free-batas-v1.md` wins for commercial plan limits.

## Verification date

This map was reconciled against the repository on **2026-09-03**.
