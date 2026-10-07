# Requirements traceability matrix

**Document ID:** SENTRA-BOT-RTM-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC/IEEE 29148 (traceability)

Columns: stakeholder → software/NFR/SEC → use case → primary evidence in the repository.

| Stakeholder | Requirement | Use case | Evidence |
| --- | --- | --- | --- |
| StR-001 | FR-SYS-006, FR-CMP-002 | UC-01 | `.env.example`, Compose files |
| StR-002 | FR-RUN-005, FR-RUN-006, SEC-AZN-003 | UC-03 | executor, Ask cards, `external_effects` |
| StR-003 | FR-AUTH-002 | UC-01 | onboarding / self-host.md |
| StR-004 | FR-MDL-001, FR-MDL-003 | UC-02 | `models.*` |
| StR-005 | FR-MEM-001, FR-CMP-004 | UC-04 | memory package, `DATA_DIR` |
| StR-006 | FR-RTN-001 | UC-06 | `routines.*` |
| StR-007 | FR-CMP-005, FR-CMP-006 | UC-05 | `computer.*` |
| StR-008 | FR-CLI-001–004, NFR-MNT-001 | UC-01 | `packages/contracts`, clients |
| StR-009 | FR-PHN-001, FR-PHN-002 | UC-07 | `phone.whatsapp.*` |
| StR-010 | FR-BIL-001, FR-BIL-004 | UC-11 | `platform-policy.ts`, paket-free-batas-v1.md |
| StR-011 | SEC-CLN-001, FR-NX-001 | — | no EMR write adapter in repo |
| StR-012 | SEC-DIS-001 | UC-12 | `SECURITY.md` |
| StR-013 | SEC-PRI-003 | — | optional PostHog |
| StR-014 | FR-PHN-003 | UC-07 | `PHONE_LOCALE` |
| StR-015 | FR-BOT-006 | UC-01 | `packages/bot-templates` (66) |
| — | FR-SYS-001–007 | UC-01, UC-02 | architecture.md, api, worker |
| — | FR-AUTH-001–006 | UC-01 | auth package |
| — | FR-BOT-001–007 | UC-01 | `bots.*`, `groups.*` |
| — | FR-THR-001–006 | UC-02 | `threads.*`, `search.query` |
| — | FR-RUN-001–008 | UC-02, UC-03 | `run-state.ts`, executor |
| — | FR-CMP-001–009 | UC-04, UC-05, UC-09 | computer-runtime.md |
| — | FR-MEM-*, FR-SKL-*, FR-RTN-* | UC-06 | rpc.ts |
| — | FR-INT-001–003 | UC-08 | connections, mcp |
| — | FR-VOI-001 | — | `voice.*` |
| — | FR-OPS-001–003 | UC-10 | updater, scripts |
| — | FR-NX-002–004 | — | this package, architecture decision log |
| — | NFR-REL-001 | UC-02 | graphile-restart tests |
| — | NFR-SEC-001–003 | UC-01 | gitignore, Compose |
| — | SEC-CRY-001–005 | UC-04, UC-08 | self-host.md |
| — | SEC-SND-001–004 | UC-04, UC-09 | supervisor, architecture.md |
| — | IRS-UI-001–003 | UC-01 | apps/* |
| — | DRS-001–009 | — | schema.prisma, export.bot |

## Coverage notes

- Every StR maps to at least one SRS/SEC item.
- Planned items (WhatsApp group agent, clinical read adapter) are **not** in this matrix as Implemented.
- Experimental hybrid relay is traced only as FR-NX-003 / DRS-005.

## Maintenance

Update this matrix in the same change as any new FR/NFR/SEC ID. Do not add IDs only in the SRS.
