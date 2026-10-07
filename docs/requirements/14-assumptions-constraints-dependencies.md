# Assumptions, constraints, and dependencies

**Document ID:** SENTRA-BOT-ACD-001  
**Version:** 1.0  
**Effective date:** 2026-09-03

## 1. Assumptions

| ID | Assumption | If false |
| --- | --- | --- |
| A-01 | Operators can run Docker or a supported sandbox provider. | Computer features degrade; `SANDBOX_PROVIDER=none` / `fake`. |
| A-02 | A model endpoint (local or remote) will be connected before expecting answers. | UI and API still run; bots cannot usefully reply. |
| A-03 | PostgreSQL 16 is available (Compose or hosted). | Product does not run. |
| A-04 | The public repository remains Apache-2.0 and secret-free. | Release process stops. |
| A-05 | Indonesian is the default locale for phone-channel *system* copy, not a hard constraint on agent language. | Set `PHONE_LOCALE`. |
| A-06 | Counsel will review legal drafts before they are treated as contracts. | Keep draft banners. |
| A-07 | Hybrid control plane is not required for v0.1 operator success. | Do not enable the relay in production. |

## 2. Constraints

| ID | Constraint |
| --- | --- |
| C-01 | Public git: no secrets, `.env`, private URLs, personal/customer or production data. |
| C-02 | No hosted vendor required for core. |
| C-03 | Node/pnpm/engine versions in root `package.json`. |
| C-04 | Prisma migrations use `DIRECT_URL`, not a pooled connection. |
| C-05 | Tests default offline; live keys are canary-only. |
| C-06 | Clinical write is forbidden in this baseline. |
| C-07 | Customer copy must not promise token counts. |
| C-08 | `apps/site` is a standalone-ish Vite app (`name: cora`) deployed with npm on Vercel; it is not the API. |
| C-09 | Package namespace is `@sentrabot/*`. Historical `@rakazo/*` does not exist in this capsule. |

## 3. Dependencies

| ID | Dependency | Type | Required to boot core? |
| --- | --- | --- | --- |
| D-01 | PostgreSQL 16 | Data | Yes |
| D-02 | Node.js 22+ and pnpm 9.15 | Build | Yes (source path) |
| D-03 | Docker Engine + Compose | Computers / images path | For Docker computers and published-image install |
| D-04 | Pi agent runtime | Execution | Yes for product path |
| D-05 | Graphile Worker | Jobs | Yes for product path |
| D-06 | Better Auth | Identity | Yes |
| D-07 | OpenRouter / Anthropic / other models | Optional | No |
| D-08 | E2B / Daytona / Box | Optional computers | No |
| D-09 | Composio / Pipedream | Optional integrations | No |
| D-10 | WhatsApp Cloud API / SendBlue | Optional phone | No |
| D-11 | Xendit | Optional billing | No |
| D-12 | Supermemory | Optional memory | No |
| D-13 | Expo / EAS / app stores | Mobile distribution | No for self-host web |
| D-14 | Rakazo upstream (license) | Legal provenance | Attribution only |

## 4. Environment variables (normative pointer)

The authoritative list is `.env.example`. Requirements shall not duplicate every key. Material groups: database, auth, encryption, `DATA_DIR`, sandbox, runtime/jobs, model, optional providers, phone, observability, image tags.
