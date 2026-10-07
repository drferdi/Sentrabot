# Sentra Bot — Requirements package

**Document ID:** SENTRA-BOT-REQ-PKG-001  
**Standard:** ISO/IEC/IEEE 29148:2018 (Requirements engineering)  
**Related:** ISO/IEC/IEEE 12207:2017 (software life cycle), ISO/IEC 25010:2023 (quality), ISO/IEC 27001:2022 (information security), OWASP ASVS v5.0  
**Status:** Baseline, as-built 2026-09-03  
**Classification:** Internal engineering baseline (not published to Mintlify)  
**Language:** English

This package is the controlled requirements set for Sentra Bot. It describes the product as implemented in this repository, and it labels planned, experimental, and out-of-scope items explicitly. It does not invent features that are not in the code or in a locked product decision.

## How to use this package

1. Read [00-document-control.md](00-document-control.md) for ownership, status codes, and change control.
2. Read [01-project-charter.md](01-project-charter.md) and [02-vision-and-scope.md](02-vision-and-scope.md) for why the product exists.
3. Use [04-software-requirements-specification.md](04-software-requirements-specification.md) as the functional baseline.
4. Trace any change through [10-requirements-traceability-matrix.md](10-requirements-traceability-matrix.md).

When this package and a plan under `docs/superpowers/` disagree, **this package plus `docs/architecture.md` win** unless the Chief records a new decision.

## Document set

| ID | File | ISO / professional equivalent |
| --- | --- | --- |
| DOC-001 | [00-document-control.md](00-document-control.md) | Document control, master list |
| CHAR-001 | [01-project-charter.md](01-project-charter.md) | Project charter |
| VIS-001 | [02-vision-and-scope.md](02-vision-and-scope.md) | Vision and scope |
| StRS-001 | [03-stakeholder-requirements.md](03-stakeholder-requirements.md) | Stakeholder requirements specification |
| SRS-001 | [04-software-requirements-specification.md](04-software-requirements-specification.md) | Software requirements specification (IEEE 29148) |
| PRD-001 | [05-product-requirements.md](05-product-requirements.md) | Product requirements document |
| UCS-001 | [06-use-cases.md](06-use-cases.md) | Use-case specification |
| NFR-001 | [07-non-functional-requirements.md](07-non-functional-requirements.md) | Quality / NFR specification (ISO 25010) |
| SEC-001 | [08-security-and-privacy-requirements.md](08-security-and-privacy-requirements.md) | Security and privacy requirements |
| IRS-001 | [09-interface-and-data-requirements.md](09-interface-and-data-requirements.md) | Interface and data requirements |
| RTM-001 | [10-requirements-traceability-matrix.md](10-requirements-traceability-matrix.md) | Requirements traceability matrix |
| VV-001 | [11-verification-and-validation.md](11-verification-and-validation.md) | Verification and validation plan |
| GLO-001 | [12-glossary.md](12-glossary.md) | Glossary |
| RSK-001 | [13-risk-register.md](13-risk-register.md) | Requirements and delivery risk register |
| ACD-001 | [14-assumptions-constraints-dependencies.md](14-assumptions-constraints-dependencies.md) | Assumptions, constraints, dependencies |

## Status codes used in requirement IDs

| Code | Meaning |
| --- | --- |
| **Implemented** | Present in this repository and covered by code, tests, or operator docs |
| **Partial** | Core path exists; limits, packaging, or a client surface are incomplete |
| **Experimental** | Code exists but is frozen or off by default |
| **Specified** | Locked product decision; enforcement or UX may still be incomplete |
| **Planned** | Accepted direction; not the current golden path |
| **Out of scope** | Explicitly excluded from this baseline |
