# Requirements and delivery risk register

**Document ID:** SENTRA-BOT-RSK-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Method:** qualitative likelihood × impact (Low / Medium / High)

| ID | Risk | L | I | Mitigation | Status |
| --- | --- | --- | --- | --- | --- |
| R-01 | Secrets committed to the public repository | L | H | gitignore, review rule in AGENTS.md, no force-add | Open (process) |
| R-02 | Sandbox escape or Docker socket exposure | M | H | Supervisor owns socket; production hardening docs | Open |
| R-03 | Trusted host (`this-mac`) treated as isolated | M | H | Owner-only, ASK on host tools, architecture warnings | Open |
| R-04 | Optional vendor outage (model, E2B, WhatsApp) | H | M | Core runs without those keys; degrade honestly | Open |
| R-05 | Overstated clinical / RME claims | M | H | SRS FR-NX-002; README doctrine without shipped-adapter claim | Mitigated in this baseline |
| R-06 | Legal drafts published as binding terms | M | H | Draft banners in `docs/legal/*`; counsel review required | Open |
| R-07 | Two control planes (API vs hybrid relay) | M | M | Relay off by default; frozen until golden path passes | Mitigated |
| R-08 | `outbox_events` unbounded growth | L | L | Documented debt; local-only until hybrid resumes | Open |
| R-09 | Plan limits specified but UX pause states incomplete | M | M | `freePlanLimits` in code; client pause UX to verify when billing ships | Open |
| R-10 | Marketing catalog vs 66 role templates mismatch | M | M | Vision doc states shipped catalog; legal about-doc flags it | Open |
| R-11 | Supply-chain install from live component registries | L | H | AGENTS.md forbids `shadcn add` from live registry | Open (process) |
| R-12 | PHI pasted into threads and sent to a model provider | H | H | Policy + BYOK warning; cannot prevent operator paste | Open |
| R-13 | WhatsApp 24h template window drops routine notifies | M | M | Documented `WHATSAPP_TEMPLATE_*`; still lands in web thread | Mitigated |
| R-14 | Arm64 hosts pulling amd64-only `edge` computer image | M | M | self-host.md tag guidance | Open |
| R-15 | Maintainer contact still pointing at upstream Rakazo personal mail | H | L | Removed `elie@sentrabot.com` from project files in this baseline | Mitigated |

Likelihood and impact are engineering judgements, not a quantitative risk model.
