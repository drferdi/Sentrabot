# Stakeholder requirements specification (StRS)

**Document ID:** SENTRA-BOT-StRS-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Standard:** ISO/IEC/IEEE 29148:2018 (stakeholder requirements)

Stakeholder requirements are needs in the language of people who use, operate, or govern the product. Software requirements in SRS-001 refine these.

## 1. Stakeholders

| ID | Stakeholder | Interest |
| --- | --- | --- |
| SH-01 | End user / operator | Talk to bots, approve actions, keep data local |
| SH-02 | Deployment owner | First-run policy, computer host, updates, backups, signup control |
| SH-03 | Workspace member | Shared bots and computers under membership rules |
| SH-04 | Indonesia user | Bahasa Indonesia UI copy, WhatsApp channel, phone locale `id` |
| SH-05 | Self-host operator | Compose/images, loopback Postgres, no required cloud vendor |
| SH-06 | Security reviewer | Authn/z, encryption, sandbox isolation, disclosure process |
| SH-07 | Contributor | Tests, typed contracts, documented architecture |
| SH-08 | Legal / compliance | Accurate privacy and terms; clinical non-write |
| SH-09 | Upstream Rakazo authors | License attribution retained |

## 2. Stakeholder requirements

| ID | Requirement | Stakeholder | Status |
| --- | --- | --- | --- |
| StR-001 | The operator shall run the product on infrastructure they control, with optional remote providers. | SH-01, SH-05 | Implemented |
| StR-002 | Consequential actions shall wait for explicit human allow/deny (or a stored always-allow rule). | SH-01, SH-06 | Implemented |
| StR-003 | The first registered user shall become the deployment owner. | SH-02 | Implemented |
| StR-004 | The operator shall connect their own model credentials (BYOK) or a deployment-wide key. | SH-01, SH-05 | Implemented |
| StR-005 | Bots shall persist memory independently of an ephemeral sandbox. | SH-01 | Implemented |
| StR-006 | The operator shall schedule recurring or one-shot work in ordinary language or cron. | SH-01 | Implemented |
| StR-007 | The operator shall watch and, when allowed, take control of a bot computer. | SH-01 | Implemented |
| StR-008 | Web, desktop, and mobile shall speak the same API contracts. | SH-01, SH-07 | Implemented |
| StR-009 | WhatsApp shall be an optional daily channel, not a required control plane. | SH-04 | Partial (Cloud API pairing implemented; group-agent UX is planned) |
| StR-010 | Free-plan limits shall pause excess capacity rather than delete user data. | SH-01, SH-08 | Specified (limits locked; pause-not-delete is the product rule) |
| StR-011 | Clinical integrations, if any, shall not write to a patient record in this baseline. | SH-08 | Implemented as absence of a write path; no RME adapter ships in this repo |
| StR-012 | Vulnerabilities shall be reported privately, not via public issues. | SH-06 | Implemented (`SECURITY.md`) |
| StR-013 | Optional analytics shall not be required to run the product. | SH-01, SH-08 | Implemented (`PUBLIC_POSTHOG_*` optional) |
| StR-014 | Indonesian locale shall be the default for deployment phone-channel copy. | SH-04 | Implemented (`PHONE_LOCALE=id`) |
| StR-015 | Role templates shall be available for professional domains including healthcare and Indonesian public sector. | SH-01 | Implemented (66 packages) |

## 3. Stakeholder constraints

| ID | Constraint |
| --- | --- |
| StC-001 | Public git must not contain secrets or production identifiers. |
| StC-002 | Legal drafts in `docs/legal/` must not be treated as in-force customer contracts until counsel review. |
| StC-003 | Marketing must not promise token counts; Managed AI is fair-use. |
| StC-004 | Testimonials and unshipped consumer bot names must not be presented as product facts. |
