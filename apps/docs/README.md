# apps/docs — situs dokumentasi Mintlify

Situs dokumentasi publik SentraBot. Isinya **hanya** materi yang layak dibaca pengguna.

## Menjalankan lokal

```bash
cd apps/docs
npx mint dev          # http://localhost:3000
npx mint broken-links # cek tautan mati
```

Unduhan pertama `mint` cukup besar, jadi jalankan sekali di jaringan yang stabil.

## Menerbitkan

Belum tersambung. Untuk menerbitkan, Chief perlu:

1. Membuat akun di [mintlify.com](https://mintlify.com)
2. Memasang GitHub App Mintlify ke repositori ini
3. Mengarahkan *docs directory* ke `apps/docs`

Langkah 1–3 memerlukan kredensial dan pembuatan akun, jadi tidak dapat dilakukan agen.

## Struktur

| Berkas | Isi |
|---|---|
| `docs.json` | Konfigurasi, navigasi, warna brand (`#5B8CFF` aksen, `#0D1117` gelap) |
| `index.mdx` | Beranda |
| `mulai/paket.mdx` | Paket dan batas — diturunkan dari `docs/product/paket-free-batas-v1.md` |
| `mulai/pasang.mdx` | Pasang sendiri — dari `docs/self-host.md` |
| `menjalankan/*.mdx` | Computer runtime dan performa |
| `kebijakan/*.mdx` | Ringkasan Privasi & Ketentuan, menautkan ke versi resmi di situs utama |

## Root `docs/` di git

Yang di-track di repositori publik: `docs/brand/`, `docs/legal/`, `docs/plans/`.
Sisanya (self-host, architecture, superpowers, product notes, screenshots, dll.)
di-gitignore — tetap boleh ada lokal, tidak ikut push.

`mulai/paket.mdx` dan `kebijakan/*.mdx` adalah turunan publik. Bila angka paket atau
kebijakan berubah, sesuaikan halaman di sini dan `apps/site/public/*.html`.
