# Product requirements document

**Document ID:** SENTRA-BOT-PRD-001  
**Version:** 1.0  
**Effective date:** 2026-09-03  
**Audience:** Product, design, engineering  
**Companion:** SRS-001 (normative functional), `docs/product/paket-free-batas-v1.md` (locked commercial numbers)

## 1. Summary

Sentra Bot is a self-hostable persistent-agent product. The operator installs it, creates bots from role templates, connects a model, and works in a thread. The bot may use a computer, memory, routines, and integrations. Irreversible actions stop for an Allow / Deny card.

Indonesia is the primary market language and WhatsApp is a first-class *optional* channel. The control plane remains the Sentra Bot clients (web, desktop, mobile).

## 2. Goals

| Priority | Goal |
| --- | --- |
| P0 | Operator-owned runtime with durable state and explicit authority |
| P0 | Web + API + worker + Docker computer path works without cloud vendors |
| P0 | Same contracts on desktop and mobile |
| P1 | WhatsApp pairing, voice notes, Indonesian phone copy |
| P1 | Plan limits that pause rather than delete |
| P2 | Hybrid multi-device E2EE control plane (frozen experimental) |
| P2 | Broader Indonesian consumer bot names on the marketing site (not in this catalog) |

## 3. Personas and jobs-to-be-done

| Persona | Job |
| --- | --- |
| Solo operator | “Install, sign up, talk to one bot, see it use a computer.” |
| UMKM owner | “Message the bot on WhatsApp; approve anything that sends or pays.” |
| Team lead | “Several role bots on a Team computer, shared browser, distinct screens when the provider allows.” |
| Deployment owner | “Lock signups, pick Docker vs this Mac, apply an update, restore a backup.” |

## 4. Product capabilities (user-visible)

1. **Bots** — named teammates with model, memory, computer mode, skills, routines.
2. **Thread** — primary work surface; groups for multi-bot coordination.
3. **Ask cards** — Allow / Always / Deny for gated tools.
4. **Computer pane** — live desktop, takeover, files.
5. **Routines** — scheduled or webhook-triggered work; notify when configured.
6. **Memory** — editable documents; optional semantic provider.
7. **Integrations** — managed catalogs plus user-installed MCP/OpenAPI.
8. **Voice** — speak replies, dictation, calls when a voice provider is connected.
9. **Phone** — pair WhatsApp; iMessage channel membership where configured.
10. **Settings** — models, voice, plugins, MCP, approval rules, account, memory, phone.
11. **Brief** — product narrative of twice-daily summary (keep copy consistent; do not over-claim automation that is not scheduled as a built-in system routine unless verified in UI).

## 5. Commercial packaging

Locked by Chief on 2026-09-01. Do not change numbers here; change `docs/product/paket-free-batas-v1.md` first.

| Plan | Active bots |
| --- | --- |
| Free | 3 |
| Plus | 10 |
| Pro | 30 |
| Business | 100 |

Free quotas (summary): 10 web searches/day, 5 uploads/day, 250 MB active storage, 30-day active memory window, 3 active schedules, 20 agent actions/month, 1 connected integration, 15 voice minutes/month, 3 computer-agent sessions/month. Managed AI is included on fair-use. BYOK is allowed. Downgrade pauses excess; it does not delete.

Internal COGS targets are **not** customer-facing. Public Mintlify pages must not print them.

Billing provider in code is Xendit-oriented (`Subscription.provider` default `xendit`). Treat live payment operations as **Partial** until a production billing runbook is published.

## 6. UX principles

From `AGENTS.md`:

- Minimal copy. No explainer text that repeats the interface.
- Progressive disclosure of advanced capability.
- Concise accessible names on controls.
- Beautiful UI primitives in `apps/web/src/components/beautiful-ui/` before inventing new ones.

## 7. Internationalisation

- Engineering and requirements: English.
- Default phone-channel system copy: Indonesian (`PHONE_LOCALE=id`).
- Agent replies: follow the user's language.
- Public docs and marketing: Indonesian (`apps/docs`, `apps/site`).

## 8. Release channels

| Channel | Notes |
| --- | --- |
| Git `main` | Source of truth; CI on PR and push |
| GHCR `edge` | Published images, amd64-oriented; see self-host.md |
| Desktop | Electron; GitHub release workflow |
| Mobile | Private EAS/store config; not in git |
| Marketing | `apps/site` on Vercel (standalone npm package `cora`) |

## 9. Open product issues (do not hide)

1. Legal drafts are not counsel-reviewed.
2. Hybrid E2EE multi-device sync is experimental and incomplete (`outbox_events` undrained).
3. Marketing “nine Indonesia consumer bots” are not this repo’s template catalog.
4. Clinical RME adapter is not in this repository.
