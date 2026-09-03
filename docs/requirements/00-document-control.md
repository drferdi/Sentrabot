# Document control

**Document ID:** SENTRA-BOT-DOC-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Owner:** Product owner (Chief)  
**Maintainer:** Engineering  
**Review cycle:** On every material product change, and at least once per public release  
**Standard:** ISO/IEC/IEEE 29148:2018 §6 (requirements information item)

## 1. Purpose

This file controls the Sentra Bot requirements package. It defines ownership, status, numbering, and the rule for resolving conflicts between documents.

## 2. Identification

| Field | Value |
| --- | --- |
| Product name | Sentra Bot |
| Programme | Sentra Artificial Intelligence |
| Legal entity | PT Adianda Putri Iskandar |
| Repository | `https://github.com/drferdii/sentrabot` |
| License | Apache-2.0 (see `LICENSE` and `NOTICE`) |
| Product version described | 0.1.0 (Unreleased / public beta lineage) |
| Baseline date | 2026-09-03 |

## 3. Authority

| Role | Authority |
| --- | --- |
| Chief / product owner | Accepts, rejects, or locks requirements. Only this role may change commercial plan limits. |
| Engineering | Maintains as-built mapping, tests, and architecture decision log. |
| Security contact | `security@sentrabot.com` — vulnerability intake only. |
| Legal counsel | Required before publishing `docs/legal/*` as customer-facing terms. **Not yet completed.** |

## 4. Requirement numbering

```
<AREA>-<NNN>
```

Examples: `FR-AUTH-001`, `NFR-SEC-004`, `UC-07`.

IDs are stable. Retired requirements keep their ID and are marked **Withdrawn**. New work gets the next unused number in that area.

## 5. Conflict resolution

| Conflict | Winner |
| --- | --- |
| This package vs `docs/superpowers/*` or `docs/plans/*` | This package + `docs/architecture.md` |
| Engineering behaviour vs commercial limits | `docs/product/paket-free-batas-v1.md` for plan numbers; this package for system behaviour |
| README marketing prose vs architecture | `docs/architecture.md` |
| Indonesian public docs vs this package | This package for engineering facts; public docs for user language |

## 6. Change control

1. Edit the affected requirement file.
2. Update the traceability matrix if IDs, status, or verification method change.
3. Record the change in this document's revision history.
4. Do not silently rewrite locked commercial numbers (`paket-free-batas-v1.md`).

## 7. Master document list

See [README.md](README.md). Companion project files outside this folder:

| File | Role |
| --- | --- |
| `/README.md` | Public repository overview |
| `/AGENTS.md` | Contributor and agent operating rules |
| `/CONTRIBUTING.md` | Contribution process |
| `/CODE_OF_CONDUCT.md` | Community conduct |
| `/SECURITY.md` | Vulnerability reporting |
| `/LICENSE` | Apache-2.0 |
| `/CHANGELOG.md` | Keep a Changelog product notes |
| `/docs/architecture.md` | As-built runtime |

## 8. Revision history

| Version | Date | Description |
| --- | --- | --- |
| 1.0 | 2026-09-03 | Initial international baseline, reconciled to the repository as of commit lineage `main` 2026-09-03. |
