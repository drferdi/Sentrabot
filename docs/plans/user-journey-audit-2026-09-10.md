# Sentrabot — Audit Produk & Rancangan User Journey End-to-End

Tanggal: 2026-09-10 · Status: audit **+ implementasi Fase A** (branch `feat/auth-foundation`). **As-built auth** (SMTP, verification, reset, rate limits) is maintained in [`docs/architecture.md`](../architecture.md#authentication-and-sessions); this file keeps the audit narrative and gap analysis.
Metode: pembacaan langsung codebase. Setiap klaim disertai `file:line`. Yang tidak terbukti ditandai **NOT VERIFIED**.

§1–§10 adalah audit terhadap kondisi **sebelum** implementasi. **§11 mencatat apa yang sudah dibangun** — baca itu lebih dulu bila Anda hanya butuh status terkini.

---

## 1. Sentrabot Current Architecture

### 1.1 Tech stack

| Lapisan | Teknologi | Bukti |
|---|---|---|
| Monorepo | pnpm 9.15 + Turborepo, Biome, Vitest | `package.json`, `turbo.json`, `biome.json` |
| API | Hono + oRPC (`@orpc/server`), TypeScript ESM | `apps/api/src/app.ts`, `apps/api/src/authed.ts:1` |
| Web | React + Vite + React Router + Lingui (default **id**) | `apps/web/src/App.tsx`, `apps/web/src/locales/` |
| Site | HTML statis (marketing) | `apps/site/src/html/*.html` |
| Desktop | Electron — host untuk web UI + E2EE sync + runtime lease | `apps/desktop/src/main.ts:211-241`, `e2ee*.ts`, `runtime-lease.ts` |
| Mobile | Expo Router | `apps/mobile/app/*.tsx` |
| Worker | job/routine runner | `apps/worker` |
| DB | PostgreSQL + Prisma (60 model) | `packages/db/prisma/schema.prisma` (39 KB) |
| Auth | **better-auth 1.6.27** self-hosted + Prisma adapter | `packages/auth/src/index.ts`, `packages/auth/package.json:20` |
| Domain packages | `core`, `contracts` (zod), `adapters`, `adapter-kit`, `memory`, `ui-web`, `ui-tokens`, `chat-ui`, `bot-templates`, `testkit` | `packages/` |

Tidak ada vendor auth/BaaS berbayar. Ini konsisten dengan `AGENTS.md`: "No hosted vendor is required to run the core product."

### 1.2 Model tenancy — Organization *adalah* workspace

Tidak ada model `Workspace` terpisah. `Organization` yang memiliki seluruh resource domain:

- `Organization` memiliki `bots`, `threads`, `events`, `tasks`, `runs`, `routines`, `scratchpadItems`, `taughtSkills`, `agentSkills`, `connections`, `capabilities`, `memoryDocuments`, dst. — `schema.prisma:89-136`
- `Member { organizationId, userId, role: String }` — `schema.prisma:305-318`
- `Session { expiresAt, token, ipAddress, userAgent, activeOrganizationId }` — `schema.prisma:40-55`
- `User { emailVerified: Boolean @default(false), ... }` — `schema.prisma:10-38`. **Tidak ada** field `status`, `suspendedAt`, `deletedAt`, maupun consent terms/privacy.

Saat signup, `bootstrapUserWorkspace` membuat: satu Organization bernama `"Personal"` (slug `user-<id12>`), satu `Member` dengan `role: "owner"`, `DeploymentSettings` (id `"default"`), memori user, dan notification preferences — `packages/db/src/bootstrap-user.ts:29-80`. Pengguna pertama yang mendaftar merebut kursi **deployment owner** lewat `updateMany` bersyarat (`bootstrap-user.ts:74-79`). Jalur phone-provisioning memanggil fungsi yang sama dengan `claimDeploymentOwner: false` supaya "a first texter must never become the deployment owner" (`bootstrap-user.ts:24-27`).

### 1.3 Dua sumbu otoritas

`Actor = { userId, workspaceId, email, isDeploymentOwner }` — `packages/contracts/src/ids.ts:6-12`.

1. **Workspace owner** — `requireWorkspaceOwner()` di `apps/api/src/router.ts:2128-2138`. Hanya **1 call site** di `router.ts`: `persistMemoryProviderConfig`. (Pemeriksaan serupa di `apps/api/src/routes/*.ts` belum disisir — **NOT VERIFIED**.)
2. **Deployment owner** — `actor.isDeploymentOwner`, **5 call site** di `router.ts:266,270,301,305,313` (kebijakan signup, server update, pemilihan host computer di `router.ts:2005`).

Isolasi tenant sesungguhnya dilakukan lewat penyempitan query dengan `actor.workspaceId` + `actor.userId` (contoh: `apps/api/src/whatsapp-pairing.ts:28-30`), bukan lewat RBAC. Middleware auth hanya mengecek keberadaan actor (`apps/api/src/authed.ts:11-15`).

### 1.4 Transport sesi per klien

| Klien | Transport | Penyimpanan token | Bukti |
|---|---|---|---|
| Web | Cookie better-auth | cookie jar browser | `apps/web/src/lib/auth.ts:4-6` (hanya plugin `organizationClient`) |
| Desktop | Cookie, di partition Electron terisolasi | cookie store Chromium | `apps/desktop/src/main.ts:211-241,571` |
| Mobile | `Authorization: Bearer <token>` | `expo-secure-store` | `apps/mobile/lib/session.ts:14-16`, `apps/mobile/lib/api.ts:88-89` |

Server mengubah bearer menjadi cookie sintetis sebelum resolusi sesi: `apps/api/src/app.ts:656-661`. Artinya **bearer token mobile adalah nilai mentah session cookie** — satu rahasia, dua transport. Plugin `bearer()` aktif di `packages/auth/src/index.ts`.

### 1.5 Inventaris fitur (status aktual)

| Kapabilitas | Surface | Status | Bukti |
|---|---|---|---|
| Bot/agent + template | web, mobile | ADA | `apps/web/src/pages/Onboarding.tsx`, `apps/mobile/app/new.tsx` |
| Thread / chat | web, mobile | ADA | `App.tsx:83`, `apps/mobile/app/thread.tsx` |
| Group chat | web, mobile | ADA | `App.tsx:79`, `GroupPanel.tsx`, `schema.prisma:470-503` |
| Routine (penjadwalan) | web, mobile | ADA | `RoutineEditor.tsx`, `RoutineSchedule.tsx`, `apps/worker` |
| Computer / sandbox (Docker, E2B, Daytona, Box, desktop) | web, mobile | ADA | `HostComputerPrompt.tsx`, `ComputerStatus`, `schema.prisma:863-911` |
| Connector (Composio) + MCP registry | web | ADA | `McpServersOverlay.tsx`, `PluginsOverlay.tsx`, `onboarding.ts:29-` |
| **WhatsApp** | api + web settings | **ADA** | `apps/api/src/whatsapp-webhook.ts`, `whatsapp-pairing.ts`, `phone-inbound.ts`, `packages/adapters/src/phone-delivery.ts`, `PhoneSettingsOverlay.tsx` |
| Voice (STT/TTS, panggilan) | web, mobile | ADA | `VoiceSettingsOverlay.tsx`, `CallView.tsx`, `apps/mobile/app/voice.tsx` |
| Taught skills / agent skills | web | ADA | `TeachComputerSection.tsx`, `schema.prisma:718-763` |
| Memory (per-bot + provider Supermemory) | web | ADA | `MemorySettingsOverlay.tsx`, `packages/memory` |
| Artifact, search, scratchpad | web | ADA | `schema.prisma:912-933`, `WorkspaceSearch.tsx`, `ScratchpadSection.tsx` |
| Approval / action-approval rules | api + web | ADA | `schema.prisma:275-304` |
| E2EE multi-device sync + runtime lease | desktop | ADA | `apps/desktop/src/e2ee*.ts`, `schema.prisma:1162-1188` |
| Self-host updater | api + web | ADA | `apps/api/src/server-update.ts`, `SoftwareUpdateSection.tsx` |
| Dashboard / overview | — | **TIDAK ADA** | tidak ada route di `App.tsx:60-85` |
| Billing UI | — | **TIDAK ADA** | tidak ada komponen billing di `apps/web/src` |
| Team invite / multi-user workspace | — | **DIBLOKIR SENGAJA** | `packages/auth/src/index.ts` `blockedAuthPaths` + `allowUserToCreateOrganization:false` |

Koreksi penting: spesifikasi `docs/plans/whatsapp-mvp-spec.md:66` menyebut `apps/whatsapp-bridge` yang memang **tidak ada** — tetapi kapabilitasnya sudah diimplementasikan di dalam `apps/api` (webhook bertanda tangan HMAC, pairing code, inbound, delivery, media/voice-note). Jadi WhatsApp = **ADA**, hanya topologinya berbeda dari draf spesifikasi.

### 1.6 Billing & entitlement — dibangun separuh

Yang **ADA**:
- Checkout Xendit: `apps/api/src/billing-routes.ts` → `packages/adapters/src/xendit-checkout.ts`; `beginCheckout` di `packages/db/src/platform.ts:533`.
- Webhook Xendit bertanda tangan + idempoten: `apps/api/src/xendit-webhook.ts`, `PaymentEvent` dedupe.
- **Pembayaran benar-benar mengubah plan**: `applyVerifiedPaymentEvent` (`platform.ts:645-700`) meng-upsert `Subscription` dan `EntitlementState` ke `planCode: "plus"`, state `active_plus` / `grace_period` (+7 hari kalender).
- Model data: `Subscription`, `PaymentEvent`, `UsageReservation`, `UsageLedger`, `EntitlementState` — `schema.prisma:186-264, 1151-1160`.
- Degradasi lunak managed AI: `getManagedAiBudgetRatio` → `routeManagedAi` memilih kelas model lebih murah (`luna`/`terra`/`sol`) — `packages/core/src/platform-policy.ts:70-89`.

Yang **TIDAK ADA** (terbukti):
- `EntitlementState` hanya pernah **ditulis, tidak pernah dibaca**. Grep `entitlementState` di seluruh `apps/`+`packages/` hanya menemukan situs tulis di `platform.ts`.
- `freePlanLimits` (3 bot, 10 pencarian/hari, 1 integrasi, dst.) dan `transitionSubscription` hanya dirujuk oleh **unit test-nya sendiri** — `packages/core/src/platform-policy.test.ts`. **Nol call site produksi.**
- Tidak ada job yang mengeksekusi `grace_elapsed` → downgrade ke `free`.
- `reserveManagedAiUsage` (`platform.ts:186-221`) selalu membuat reservasi; tidak ada pengecekan saldo atau jalur penolakan.
- Tidak ada kode error kuota (402/429) yang bisa dirender UI. Error yang ada di `managed-ai.ts` hanya 401/403/400/502.
- `docs/product/paket-free-batas-v1.md` berstatus **TERKUNCI** dengan 4 tier (Free/Plus/Pro/Business); kode hanya mengenal `"free"` dan `"plus"` (hardcoded di `platform.ts:673-694`).

### 1.7 Temuan paling menentukan: jalur "AI gratis" **ada**, tetapi tidak ditandai dan tidak diukur

Ada **kunci model tingkat deployment**. `resolveDeploymentModel` (`packages/adapters/src/deployment-model.ts:7-25`) mengambil `OPENROUTER_API_KEY` atau `ANTHROPIC_API_KEY` dari env, dengan provider default `openrouter` dan model default `deepseek/deepseek-v4-flash-0731`. Kunci itu mengalir ke `env.deploymentModelKey` (`apps/api/src/env.ts:114`) lalu ke runtime agen: `apps/api/src/router.ts:1993` (`settings?.deploymentModelCredentialCipher || deps.env.deploymentModelKey`), `packages/adapters/src/agent-runtime-composition.ts:124-145`, `executor.ts:365`.

Artinya: pengguna yang menekan **"Skip for now"** di onboarding **tetap mendapat agen yang berfungsi** — asalkan deployment mengonfigurasi kunci bersama. String UI-nya sendiri mengonfirmasi ini: "Skip if this deployment already has credentials." (`pi-models.ts:108`).

Tiga masalah nyata, bukan ketiadaan:

1. **Tidak ditandai.** Onboarding tetap membuka dengan layar "Connect a model" berisi katalog yang seluruhnya BYOK (`"Uses your <name> API key. Sentra Bot does not pay for model usage."` — `pi-models.ts:112-115`). Jalur gratis hanya tersembunyi di balik tautan abu-abu "Skip for now" (`Onboarding.tsx:554-562`). Pengguna baru membaca layar itu sebagai dinding, bukan pilihan.
2. **Tidak diukur.** Jalur kunci deployment **tidak melewati** `reserveManagedAiUsage`. Metering hanya ada di endpoint terpisah `POST /v1/managed-ai/responses` (`apps/api/src/managed-ai.ts:51`), yang aktif hanya bila `env.openaiApiKey && env.managedAiFreeBudgetMicros` (`app.ts:370`) dan diautentikasi sebagai **trusted runtime** (403 "Untrusted runtime") — bukan sesi pengguna web. Jadi pemakaian AI gratis lewat web tidak masuk `UsageReservation` maupun `UsageLedger` sama sekali.
3. **Tidak dibatasi.** Karena tidak diukur, `freePlanLimits` dan `getManagedAiBudgetRatio` tidak menyentuh jalur ini. Anggaran deployment bisa habis diserap satu pengguna.

Konsekuensi bagi paket Free Rp0 di `paket-free-batas-v1.md`: janjinya secara teknis dapat dipenuhi hari ini, tetapi tanpa metering ia tidak dapat dikendalikan biayanya. Pekerjaannya adalah **menandai dan mengukur jalur yang sudah ada**, bukan membangun jalur baru.

---

## 2. Existing User Flow

```
apps/site (statis, Bahasa Indonesia)
  Header "Masuk" / Hero "Mulai" / semua CTA Pricing  →  href="/workspace"
        ↓ (navigasi lintas-aplikasi; /workspace disajikan apps/web)
apps/web  "/"  →  WelcomePage (hanya untuk yang belum login)   [App.tsx:60]
        ↓
"/sign-up"  →  AuthPage: hanya email + password               [pages/Auth.tsx]
        ↓  (better-auth signUp.email → hook signup policy → bootstrapUserWorkspace)
"/onboarding"                                                  [App.tsx:67]
   step "model" : pilih provider + tempel API key  |  "Skip for now"  [Onboarding.tsx:76,554-562]
   step "bot"   : pilih template bot → createBot
        ↓  navigate(`/app/${bot.id}`)                          [Onboarding.tsx:263]
"/app/:botId"  →  ShellPage
   + onboarding percakapan yang di-seed server ke thread:
     salam → pilihan fokus A/B/C/D → kartu Composio untuk diotorisasi inline
     ("No model tokens are spent")                             [api/src/onboarding.ts:10-14,29-60]
        ↓
Semua fitur lain via sidebar + overlay: routine, computer, MCP, plugin,
memory, voice, phone/WhatsApp, scratchpad, search, akun.
```

Klarifikasi ambiguitas: `Onboarding.tsx` (wizard web) dan `api/src/onboarding.ts` (percakapan ter-seed) **bukan** dua jalur duplikat — keduanya berurutan. Wizard menyiapkan model + bot; percakapan menyambut di dalam thread bot yang baru dibuat.

Onboarding mobile: tidak ditemukan route bernama onboarding di `apps/mobile/app/` — mobile tampaknya mengasumsikan akun sudah disiapkan lewat web. **NOT VERIFIED** apakah ini disengaja.

---

## 3. Problems / Gaps

### 3.1 Authentication (paling kritis)

| Kapabilitas | Status | Bukti |
|---|---|---|
| Email + password | ADA | `packages/auth/src/index.ts` `emailAndPassword.enabled` |
| Kebijakan signup (tutup / allowlist) | ADA | hook `before` + `resolveSignupPolicy` |
| Hapus akun + cascade | ADA | `deleteUser.beforeDelete` |
| **Verifikasi email** | **TIDAK ADA** | tidak ada blok `emailVerification`; `emailVerified` default `false` dan tak ada kode yang membaliknya |
| **Reset password / lupa password** | **TIDAK ADA** | tidak ada `sendResetPassword`; tidak ada tautan "lupa" di `pages/Auth.tsx` |
| **Infrastruktur email sama sekali** | **TIDAK ADA** | `SMTP_URL` hanya muncul di `README.md:507` dan `.env.example:101`; nol referensi di source |
| OAuth login pengguna (Google dll.) | TIDAK ADA | tidak ada `socialProviders` |
| MFA / 2FA | TIDAK ADA | tidak ada plugin twoFactor |
| Daftar sesi aktif / "logout semua perangkat" | TIDAK ADA (UI) | tidak ada surface di `AccountSettingsOverlay.tsx` |
| Rate limiting tingkat aplikasi | SEBAGIAN (**terverifikasi**, lihat §3.4) | nol konfigurasi eksplisit dan nol middleware untuk route non-auth di `apps/api/src`; namun better-auth 1.6.27 **sudah** melindungi `/api/auth/*` di produksi secara bawaan |
| Penangguhan / suspend akun | TIDAK ADA | tidak ada field status di `User` |
| Consent terms/privacy | TIDAK ADA | tidak ada field maupun checkbox di `Auth.tsx` |
| Konfigurasi atribut cookie eksplisit | NOT VERIFIED | tidak ditemukan override `secure/sameSite/crossSubDomain` |

Catatan penting: verifikasi email dan reset password **tidak bisa dikerjakan** sebelum ada penyedia email. Itu prasyarat, bukan detail.

### 3.2 Keamanan transport

- `isTrustedOrigin` (`app.ts:641-651`, dibaca langsung) menerima: origin kosong (`if (!origin) return true`), **setiap** string berawalan `sentrabot://`, **setiap** `exp://`, dan **setiap** hostname `localhost`/`127.0.0.1` di port mana pun — dipasangkan dengan `credentials: true` di `app.ts:333-339`. **Tidak ada penjagaan `NODE_ENV`/produksi** pada cabang mana pun. Untuk deployment self-host di mesin bersama, ini permukaan yang lebar. **RISIKO R3.**
- Bearer mobile = nilai session cookie mentah (`app.ts:656-661` mengubahnya kembali menjadi cookie sintetis). Tidak ada refresh/rotasi eksplisit di klien; bergantung pada sliding expiry better-auth (**NOT VERIFIED**). Jika bocor, pencabutan hanya lewat penghapusan baris sesi di DB — dan tidak ada UI untuk itu.
- Tanpa rate limiting aplikasi, `/v1/managed-ai/responses` dan seluruh route non-better-auth tidak terlindungi sama sekali. Endpoint auth terlindungi oleh default pustaka — lihat §3.4.

### 3.4 Rate limiting — apa yang sebenarnya terjadi (terverifikasi dari sumber pustaka)

Dibaca langsung dari better-auth 1.6.27 yang terpasang di `node_modules`:

- `dist/context/create-context.mjs:169-175` — `enabled: options.rateLimit?.enabled ?? isProduction`. Jadi rate limiting **aktif secara bawaan di produksi**; window 10 detik, max 100, penyimpanan memori.
- `dist/api/rate-limiter/index.mjs:370-384` — aturan khusus bawaan sudah lebih ketat pada jalur sensitif: `/sign-in`, `/sign-up`, `/change-password`, `/change-email` → **3 per 10 detik**; `/request-password-reset`, `/send-verification-email`, `/forget-password` → **3 per 60 detik**.

Artinya brute force kredensial **sudah** tertahan di produksi, dan jalur reset password yang akan dibangun di A3 juga otomatis tercakup. Dua celah yang tersisa dan nyata:

1. Perlindungan itu bergantung pada deteksi `isProduction` milik pustaka. Repositori ini sudah pernah terkena kelas bug yang sama — commit 13fba6e "pin NODE_ENV=production so a developer .env cannot demote the stack". Konfigurasi eksplisit menghilangkan ketergantungan itu.
2. `POST /v1/managed-ai/responses` adalah route Hono biasa, **bukan** route better-auth, jadi tidak satu pun aturan di atas menyentuhnya — padahal ia membelanjakan uang sungguhan setiap panggilan.

### 3.3 Produk & UX

1. **Dinding API key semu di langkah pertama.** Onboarding membuka dengan "Connect a model" dan katalog yang seluruhnya BYOK. Jalur gratis sebenarnya berfungsi (kunci deployment bersama, §1.7) tetapi hanya tersembunyi di balik tautan "Skip for now". Pengguna baru membacanya sebagai dinding. Ini pembunuh aktivasi nomor satu — dan ongkos perbaikannya kecil karena mesinnya sudah ada.
2. **Tidak ada dashboard.** Setelah onboarding user langsung mendarat di satu thread bot (`/app/:botId`). Lima pertanyaan orientasi (status sistem, apakah bekerja, aktivitas terbaru, masalah, langkah berikutnya) tidak terjawab di mana pun.
3. **Kekayaan fitur tak terlihat.** Routine, computer, WhatsApp, voice, memory, MCP, skills semuanya hidup di dalam overlay sidebar tanpa jalur penemuan progresif.
4. **Loncatan situs → aplikasi.** CTA `apps/site` menuju `/workspace`, navigasi halaman penuh ke SPA terpisah, lalu masih ada `WelcomePage` sebelum form daftar. Minimal satu langkah berlebih.
5. **Layanan berbayar tak terlihat sama sekali.** Tidak ada UI billing, tidak ada indikator kuota, tidak ada penegakan batas. Dokumen paket terkunci tetapi produk belum bisa memonetisasi maupun memberi sinyal batas.
6. **Error sesi digeneralisasi.** `App.tsx:97-141` menampilkan layar "tidak bisa menjangkau server" yang sama untuk kegagalan jaringan maupun auth.
7. **WhatsApp — aset terbesar yang tersembunyi.** Pairing code sudah lengkap dan aman (TTL 15 menit, sekali pakai, alfabet tanpa karakter ambigu, kode lama diinvalidasi — `whatsapp-pairing.ts:6-45`), tetapi hanya bisa ditemukan lewat overlay pengaturan telepon.

---

## 4. Proposed End-to-End User Flow

```
Visitor (apps/site, Bahasa Indonesia)
   ↓  CTA tunggal "Coba gratis"  →  /sign-up  (lewati WelcomePage untuk visitor dengan intent)
Register  ·  email + password  ·  checkbox consent  ·  syarat kata sandi terlihat
   ↓
[Kirim email verifikasi — tidak memblokir]   ← butuh penyedia email
   ↓
Onboarding (3 langkah, ≤ 90 detik)
   1. "Apa yang ingin Anda serahkan?"  → pilihan fokus A/B/C/D  (pindahkan ke depan dari onboarding.ts)
   2. Model:  [Pakai AI Sentra — gratis]  (default bila deployment punya kunci;
              jika tidak, jelaskan sebabnya dengan jujur)
              |  [Pakai kunci saya sendiri]  (lanjutan)
   3. Bot pertama dibuat otomatis dari fokus + template
   ↓
★ FIRST VALUE MOMENT  —  balasan berguna pertama di thread
   ↓
Prompt aktivasi #1:  "Hubungkan WhatsApp"  →  kode pairing  →  agen membalas di WhatsApp Anda
   ↓
Home / Overview  (route baru)  — status, aktivitas terbaru, hal yang perlu perhatian, langkah berikutnya
   ↓
Fitur inti:  thread · routine · connector · memory
   ↓
Lanjutan:  computer/sandbox · taught skills · MCP · voice · group chat · E2EE multi-perangkat
```

### First Value Moment — rekomendasi

**FVM utama: balasan berguna pertama dari agen di dalam thread onboarding, di bawah 2 menit, tanpa API key.**

Alasannya: itu satu-satunya momen yang mungkin dicapai setiap pengguna di setiap surface, dan seluruh mesin di belakangnya **sudah berjalan hari ini** — kunci deployment bersama sudah mengalir ke runtime agen (§1.7). Yang kurang bukan kapabilitas, melainkan penandaan (jalur gratis tersembunyi di balik "Skip for now") dan pengukuran (nol metering). Keduanya pekerjaan kecil dibanding membangun kapabilitas baru.

**Momen aktivasi kedua (retensi, bukan aktivasi): agen membalas di nomor WhatsApp pengguna sendiri.** Ini yang dituju `docs/plans/whatsapp-mvp-spec.md:24-38` — "user tidak perlu tahu ada agent, harness, sandbox, atau approval broker." Implementasinya sudah ada. Tetapi ia tidak layak jadi FVM *pertama* karena bergantung pada nomor WhatsApp Business tingkat deployment (`WHATSAPP_ACCESS_TOKEN` adalah env deployment, bukan per pengguna) — jadi ia hidup di deployment terkelola, tidak otomatis di setiap self-host.

---

## 5. Authentication Architecture

**Rekomendasi: pertahankan better-auth. Jangan ganti.** Ia sudah memenuhi seluruh prioritas — self-hosted (tidak melanggar aturan "no hosted vendor"), sudah terintegrasi dengan Prisma, plugin organization sudah dipakai, dan sudah berjalan di tiga surface. Clerk/Supabase/Firebase gugur karena aturan repositori; NextAuth gugur karena tidak ada Next.js. Yang dibutuhkan adalah **melengkapi konfigurasi**, bukan mengganti fondasi.

Yang harus ditambahkan, terurut menurut ketergantungan:

1. **Penyedia email** (prasyarat segalanya). Antarmuka netral-vendor `EmailSender` di `packages/adapter-kit`, adapter SMTP di `packages/adapters` yang membaca `SMTP_URL` yang sudah ada di `.env.example`. Tanpa penyedia terkonfigurasi, sistem harus mendegradasi secara jujur, bukan gagal senyap.
2. **Verifikasi email** — `emailVerification: { sendVerificationEmail, autoSignInAfterVerification: true }`. **Jangan** aktifkan `requireEmailVerification` di awal: memblokir login sebelum verifikasi akan menghancurkan aktivasi. Batasi saja tindakan berisiko (checkout, pairing WhatsApp, tambah connector) sampai terverifikasi.
3. **Reset password** — `sendResetPassword` + halaman `/reset-password`; tautan "Lupa kata sandi?" di `Auth.tsx`. TTL token 1 jam, sekali pakai.
4. **Rate limiting** — aktifkan `rateLimit` better-auth secara eksplisit (jangan bergantung pada default yang belum terverifikasi), plus limiter berbasis IP di `/api/auth/sign-in`, `/sign-up`, dan `/v1/managed-ai/responses`.
5. **Perketat `isTrustedOrigin`** — batasi `sentrabot://` ke host aplikasi yang diketahui, `exp://` hanya saat dev, `localhost` hanya saat dev. **R3, butuh verifier independen.**
6. **Manajemen sesi** — daftar sesi aktif (`ipAddress`/`userAgent` sudah tersimpan di `schema.prisma:46-47`) + "keluar dari semua perangkat" di `AccountSettingsOverlay.tsx`.
7. **Consent** — tambah `termsAcceptedAt` di `User` + checkbox di form daftar; `docs/legal` sudah ada.
8. **Kunci akun / suspend** — tambah `disabledAt` di `User` dan periksa di resolusi sesi.

**Jangan ditambahkan sekarang:** MFA (belum ada permintaan pengguna, biaya UX tinggi untuk basis pengguna saat ini), Google OAuth (tambahkan setelah verifikasi email jalan — ia mengurangi friksi, tetapi verifikasi email adalah lubang yang lebih besar).

---

## 6. Account / Workspace Model

**Rekomendasi: pertahankan bentuk sekarang. Jangan bangun RBAC.**

Realitas hari ini: satu pengguna = satu Organization "Personal" = satu workspace pemilik-tunggal. Pembuatan organisasi, undangan, perubahan peran, dan penghapusan semuanya diblokir dua kali (path matching + penolakan plugin) di `packages/auth/src/index.ts`. Kolaborasi multi-pengguna sudah punya bentuknya sendiri yang berbeda: **ChatGroup / ChatGroupMember** (`schema.prisma:470-503`) — berbagi lewat percakapan, bukan lewat kursi tim.

Ini keputusan desain yang tepat untuk produk agen personal. RBAC (Owner/Admin/Manager/Member/Viewer) akan menjadi kompleksitas spekulatif — persis yang dilarang `AGENTS.md`. Struktur `Member.role` sudah berupa string yang bisa memuat banyak peran (`router.ts:2135` mem-parse `role.split(",")`), jadi jalur pertumbuhannya tetap terbuka tanpa membangun apa pun sekarang.

Model otoritas yang benar untuk Sentrabot adalah dua sumbu yang sudah ada — **pemilik workspace** (data saya) dan **pemilik deployment** (mesin ini) — ditambah **approval per-tindakan** (`ActionApprovalRule`) sebagai kontrol otoritas sesungguhnya. Itu sejalan dengan doktrin README "the human holds the key".

Buka tim hanya jika muncul permintaan nyata; saat itu yang diperlukan hanyalah membuka `blockedAuthPaths` dan menambahkan pengecekan peran pada mutasi.

---

## 7. Maximum Utilization Journey

| Tahap | Definisi (terukur) | Yang diperkenalkan | Sudah ada? |
|---|---|---|---|
| **New** | terdaftar, bot pertama dibuat | fokus, satu bot, satu thread | ADA |
| **Activated** | menerima balasan berguna pertama | model default, kartu connector | ADA (butuh ditandai + diukur) |
| **Regular** | kembali ≥ 3 hari, ≥ 1 connector | WhatsApp pairing, routine pertama, memory | ADA (tersembunyi) |
| **Power** | routine berjalan tanpa diawasi, computer dipakai | computer/sandbox, taught skills, MCP, group chat, voice, E2EE multi-perangkat | ADA (tersembunyi) |

Perkenalan bertahap harus **dipicu peristiwa, bukan waktu**: tawarkan WhatsApp setelah balasan berguna pertama; tawarkan routine setelah pengguna mengulang permintaan serupa; tawarkan computer setelah agen membentur tugas yang butuh eksekusi; tawarkan taught skills setelah computer terpakai. Semua pemicu ini bisa diturunkan dari tabel `Run`, `Event`, dan `Message` yang sudah ada.

---

## 8. UX Improvements

**P0 — Kritis**

1. **Tandai dan ukur jalur AI gratis yang sudah ada.** *Problem:* onboarding menampilkan katalog BYOK sebagai langkah pertama dan menyembunyikan jalur kunci deployment di balik "Skip for now" (`Onboarding.tsx:76,554-562`, `pi-models.ts:112`); jalur itu sendiri tidak melewati `reserveManagedAiUsage` sehingga nol metering (§1.7). *Impact:* mayoritas pendaftar membaca layar itu sebagai dinding dan tidak pernah mencapai FVM; dan bagi yang lewat, biaya deployment tidak terkendali. *Solution:* jadikan "Pakai AI Sentra — gratis" pilihan default yang eksplisit di onboarding, turunkan BYOK ke "lanjutan", dan alirkan jalur kunci deployment melalui reservasi/ledger yang sudah ada. *Prioritas:* P0.
2. **Penyedia email + verifikasi + reset password.** *Problem:* tidak ada infrastruktur email sama sekali. *Impact:* akun tidak dapat dipulihkan — pengguna yang lupa kata sandi kehilangan seluruh workspace secara permanen; email tak terverifikasi membuka penyalahgunaan. *Solution:* §5 langkah 1-3. *Prioritas:* P0.
3. **Rate limiting.** *Problem:* `/v1/managed-ai/responses` adalah route Hono biasa tanpa perlindungan apa pun, padahal membelanjakan uang tiap panggilan; sementara perlindungan endpoint auth bergantung pada deteksi `isProduction` milik pustaka, bukan konfigurasi eksplisit (§3.4). *Impact:* penyedotan anggaran model deployment; dan hilangnya perlindungan brute force bila `NODE_ENV` salah set. *Solution:* §5 langkah 4. *Prioritas:* P0 untuk route managed-AI, P1 untuk pengeksplisitan konfigurasi auth.
4. **Perketat allowlist CORS.** *Problem:* `isTrustedOrigin` (`app.ts:641-651`) menerima origin kosong, wildcard `sentrabot://`, wildcard `exp://`, dan semua port localhost — tanpa penjagaan `NODE_ENV`, dengan `credentials:true`. *Impact:* permukaan pencurian sesi pada host bersama. *Solution:* §5 langkah 5 + verifikasi independen. *Prioritas:* P0.

**P1 — Tinggi**

5. **Prompt WhatsApp pasca-FVM.** *Problem:* fitur pembeda terkuat terkubur di overlay pengaturan. *Impact:* aktivasi dan retensi hilang. *Solution:* kartu "Hubungkan WhatsApp" di thread setelah balasan berguna pertama, menggunakan `beginWhatsAppPairing` yang sudah ada. *Prioritas:* P1.
6. **Route Home / Overview.** *Problem:* tidak ada layar orientasi. *Impact:* pengguna tak bisa menjawab "apakah Sentrabot saya bekerja?". *Solution:* route `/app` baru: status runtime/computer, run terbaru, approval tertunda, routine berikutnya, satu tindakan yang disarankan. Semua data sudah tersedia. *Prioritas:* P1.
7. **Penegakan entitlement + sinyal kuota.** *Problem:* `EntitlementState` ditulis tapi tak pernah dibaca; `freePlanLimits` nol call site produksi. *Impact:* paket berbayar tidak berarti apa-apa; tidak ada jalur upgrade. *Solution:* pembacaan entitlement terpusat + kode error kuota + indikator penggunaan. *Prioritas:* P1.
8. **Pemulihan sesi yang membedakan penyebab.** *Problem:* `App.tsx:97-141` menyamakan gagal jaringan dan gagal auth. *Impact:* sesi kedaluwarsa tampak seperti server mati. *Solution:* pisahkan 401 dari kegagalan transport; 401 → arahkan ke sign-in. *Prioritas:* P1.

**P2 — Sedang**

9. Tautan "Lupa kata sandi?" + syarat kata sandi terlihat + penanganan email duplikat yang ramah di `Auth.tsx`.
10. Perpendek situs → daftar: CTA langsung ke `/sign-up`, sisakan `WelcomePage` untuk pengunjung tanpa intent.
11. Daftar sesi aktif + "keluar dari semua perangkat".
12. Job kedaluwarsa masa tenggang (`grace_elapsed` → `free`).
13. Empty state per-fitur untuk overlay (routine, computer, MCP, memory) — saat ini hanya ada skeleton tingkat shell (`App.tsx:143-172`).

**P3 — Nice to have**

14. Google OAuth (setelah verifikasi email).
15. Consent terms/privacy tersimpan.
16. Onboarding mobile (saat ini mengasumsikan setup lewat web).
17. Suspend akun.
18. Tier Pro/Business (kode hanya mengenal free/plus).

---

## 9. Implementation Roadmap

> **Status per 2026-09-10, branch `feat/auth-foundation`:** Fase A **selesai** (A1–A5), Fase B sebagian (**B3 selesai**, B1/B1b belum). Seluruh suite hijau: 260 file / 2114 test, `tsc` bersih di `apps/api`, `packages/auth`, `packages/adapters`, `packages/core`, `biome check` bersih di 785 file. Detail di §11.

### Fase A — Fondasi (auth & keamanan)

**A1. Antarmuka penyedia email + adapter SMTP**
- Objective: satu antarmuka `EmailSender` netral-vendor + adapter SMTP; degradasi jujur jika tak dikonfigurasi.
- Files: `packages/adapter-kit/src/email.ts` (baru), `packages/adapters/src/smtp-email.ts` (baru), `apps/api/src/env.ts`, `apps/api/src/app.ts`.
- Dependencies: tidak ada. **Ini prasyarat A2 dan A3.**
- Risk: R1.
- Acceptance: `EmailSender` terkirim lewat SMTP di test; tanpa `SMTP_URL`, API tetap boot dan verifikasi/reset menampilkan pesan "belum tersedia" yang eksplisit.
- Testing: unit deterministik dengan transport palsu, offline.

**A2. Verifikasi email (non-blocking)**
- Objective: kirim email verifikasi saat daftar; `emailVerified` berbalik saat token dipakai; login tidak diblokir.
- Files: `packages/auth/src/index.ts`, `apps/web/src/pages/Auth.tsx`, halaman verifikasi baru.
- Dependencies: A1.
- Risk: R2 → `verifier-sonnet`.
- Acceptance: token sekali pakai, TTL wajar; `requireEmailVerification` tetap mati; tindakan berisiko (checkout, pairing, connector) menolak akun tak terverifikasi.

**A3. Reset password**
- Objective: alur lupa kata sandi ujung ke ujung.
- Files: `packages/auth/src/index.ts`, `apps/web/src/pages/Auth.tsx`, halaman `/reset-password`.
- Dependencies: A1.
- Risk: R3 → `verifier-opus`.
- Acceptance: token sekali pakai TTL 1 jam; token kedaluwarsa/terpakai ditolak; seluruh sesi dicabut setelah kata sandi berubah; respons seragam untuk email tak terdaftar (anti-enumerasi).

**A4. Rate limiting**
- Objective: batasi sign-in, sign-up, reset, dan `/v1/managed-ai/responses`.
- Files: `packages/auth/src/index.ts` (`rateLimit` eksplisit), `apps/api/src/app.ts`.
- Dependencies: tidak ada.
- Risk: R2 → `verifier-sonnet`.
- Acceptance: percobaan ke-N+1 mengembalikan 429; jalur sah tak terpengaruh.

**A5. Perketat trusted origins**
- Objective: hilangkan wildcard `sentrabot://` / `exp://` / semua-port-localhost di produksi.
- Files: `apps/api/src/app.ts:646-655`, `apps/api/src/env.ts`.
- Dependencies: tidak ada.
- Risk: **R3 → `verifier-opus`.** Blast radius tinggi: salah konfigurasi memutus desktop dan mobile sekaligus.
- Acceptance: origin dev diterima hanya saat `NODE_ENV !== production`; test topologi desktop + mobile tetap lulus.

### Fase B — Onboarding

**B1. Metering jalur kunci deployment** — objective: pemakaian model lewat `env.deploymentModelKey` tercatat di `UsageReservation`/`UsageLedger` dan tunduk pada anggaran, sama seperti endpoint managed AI. Files: `apps/api/src/router.ts:1993`, `packages/adapters/src/agent-runtime-composition.ts`, `packages/db/src/platform.ts`, `packages/core/src/platform-policy.ts`. Dependencies: A4 (rate limiting wajib lebih dulu — jalur ini membelanjakan uang deployment). Risk: **R3 → `verifier-opus`** (biaya + kuota + jalur eksekusi agen inti). Acceptance: run yang memakai kunci deployment membuat reservasi dan difinalisasi; melewati anggaran mendegradasi kelas model lalu menolak dengan kode error yang bisa dirender UI; run yang memakai kredensial pengguna sendiri **tidak** terpengaruh.

**B1b. Tandai jalur gratis di onboarding** — objective: "Pakai AI Sentra — gratis" menjadi pilihan default yang terlihat; BYOK turun ke "lanjutan". Files: `apps/web/src/pages/Onboarding.tsx`, `packages/adapters/src/pi-models.ts`. Dependencies: B1. Risk: R2. **Frontend → `frontend-fable`.** Acceptance: bila deployment punya kunci, pengguna baru mencapai balasan pertama tanpa pernah melihat form API key; bila tidak punya, onboarding menjelaskan sebabnya dengan jujur alih-alih menawarkan pilihan yang tidak berfungsi.

**B2. Onboarding 3 langkah** — pindahkan pilihan fokus ke depan wizard, buat bot otomatis dari fokus, turunkan BYOK ke "lanjutan". Files: `apps/web/src/pages/Onboarding.tsx`, `apps/api/src/onboarding.ts`. Dependencies: B1. Risk: R2. **Frontend → `frontend-fable`.**

**B3. Perbaikan form auth** — tautan lupa kata sandi, syarat kata sandi, error email duplikat, checkbox consent. Files: `apps/web/src/pages/Auth.tsx`. Dependencies: A3. Risk: R1. **Frontend → `frontend-fable`.**

### Fase C — Aktivasi

**C1. Kartu aktivasi WhatsApp** — kartu pairing di dalam thread setelah balasan berguna pertama, memakai `beginWhatsAppPairing` yang sudah ada. Files: `apps/web/src/pages/Shell.tsx`, `apps/api/src/onboarding.ts`. Dependencies: B1. Risk: R2. **Frontend → `frontend-fable`.**

**C2. Route Home / Overview** — layar orientasi dari data yang sudah ada (`Run`, `Event`, `Computer`, `Routine`, approval tertunda). Files: `apps/web/src/App.tsx`, halaman baru, prosedur ringkasan di `apps/api/src/router.ts`. Dependencies: tidak ada. Risk: R2. **Frontend → `frontend-fable`.**

### Fase D — Alur produk inti

**D1. Pembacaan entitlement terpusat** — satu fungsi yang membaca `EntitlementState` + `freePlanLimits` dan mengembalikan keputusan; pasang di titik pembuatan bot, connector, routine, dan sesi computer. Files: `packages/core/src/platform-policy.ts`, `packages/db/src/platform.ts`, `apps/api/src/router.ts`. Risk: R3 → `verifier-opus` (menyentuh jalur uang dan bisa mengunci pengguna). Acceptance: melampaui batas menghentikan pembuatan dengan kode error spesifik; bot di atas batas **dijeda, tidak dihapus** (sesuai `paket-free-batas-v1.md:65-77`).

**D2. Sinyal kuota + jalur upgrade di UI** — indikator penggunaan, state batas tercapai, tombol upgrade ke checkout Xendit yang sudah ada. Dependencies: D1. Risk: R2. **Frontend → `frontend-fable`.**

**D3. Job kedaluwarsa masa tenggang** — jalankan `transitionSubscription(grace_elapsed)` di worker. Files: `apps/worker`. Dependencies: D1. Risk: R2.

**D4. Pemulihan sesi berdasarkan penyebab** — pisahkan 401 dari kegagalan transport. Files: `apps/web/src/App.tsx:97-141`. Risk: R1. **Frontend → `frontend-fable`.**

### Fase E — Penggunaan lanjutan

**E1.** Perkenalan fitur bertahap berbasis peristiwa (routine → computer → skills → MCP).
**E2.** Manajemen sesi (daftar perangkat + keluar dari semua perangkat).
**E3.** Empty state per-fitur di seluruh overlay. **Frontend → `frontend-fable`.**
**E4.** Google OAuth.
**E5.** Onboarding mobile.
**E6.** Tier Pro/Business.

---

## 10. Recommended First Implementation

**Mulai dari A1 — antarmuka penyedia email + adapter SMTP.**

Alasan:
- Ia memblokir dua lubang P0 sekaligus (A2 verifikasi, A3 reset password) dan tidak diblokir apa pun.
- Blast radius-nya paling kecil dari semua pekerjaan P0: paket baru, satu adapter, satu titik komposisi. Nol perubahan pada jalur permintaan yang sudah berjalan.
- `SMTP_URL` sudah ada di `.env.example:101` dan `README.md:507` — kontraknya sudah diumumkan, tinggal ditepati.
- Ia sesuai persis dengan aturan `AGENTS.md`: netral-vendor, di belakang antarmuka, adapter di composition root, test deterministik offline.

Jika Gaffer lebih memilih dampak produk dahulu ketimbang keamanan, alternatif yang paling murah adalah **B1b (menandai jalur gratis di onboarding)** — perubahan frontend murni yang langsung membuka aktivasi, karena kapabilitasnya sudah berjalan.

Peringatan penting: **A4 tidak melindungi jalur ini.** A4 membatasi `POST /v1/managed-ai/responses`, sedangkan jalur kunci deployment berjalan lewat `router.ts:1993 → executor.ts` dan tidak pernah menyentuh endpoint itu. Jadi B1b tanpa B1 tetap mengundang lebih banyak pengguna ke anggaran yang **sama sekali tidak terukur**. Satu-satunya urutan yang aman adalah **B1 → B1b**.

Rekomendasi saya: **A1 → A4 → A3 → A2 → B1 → B1b**. Fondasi lebih dulu, aktivasi menyusul begitu pengeluaran terlindungi dan terukur.

---

## Residual risk / NOT VERIFIED

- ~~Perilaku rate limiting bawaan better-auth 1.6.27~~ — **TERSELESAIKAN**, lihat §3.4: aktif bawaan di produksi dengan aturan khusus 3 per 10 detik untuk sign-in/sign-up.
- Atribut cookie (`secure`/`sameSite`/`httpOnly`) mengandalkan default better-auth; tidak ditemukan override eksplisit.
- Perlindungan CSRF bergantung pada penanganan internal better-auth; tidak diverifikasi.
- Titik masuk onboarding mobile tidak ditemukan — belum jelas disengaja atau celah.
- Jembatan klinis RME yang disebut `README.md:674` tidak ditemukan direktori implementasinya; kemungkinan penamaan berbeda.
- Item di bawah judul "Unreleased" pada `CHANGELOG.md` belum dicek satu per satu terhadap kode.

---

## 11. Catatan implementasi (2026-09-10, branch `feat/auth-foundation`)

Belum di-commit. Bukti verifikasi:
- `vitest run` penuh → **260 file / 2114 test lulus**, 20 file / 113 test skip.
- Typecheck seperti yang dijalankan CI (`pnpm --filter … check`, yaitu skrip `check` tiap paket) → **bersih** di `@sentrabot/api`, `@sentrabot/auth`, `@sentrabot/adapters`, `@sentrabot/adapter-kit`, dan `@sentrabot/web`.
- `biome check apps packages` → bersih, 785 file.

Catatan metode: menjalankan `tsc` lewat binari root monorepo memunculkan puluhan error `Cannot find name 'AbortSignal'/'Buffer'/'URL'` di `apps/web`, `packages/adapter-kit`, dan `packages/contracts`. Itu **artefak resolusi `@types/node` dari root yang salah**, bukan kondisi repositori — gerbang CI yang sesungguhnya bersih. Gunakan `pnpm --filter <paket> check`.

### A5 — trusted origin digerbangi produksi · PASS
`apps/api/src/app.ts` `isTrustedOrigin` + array `extraOrigins`, `apps/api/src/env.ts` `isProduction`.
- `sentrabot://` berubah dari `startsWith` menjadi **kecocokan persis**, tetap dipercaya di produksi karena mobile produksi mengirim persis string itu (`apps/mobile/lib/api.ts:95`). `sentrabot://evil.example` kini ditolak.
- `exp://` dan localhost sembarang port hanya di luar produksi. Empat URL dev Expo di `extraOrigins` (yang juga memberi makan `trustedOrigins` better-auth) ikut digerbangi — permukaan kedua ini semula terlewat.
- Ditambahkan `matchesConfiguredLoopback`: `localhost` diterima bila deployment sudah mendeklarasikan origin loopback dengan skema dan port yang sama (dan sebaliknya). Ini menutup footgun self-host — `.env.example` memakai `127.0.0.1:5173` sementara orang mengetik `localhost:5173`, dua origin berbeda bagi browser. Tidak melebarkan apa pun di luar origin yang sudah dideklarasikan deployment.
- Tes: `apps/api/src/is-trusted-origin.test.ts` (11 kasus, termasuk `localhost.evil.example` dan `127.0.0.1.evil.example` yang tetap ditolak).
- Diverifikasi sendiri: `isTrustedOrigin` **hanya** dipakai middleware CORS (`app.ts:340`) — bukan untuk CSRF atau auth — sehingga cabang `!origin → true` tidak menjadi lubang. Desktop memuat URL http(s) (`apps/desktop/src/main.ts:116`) sehingga Origin-nya sama dengan `WEB_ORIGIN`.

Pemeriksaan parsing URL dijalankan langsung di Node 24 (`new URL(...)`), bukan diasumsikan:

| Origin | `hostname` | Hasil |
|---|---|---|
| `http://localhost.evil.com` | `localhost.evil.com` | ditolak |
| `http://127.0.0.1.evil.com` | `127.0.0.1.evil.com` | ditolak |
| `http://localhost.:5173` | `localhost.` | ditolak (gagal-menutup, lebih ketat dari perlu) |
| `http://[::1]:5173` | `[::1]` **dengan kurung siku** | diterima — entri `"[::1]"` di Set memang benar, bukan kode mati |
| `http://2130706433:5173` | dinormalkan ke `127.0.0.1` | diterima; bentuk desimal dari host yang sama, dan hanya bila deployment memang mendeklarasikan origin loopback pada protokol dan port itu |
| `http://evil.com@localhost:5173` | `localhost` (userinfo dibuang) | tidak relevan: browser tidak pernah menyertakan userinfo di header Origin |
| `HTTP://LOCALHOST:5173` | `localhost` | diterima; sebenarnya perbaikan, karena cabang kecocokan-persis akan meleset pada huruf besar |

Port default dinormalkan ke `""` secara konsisten (`http://127.0.0.1:80` dan `http://localhost` sama-sama `""`), sehingga perbandingan `url.port === candidate.port` benar; protokol tetap dibandingkan sehingga `https://localhost` tidak pernah cocok dengan `http://localhost`.

### A4 — rate limiting · PASS
- `packages/auth/src/index.ts`: `rateLimit: { enabled: env.rateLimitEnabled ?? true }`. Window/max/aturan khusus tetap default pustaka; hanya `enabled` yang dipaku agar tidak bergantung pada deteksi `isProduction` better-auth.
- `apps/api/src/rate-limiter.ts` (baru) + `apps/api/src/managed-ai.ts`: fixed-window in-memory, 60 permintaan/menit per pemanggil pada `POST /v1/managed-ai/responses`, membalas 429 + `Retry-After`. Tanpa dependensi baru. Jam disuntik agar tes deterministik. Bucket kedaluwarsa disapu tiap pemeriksaan.
- Kunci pemanggil: `x-forwarded-for` → `x-real-ip` → alamat soket via `getConnInfo`, baru `"unknown"`. Fallback soket ditambahkan supaya deployment tanpa proxy tidak menumpuk semua pemanggil ke satu bucket bersama.
- Tes: `apps/api/src/rate-limiter.test.ts` (5) + kasus 429 ujung-ke-ujung di `managed-ai.test.ts`.

### A1 — seam email + adapter SMTP · PASS
- `packages/adapter-kit/src/email.ts` (baru): `EmailMessage` + `EmailSender`. Sengaja **tidak** memakai ulang `NotificationProvider` yang sudah ada — payload-nya (`types.ts:464-470`) mewajibkan `botId`/`threadId` dan `kind` aktivitas agen, sementara email auth tidak punya bot maupun thread.
- `packages/adapters/src/smtp-email.ts` (baru): `parseSmtpUrl` + `SmtpEmailSender` + `createSmtpEmailSender`, digerakkan `SMTP_URL`/`SMTP_FROM`. Tanpa konfigurasi ia mengembalikan `undefined`, jadi API tetap boot. Dependensi baru: `nodemailer`.
- Disambungkan di `apps/api/src/env.ts` (`smtpUrl`, `smtpFrom`) dan `apps/api/src/app.ts` (composition → `createAuth`).
- `.env.example`: `SMTP_URL` kini terdokumentasi dan `SMTP_FROM` ditambahkan.

### A3 — reset kata sandi · PASS · dan A2 — verifikasi email · SEBAGIAN

**A2 sengaja dicatat SEBAGIAN**: pengiriman email verifikasi dan pembalikan `emailVerified` sudah jalan, tetapi kriteria penerimaan A2 di §9 juga menuntut "tindakan berisiko (checkout, pairing, connector) menolak akun tak terverifikasi" — gerbang `emailVerified` itu **belum dibuat**. Ia menyentuh `router.ts`, berisiko R2, dan layak jadi unit terpisah.

Tautan verifikasi diverifikasi mendarat dengan benar: `callbackURL` default `"/"` diselesaikan terhadap `BETTER_AUTH_URL`, yang di `.env.example:4` dan `infra/compose/.env.images.example:15` menunjuk **origin web** (`:5173`), bukan API (`:3100`) — dan `env.ts:106` pun jatuh kembali ke `WEB_ORIGIN`. Jadi pengguna mendarat di aplikasi web, bukan 404 API.
- `packages/auth/src/index.ts`: `emailVerification` dengan `sendOnSignUp: true` dan `autoSignInAfterVerification: true`. `requireEmailVerification` sengaja **tetap mati** agar aktivasi tidak dihancurkan.
- `emailAndPassword`: `sendResetPassword` + `revokeSessionsOnPasswordReset: true` — reset adalah jalur pemulihan akun yang mungkin lepas kendali, jadi sesi lain harus ikut mati.
- `packages/auth/src/auth-emails.ts` (baru): salinan email Bahasa Indonesia (teks + HTML) dan `deliverAuthEmail`, yang menelan kegagalan pengiriman agar respons auth tetap seragam — better-auth sudah sengaja membalas identik untuk email terdaftar maupun tidak (`password.mjs:60-71`, termasuk simulasi token untuk menahan timing attack), dan membocorkan status pengiriman akan merusak sifat itu.
- Ketidaktersediaan dilaporkan lewat `onEmailUnavailable` (di-log API), bukan dilempar.
- Tes: `packages/auth/src/auth-emails.test.ts` (6).
- Kontrak yang dipakai frontend, diverifikasi dari sumber pustaka: tautan email → `{baseURL}/reset-password/{token}?callbackURL=…` → redirect ke `{callbackURL}?token=…`, atau `?error=INVALID_TOKEN`. Token berlaku 1 jam, sekali pakai.

### B3 — UI auth dan halaman reset · SEBAGIAN

**SEBAGIAN** karena kriteria B3 di §9 juga menyebut **checkbox consent**, yang belum dibuat — ia menuntut field `termsAcceptedAt` di `User` (§5 langkah 7, prioritas P3) sehingga sengaja ditunda. Sisanya selesai:
- `apps/web/src/pages/ResetPassword.tsx` (baru) + rute `/reset-password` di `App.tsx`, dapat diakses saat belum masuk.
- `apps/web/src/pages/Auth.tsx`: tautan "Lupa kata sandi?", syarat kata sandi terlihat sebelum submit, dan penanganan email duplikat yang menawarkan pindah ke halaman masuk.
- `apps/web/src/pages/auth-shell.tsx` (baru): shell bersama agar palet dan radius punya satu sumber.
- Semua state tercakup: idle, submitting, sukses, token kedaluwarsa/hilang, gagal kirim, gagal reset. Konfirmasi permintaan reset bersifat netral sehingga tidak membocorkan keberadaan akun.
- i18n: `lingui extract` dijalankan, **18 string baru diterjemahkan ke Bahasa Indonesia** dan katalog dikompilasi (`id` 0 missing). Locale non-Indonesia lain tetap punya celah seperti sebelumnya.

### Belum dikerjakan
- **B1** (metering jalur kunci deployment) dan **B1b** (menandai jalur gratis di onboarding) — inti aktivasi, belum disentuh.
- Fase C, D, E seluruhnya.

### Residual risk
- `x-forwarded-for` dikendalikan klien. Penyerang dapat merotasi header untuk menghindari batasnya sendiri; membatasi ini butuh konfigurasi trusted-proxy. Batas ini membendung biaya kabur dari runtime tepercaya, bukan penyerang yang gigih.
- Rate limiter berada **sebelum** autentikasi. Bucket per-IP, jadi penolakan layanan lintas penyewa menuntut berbagi IP.
- Penyimpanan rate limit ada di memori proses — benar untuk self-host satu instance, butuh `secondaryStorage` untuk multi-instance.
- Rendering visual halaman reset **NOT VERIFIED** — tidak ada alat browser di sesi ini.
- `redirectTo` memakai `window.location.origin`; di Electron nilainya bisa berbeda dari origin web dan perlu diuji saat alur email dicoba di desktop.
- Atribut cookie dan penanganan CSRF masih mengandalkan default better-auth — **NOT VERIFIED**, sama seperti sebelumnya.
- Satu kegagalan tes intermiten teramati pada satu kali `vitest run` penuh; dua run berikutnya bersih. Belum teridentifikasi, tidak berkaitan dengan perubahan ini.
### Verifikasi independen R3 · dilakukan

Review independen atas `isTrustedOrigin` berhasil pada percobaan kedua, setelah metodenya diubah: kode ditempelkan **inline** ke dalam prompt dan penggunaan tool dilarang sama sekali (percobaan pertama, yang harus membaca repositori sendiri, kehabisan turn tanpa hasil).

Hasil: **tidak ada FAIL, tidak ada exploit path produksi yang dapat dikonstruksikan.** Dua temuan ditindaklanjuti:

1. **Serialisasi Origin.** `http://evil.example@localhost:5173` dan `http://localhost:5173/evil` sebelumnya lolos ke pemeriksaan loopback karena hanya `hostname` yang diperiksa. Kini ditolak lewat penjagaan `new URL(origin).origin !== origin`. Penting: penjagaan itu diletakkan **setelah** cabang `sentrabot://` dan `exp://`, karena skema non-special menyerialisasi `.origin` menjadi `"null"` — menaruhnya di awal akan menolak mobile produksi. Empat tes tambahan mengunci kedua sisi perilaku ini.
2. **`Vary: Origin`.** Ditandai NOT VERIFIED oleh reviewer; diperiksa langsung ke sumber Hono 4 — middleware `cors` menambahkan `Vary: Origin` pada setiap respons selama `origin !== "*"`, dan konfigurasi kita memakai fungsi. Risiko peracunan cache **tidak berlaku**.

Residual yang diterima apa adanya: bila `apiUrl`/`authUrl` dikonfigurasi loopback di produksi sementara `webOrigin` publik, jalur loopback tetap hidup — tetapi origin semacam itu hanya bisa dimiliki konten yang benar-benar dilayani dari mesin dan port yang sama, jadi setara dengan origin yang sudah dideklarasikan. Bentuk IP desimal/oktal (`http://2130706433`) dinormalkan ke `127.0.0.1` oleh parser yang sama yang dipakai browser, sehingga bukan celah.
