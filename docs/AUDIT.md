# Panduan Audit 496 — Project 1: Sistem Monitoring Domain, Hosting & SSL

Dokumen ini adalah sumber kebenaran untuk robot audit **dan** manusia. Isinya:
identitas stack, akun uji per role, cara menjalankan dari nol, endpoint yang
diperiksa, dan batas yang sudah/j belum diverifikasi. Semua perintah dijalankan
dari root repository kecuali disebut lain.

## 1. Identitas & lokasi

| Kunci | Nilai |
|---|---|
| Repository | `Central-Saga/Rangga-Project1-MonitoringDomainSSL` |
| Backend | Laravel 13 — `backend/` (PHP 8.3+) |
| Frontend | Next.js 16 App Router + TypeScript — `frontend/` (Node 22+) |
| Database | PostgreSQL 16 (`db`) |
| Cache / Session / Queue | Redis 7 (`redis`) |
| Mail (dev) | Mailpit (`mailpit`) |
| Worker | `queue` (`queue:work redis`) + `scheduler` (`schedule:work`) |
| Compose | `compose.yaml` — 7 service: `db`, `redis`, `mailpit`, `backend`, `queue`, `scheduler`, `frontend` |
| Manifest audit | [`audit.yml`](../audit.yml) di root |
| PRD + acceptance criteria | [`docs/PRD.md`](PRD.md) — `AC-01` … `AC-09` |
| ERD | [`ERD.md`](../ERD.md) |
| Panduan eksekusi bersih | [`README.md`](../README.md) — target ≤ 15 menit |
| Bukti temuan v1.1 | [`docs/AUDIT-EVIDENCE.md`](AUDIT-EVIDENCE.md) |

> Catatan harness: auditor sandbox tidak memakai `docker compose` repo; ia
> melakukan boot sendiri (composer + migrate + serve) di
> `http://127.0.0.1:18080`. Manifest dan akun di bawah tetap dipakai untuk
> verifikasi role. `compose.yaml` disediakan untuk eksekusi lokal/manual.

## 2. Akun uji (`seed_accounts`)

Dibuat oleh `backend/database/seeders/DemoUserSeeder.php` (dijalankan otomatis
oleh entrypoint container saat jumlah user = 0). Password **ketiga** akun
adalah nilai `SEED_PASSWORD` di [`.env.example`](../.env.example) dan
[`backend/.env.example`](../backend/.env.example):

```
SEED_PASSWORD=password
```

| Role (implementasi) | Email | Password | `client_id` | Hak akses |
|---|---|---|---|---|
| `admin` | `admin@example.com` | `password` | `null` | Akses penuh: master data, aset, renewal, user, role. |
| `staff` | `staff@example.com` | `password` | `null` | Mengelola clients/projects/assets/renewals; tidak mengelola user. |
| `client` | `client@example.com` | `password` | client demo | Hanya melihat data milik client-nya sendiri. |

Nama role di seeder (`admin` / `staff` / `client`) adalah nama yang benar-benar
dipakai kode (`App\Enums\UserRole`); PRD awal memakai istilah
admin/operator/viewer. Pemetaan: **staff = operator**, **client = viewer**.
`RoleMatrixTest` dan `AuthLoginTest` menguji ketiga role ini.

### Contoh login

```bash
curl -sS -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"email":"admin@example.com","password":"password"}'
```

Respons sukses memuat `token` Sanctum. Gunakan header
`Authorization: Bearer <token>` untuk endpoint terlindungi. Endpoint juga
tersedia dengan prefix kanonik `/api/v1/...`.

## 3. Endpoint yang diperiksa auditor

| Endpoint | Harapan | Bukti di kode |
|---|---|---|
| `GET /up` | `200`, JSON `{status:"up", checks:{database,redis,queue}}` | `app/Http/HealthCheck.php`, `HealthReadinessTest` |
| `GET /health/ready` | `200` saat sehat, `503` saat dependency gagal | `routes/web.php`, `HealthReadinessTest` |
| `POST /api/auth/login` | `200` + token untuk 3 akun di atas | `AuthLoginTest`, `RoleMatrixTest` |
| `GET /api/dashboard/summary` | `200` sesuai role | `DashboardSummaryTest` |
| `GET /api/clients`, `/api/projects`, `/api/assets`, `/api/renewals`, `/api/users` | terdaftar di `/api` **dan** `/api/v1` | `ApiRouteCoverageTest` |

Probe `/up` sengaja gagal (`503`) bila DB mati, Redis mati (saat Redis menjadi
driver aktif), atau antrean tidak bisa diakses. Pada konfigurasi lokal dengan
`CACHE_STORE=array` / `QUEUE_CONNECTION=sync`, check Redis ditandai
`skipped: true` dan **bukan** kegagalan.

## 4. Cara menjalankan (ringkas)

Lihat [`README.md`](../README.md) untuk prosedur lengkap ≤ 15 menit. Ringkasnya:

```bash
docker compose -f compose.yaml up -d --build
docker compose -f compose.yaml ps          # semua service healthy
curl -fsS http://localhost:8000/up         # {"status":"up","checks":{...}}
```

Akses: frontend <http://localhost:3000>, API <http://localhost:8000/api>,
Mailpit <http://localhost:8025>.

Verifikasi cepat:

```bash
cd backend && ./vendor/bin/pint --test \
  && ./vendor/bin/phpstan analyse --no-progress --memory-limit=1G \
  && php artisan test
cd ../frontend && npx tsc --noEmit && npx vitest run && npm run lint && npm run build
```

## 5. Status yang sudah diverifikasi (bukan sekadar klaim)

- Validasi response boundary zod di `frontend/lib/api.ts` — `safeParse` pada
  semua body 2xx; satu-satunya `fetch` berada di client tersebut (`#120`, `#99`).
- Audit trail mutasi kritikal dengan rantai hash + `php artisan audit:verify`
  (`#108`). **Caveat:** tamper-evident, bukan immutable — aktor dengan akses DB
  penuh masih bisa mengubah tabel; storage append-only eksternal belum ada.
- Health/readiness mendalam (`#108`), prune `failed_jobs` 48 jam dan job unik
  untuk alert expiry (`#113`).
- Cookie aman + header keamanan backend (`#107`, `#109`); cookie guard di
  middleware frontend (`#93`).

## 6. Batas / future work (jangan ditutup sebagai "sudah")

- Deploy release job di CI masih `echo`-only; tidak ada script deploy nyata
  (`#112` sedang ditangani terpisah).
- Konfigurasi environment per-stage dan TTL/prefix/fail-open Redis masih
  menjadi temuan terbuka (`#110`, `#111`).
- Upload berkas dan signed URL masih menjadi temuan terbuka (`#106`).
- cakupan test frontend/backend untuk alur-error dan aksesibilitas keyboard
  masih menjadi temuan terbuka (`#114`, `#115`, `#116`).
