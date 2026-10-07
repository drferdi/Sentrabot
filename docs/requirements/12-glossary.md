# Glossary

**Document ID:** SENTRA-BOT-GLO-001  
**Version:** 1.0  
**Effective date:** 2026-09-03

| Term | Definition |
| --- | --- |
| **Sentra Bot** | The product in this repository: persistent-agent runtime and clients. |
| **Sentra Artificial Intelligence** | Programme / ecosystem brand (sentrahai.com). |
| **PT Adianda Putri Iskandar** | Legal entity. |
| **Owner** | First registered user; controls deployment settings, trusted host, updater. |
| **Workspace** | Prisma `Organization`; tenancy boundary for bots, threads, secrets. |
| **Bot** | Persistent agent with memory, computer mode, routines, and a thread. |
| **Group** | Shared thread across multiple bots. |
| **Run** | One execution attempt of the agent runtime, with fenced lease. |
| **Ask** | Human approval stop (`waiting_input`) for a gated tool. |
| **Computer / sandbox** | Execution surface implementing `SandboxProvider`. |
| **Team computer** | Shared machine; bots have folders, not security isolation from each other. |
| **Private computer** | Computer whose workspace is that bot’s home. |
| **DATA_DIR** | Durable file root owned by the deployment. |
| **Pi runtime** | Production agent runtime (`AGENT_RUNTIME=pi`). |
| **Scripted runtime** | Test-only agent runtime. |
| **Graphile** | Postgres job queue used in the product path. |
| **oRPC** | Typed RPC layer (`/rpc/*`). |
| **seq** | Monotonic event cursor per thread. |
| **BYOK** | Bring your own model key; calls do not use Sentra’s managed key. |
| **Managed AI** | Deployment-provided model access under fair-use / budget routing. |
| **Capability** | Installed skill, plugin, MCP, or API source. |
| **External effect** | Durable record of a consequential tool intent/result. |
| **Fence** | Monotonic lease generation preventing stale workers from committing. |
| **Hybrid control plane** | Experimental device/runtime/E2EE relay work; frozen, off by default. |
| **Rakazo** | Upstream Apache-2.0 project; provenance retained in `NOTICE`. |
| **`@sentrabot/*`** | Canonical package namespace in this repository. |
| **RME** | Rekam medis elektronik (EMR). Not implemented as an adapter here. |
| **Pause not delete** | Entitlement rule when plan limits are exceeded. |
