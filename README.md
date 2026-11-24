# Rangga — Monitoring Domain, Hosting & SSL + Web Portfolio

Repository ini memuat dua deliverable peserta (`ranggane131-del`, Wayan Rangga):

| Deliverable | Lokasi | Keterangan |
|---|---|---|
| **Project 1** — Sistem Monitoring Domain, Hosting & SSL | `backend/` (Laravel) + `frontend/` (Next.js) | Sistem internal monitoring aset infrastruktur |
| **Project 2** — Web Portfolio: Katalog Produk + Sistem Pesanan Online | [`Central-Saga/Rangga-Project2-KatalogProduk`](https://github.com/Central-Saga/Rangga-Project2-KatalogProduk) | Repo terpisah, Laravel 12 + Blade + Tailwind |

**Target eksekusi bersih: ≤ 15 menit** dari `git clone` sampai health check dan
login seed berhasil. Prosedur lengkap ada di bawah.

---

## 1. Eksekusi bersih Project 1 (≤ 15 menit) — Opsi A: Docker Compose

### Prasyarat

| Alat | Versi minimal | Cek |
|---|---|---|
| Docker + Compose v2 | Docker 24, `docker compose version` | `docker compose version` |
| Git | versi apa saja | `git --version` |

> Opsi A hanya butuh Docker. Node/PHP/Composer **tidak perlu** dipasang di host
> karena sudah ada di image. Untuk jalur manual (Opsi B) lihat bagian 2.

### Langkah (timer ± 12 menit)

```bash
# 1) Clone (~1 menit)
git clone https://github.com/Central-Saga/Rangga-Project1-MonitoringDomainSSL.git
cd Rangga-Project1-MonitoringDomainSSL

# 2) Env lokal (~1 menit) — compose memakai backend/.env.compose yang sudah ada;
#    salin .env.example juga supaya php artisan di host bisa dipakai.
cp backend/.env.example backend/.env

# 3) Boot semua service (~5–7 menit, termasuk build image)
docker compose -f compose.yaml up -d --build

# 4) Tunggu hingga semua service healthy (~1 menit)
docker compose -f compose.yaml ps

# 5) Verifikasi probe (~30 detik) — harapan: {"status":"up","checks":{...}}
curl -fsS http://localhost:8000/up

# 6) Login dengan akun seed (~30 detik)
curl -sS -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"admin@example.com","password":"password"}'
```

`backend/docker/entrypoint.d/99-app-init.sh` otomatis menunggu DB, menjalankan
`migrate --force`, dan menjalankan seeder bila tabel user masih kosong. Jadi
**tidak ada perintah migrate manual** di jalur Compose.

| Langkah | Estimasi |
|---|---|
| Clone + env | 2 menit |
| `up -d --build` | 5–7 menit |
| `ps` + health check | 1 menit |
| Login seed | 1 menit |
| **Total sampai siap dipakai** | **≤ 12 menit** |

Akses setelah boot:

| Layanan | URL |
|---|---|
| Frontend | <http://localhost:3000> |
| API (kompatibilitas) | <http://localhost:8000/api> |
| API (kanonik) | <http://localhost:8000/api/v1> |
| Health | <http://localhost:8000/up> |
| Mailpit | <http://localhost:8025> |

### Akun uji

Password ketiga akun adalah `SEED_PASSWORD` di [`.env.example`](.env.example)
dan [`backend/.env.example`](backend/.env.example) — default `password`.

| Role | Email | Password |
|---|---|---|
| `admin` | `admin@example.com` | `password` |
| `staff` | `staff@example.com` | `password` |
| `client` | `client@example.com` | `password` |

Detail hak akses dan endpoint yang diperiksa: [`docs/AUDIT.md`](docs/AUDIT.md).

### Verifikasi otomatis (opsional, ± 2 menit setelah boot)

```bash
cd backend
./vendor/bin/pint --test
./vendor/bin/phpstan analyse --no-progress --memory-limit=1G
php artisan test

cd ../frontend
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run check:bundle
```

---

## 2. Eksekusi bersih Project 1 — Opsi B: Manual (tanpa Docker)

Butuh PostgreSQL 16 dan Redis 7 berjalan di host (atau lewat
`docker compose up -d db redis`). Estimasi ± 14 menit.

```bash
# Prasyarat: PHP 8.3+, Composer 2, Node 22+
php --version && composer --version && node --version

# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan storage:link
php artisan migrate --force
php artisan db:seed --force
php artisan serve --port=8000        # jalankan di terminal tersendiri

# Frontend (terminal lain, dari root repo)
cd frontend
npm ci
npm run dev                          # http://localhost:3000
```

Ubah `DB_HOST`/`REDIS_HOST` di `backend/.env` menjadi `127.0.0.1` bila DB dan
Redis berjalan di host (nilai default `.env.example` sudah `127.0.0.1`;
`.env.compose` memakai nama service `db`/`redis`).

---

## 3. Troubleshooting singkat

| Gejala | Penyebab & solusi |
|---|---|
| `curl /up` mengembalikan `503` | DB/Redis/queue belum siap. Cek `docker compose logs -f backend`; ulangi setelah beberapa detik. Bila Redis bukan driver aktif, field `redis` akan berisi `skipped: true` — itu bukan error. |
| Port 8000/3000 bentrok | Ubah mapping port di `compose.yaml` atau hentikan proses lama. |
| `php artisan test` gagal koneksi DB | Test memakai SQLite in-memory (`phpunit.xml`), tidak butuh PostgreSQL. Pastikan ekstensi `pdo_sqlite` aktif. |
| Login 429 | Rate limit login `throttle:5,1`; tunggu 1 menit. |
| Ingin ulang data seed | `docker compose exec backend php artisan migrate:fresh --seed --force`. |

---

## 4. Project 2 — Web Portfolio

Project 2 sebelumnya tidak memiliki artefak sehingga audit 496 tidak bisa
dijalankan (issue **#70**). Deliverable sekarang tersedia dan sudah diverifikasi
dapat di-clone, di-boot, dan diuji:

- **Repo:** <https://github.com/Central-Saga/Rangga-Project2-KatalogProduk>
- **HEAD `main`:** `e26a5c4cf1d18e79d8da13e9546769708d1e5e8c`
- **Pull request:** <https://github.com/Central-Saga/Rangga-Project2-KatalogProduk/pull/1>
- **Detail, stack, cara run, dan bukti verifikasi:** [`PROJECT2.md`](PROJECT2.md)

Ringkas — stack: Laravel 12 (PHP 8.2+), Blade + Tailwind CSS 4 (Vite), SQLite/MySQL.
Build frontend sukses, `php artisan test` **22 passed** (63 assertions), `pint --test` passed,
dan CI GitHub Actions (Pint + PHPUnit + Vite build) aktif.

---

## 5. Struktur repository

```
.
├── backend/          # Project 1 — API Laravel
├── frontend/         # Project 1 — UI Next.js
├── docs/
│   ├── AUDIT.md      # Akun uji, endpoint, status verifikasi (audit 496)
│   ├── PRD.md        # Kebutuhan + AC-01 … AC-09
│   └── AUDIT-EVIDENCE.md  # Bukti temuan v1.1 yang sudah stale
├── audit.yml         # Manifest audit 496
├── .env.example      # SEED_PASSWORD (ringkasan; detail di backend/.env.example)
├── PROJECT2.md       # Deliverable Project 2 (link, cara run, bukti)
├── PRD.md            # Product Requirements Document (Project 1)
├── ERD.md            # Entity Relationship Diagram (Project 1)
├── compose.yaml      # Docker Compose (db + redis + mailpit + app + queue + scheduler + ui)
└── podman-compose.yml
```

## 6. Dokumentasi

- [`docs/AUDIT.md`](docs/AUDIT.md) — akun uji, endpoint, dan status verifikasi audit
- [`docs/PRD.md`](docs/PRD.md) — kebutuhan dan acceptance criteria bernomor
- [`docs/AUDIT-EVIDENCE.md`](docs/AUDIT-EVIDENCE.md) — bukti temuan lama yang sudah teratasi
- [`PRD.md`](PRD.md) / [`ERD.md`](ERD.md) — rancangan produk & data Project 1
- [`PROJECT2.md`](PROJECT2.md) — deliverable Project 2 + bukti verifikasi
