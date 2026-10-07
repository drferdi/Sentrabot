# Domain map — Sentra Bot marketing site

Canonical production host for this package (`apps/site`):

**`https://bot.sentrahai.com`**

| Host | Role |
|------|------|
| `sentrahai.com` / `www` | Brand hub perusahaan (bukan landing Bot) |
| `bot.sentrahai.com` | Landing + halaman publik Sentra Bot (`apps/site`) |
| `*.vercel.app` (`sentrabot-site`) | Preview / fallback deploy Vercel |

DNS untuk `sentrahai.com` sudah di Vercel (`ns1`/`ns2.vercel-dns.com`). Subdomain `bot` harus di-assign ke project **`sentrabot-site`** (team yang deploy site ini). Apex **jangan** dipindah ke project ini — apex masih dipakai produk lain.

Share preview (WhatsApp / X / LinkedIn) and search tags (`canonical`, `og:*`, `twitter:*`, `sitemap.xml`, `robots.txt`) must use **`https://bot.sentrahai.com`**, not the apex. HTTPS is terminated by Vercel; `vercel.json` adds HSTS.

## Assign domain (Vercel Dashboard)

1. Buka project **`sentrabot-site`** → **Settings** → **Domains**.
2. Add **`bot.sentrahai.com`**.
3. Karena NS sudah Vercel DNS, record biasanya dibuat otomatis.
4. Tunggu status **Valid**. Verifikasi:

```bash
curl -sI https://bot.sentrahai.com/
# expect: HTTP/2 200 dan HTML Sentra Bot (bukan x-vercel-error: DEPLOYMENT_NOT_FOUND)
```

## Assign via CLI (butuh token)

```bash
vercel link --project sentrabot-site --yes
vercel domains add bot.sentrahai.com
```

Env: `VERCEL_TOKEN` dengan akses team pemilik project.
