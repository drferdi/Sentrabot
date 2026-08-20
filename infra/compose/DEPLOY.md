# Sentra Agent - Backend Terpusat (Production)

Dokumen singkat untuk menyalakan backend pusat Sentra Agent di sebuah server.
Tujuan: satu database + API + worker + web di satu tempat, dan aplikasi desktop/browser hanya menyambung ke sana - pengguna tidak perlu Docker, Node, atau database sendiri.

## Yang akan berjalan
- **postgres** - database (Postgres 16)
- **api** - API dan autentikasi (port 3100, internal)
- **worker** - penjadwal / pekerjaan background
- **web** - antarmuka web (menyambungkan ke API)
- **caddy** - gerbang HTTPS otomatis (Let's Encrypt), port 80/443
- Sandbox agen berjalan di **cloud (E2B)** sesuai konfigurasi; tidak perlu Docker di sisi pengguna.

## Prasyarat server
- Server VPS dengan Docker + Docker Compose terpasang (mis. Ubuntu).
- Nama domain diarahkan (DNS A record) ke IP server, port 80/443 terbuka.
- File repo ini ada di server.

## Langkah di server (sekali saja)
1. Salin repo ke server, lalu dari folder repo buat file lingkungan: copy .env.example menjadi .env
2. Isi kunci penting di .env:
   - RAKAZO_HOST = nama domain, contoh sentra.example.com
   - POSTGRES_PASSWORD = kata sandi database (diisi sendiri, rahasia)
   - BETTER_AUTH_SECRET = rahasia autentikasi (min. 32 karakter)
   - ENCRYPTION_KEY = kunci enkripsi
   - E2B_API_KEY = kunci sandbox cloud
   - BETTER_AUTH_URL dan WEB_ORIGIN = https://<domain>
   - kunci penyedia AI (mis. OPENROUTER_API_KEY) sesuai kebutuhan
3. Nyalakan semua layanan:
   docker compose -f infra/compose/docker-compose.prod.yml up -d --build
   (Caddy membuat sertifikat HTTPS otomatis saat pertama kali)
4. Cek sehat: buka https://<domain>/health
5. Cadangkan database terjadwal: lihat infra/systemd/rakazo-backup.*

## Menjadikan aplikasi desktop terhubung ke server
Aplikasi desktop memuat antarmuka dari alamat ini -> setel saat menjalankan:
   RAKAZO_WEB_URL=https://<domain>
(cara default memuat web lokal tetap tersedia)

## Berhenti / memperbarui
- Berhenti: docker compose -f infra/compose/docker-compose.prod.yml down
- Update: tarik perubahan repo, lalu jalankan up -d --build lagi.

## Catatan
- Rahasia tidak boleh masuk git; gunakan .env di server.
- SIGNUPS_ENABLED / SIGNUP_ALLOWLIST di .env mengontrol siapa yang bisa daftar.


## Opsi database terpusat: pakai Supabase (disarankan)
Gunakan Supabase sebagai database pusat:
- Ambil dua Connection string dari Supabase dashboard (Project Settings -> Database).
- .env: DATABASE_URL = Supabase pooled/transaction (port 6543), DIRECT_URL = Supabase direct (port 5432) untuk migrasi Prisma.
- Jalankan migrasi: pnpm --filter @rakazo/db exec prisma migrate deploy (memakai DIRECT_URL)
- Data semua pengguna terpusat di satu Supabase; backup & kelola otomatis oleh cloud.

## Backend terpusat penuh (Supabase) - cara menyalakan di server
Ini versi paling "matang": mesin aplikasi (API + web + worker) ditaruh di server, database di Supabase. Pengguna akhir tidak perlu menyalakan apa pun di komputer mereka - cukup buka alamat dan login.

1. Siapkan server VPS (Docker + Docker Compose). Arahkan domain ke IP server (DNS A record). Buka port 80/443.
2. Salin repo ke server, lalu buat .env: copy .env.example menjadi .env
3. Isi kunci penting di .env:
   - RAKAZO_HOST = nama domain, contoh sentra.example.com
   - DATABASE_URL = Supabase pooled/transaction (port 6543, dengan ?pgbouncer=true)
   - DIRECT_URL = Supabase direct (port 5432)
   - BETTER_AUTH_URL dan WEB_ORIGIN = https://<domain>
   - BETTER_AUTH_SECRET, ENCRYPTION_KEY, E2B_API_KEY, dan kunci penyedia AI
4. Nyalakan semua layanan:
   docker compose -f infra/compose/docker-compose.supabase.yml up -d --build
   (Caddy membuat sertifikat HTTPS otomatis)
5. Cek sehat: buka https://<domain>/health
6. Pengguna akhir cukup buka https://<domain> (atau exe desktop diarahkan ke domain itu) dan login. Tidak perlu Docker, Postgres, atau Node di komputer pengguna.

Catatan: machine API/worker/web butuh akses internet ke Supabase dan pembayar E2B (sandbox agen di cloud). Semua rahasia lewat .env di server, bukan di git.

