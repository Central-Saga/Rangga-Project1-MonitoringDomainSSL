# PRD (ringkas, terverifikasi) — Sistem Monitoring Domain, Hosting & SSL

Dokumen ini adalah ringkasan kebutuhan **yang benar-benar diimplementasikan**
di repository ini, dilengkapi acceptance criteria bernomor `AC-01` … `AC-09`
yang dipakai auditor 496. Untuk latar belakang lengkap lihat
[`PRD.md` di root](../PRD.md); bila keduanya berbeda, implementasi kode dan
dokumen ini yang menjadi acuan verifikasi.

## 1. Konteks

PT Central Saga Mandiri mengelola aset infrastruktur (domain, hosting, SSL,
VPS) yang sebelumnya dicatat manual. Sistem ini memusatkan data klien, proyek,
aset, dan riwayat perpanjangan, serta memberi peringatan otomatis H-30 / H-7 /
expired agar perpanjangan tidak terlewat.

## 2. Kebutuhan fungsional

| ID | Kebutuhan | Implementasi |
|---|---|---|
| FR-01 | Login/logout dengan token Laravel Sanctum | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| FR-02 | Hak akses per role | Enum `UserRole` (`admin`, `staff`, `client`) + FormRequest + Policy |
| FR-03 | CRUD klien & proyek | `apiResource` `clients`, `projects` di `/api` dan `/api/v1` |
| FR-04 | CRUD aset infrastruktur | `apiResource` `assets`; tipe `domain`, `hosting`, `ssl`, `vps` |
| FR-05 | Countdown & alert H-30 / H-7 / expired | `AssetExpiryService`, `assets:check-expiry`, `ExpiringAssetAlert` |
| FR-06 | Riwayat perpanjangan per aset | `renewals` + preview invoice |
| FR-07 | Dashboard ringkasan | `GET /api/dashboard/summary` |
| FR-08 | Validasi & kontrak API | FormRequest, `ScopedExists`, boundary zod di `frontend/lib/api.ts` |
| FR-09 | Operabilitas | `/up` + `/health/ready`, queue worker, scheduler, audit trail |

## 3. Kebutuhan non-fungsional

- **Keamanan:** cookie `HttpOnly` + `Secure` di produksi, header keamanan,
  sanitasi input, field sensitif tidak pernah masuk audit log.
- **Robustness:** setiap response 2xx divalidasi zod; error 4xx/5xx tidak
  menyebabkan white screen.
- **Sustainability:** migrasi otomatis di container, healthcheck tiap service,
  job gagal dipangkas 48 jam, log audit tamper-evident.
- **Dokumentasi:** README menjalankan proyek dari nol dalam ≤ 15 menit; akun
  uji dan manifest tersedia (`docs/AUDIT.md`, `audit.yml`).

## 4. Acceptance criteria

Setiap AC memiliki test otomatis yang bisa dijalankan dari root repository.

### AC-01 — Autentikasi & akun uji per role
Login berhasil untuk `admin@example.com`, `staff@example.com`, dan
`client@example.com` dengan `SEED_PASSWORD` (`password`); token Sanctum
dipakai untuk endpoint terlindungi.
**Verifikasi:** `backend/tests/Feature/AuthLoginTest.php`.

### AC-02 — RBAC
Admin dapat mengelola user dan semua resource; staff dapat mengelola data
domain tetapi tidak user; client hanya melihat data miliknya.
**Verifikasi:** `backend/tests/Feature/RoleMatrixTest.php`,
`backend/tests/Feature/RenewalAccessTest.php`.

### AC-03 — Resource API tersedia di dua prefix
Setiap resource terdaftar di `/api` dan `/api/v1`; id numerik ditolak bila
bukan angka.
**Verifikasi:** `backend/tests/Feature/ApiRouteCoverageTest.php`.

### AC-04 — Alert kedaluwarsa berjenjang
Aset H-30, H-7, dan expired menghasilkan notifikasi level benar; status expired
tetap diperbarui meski tidak ada penerima; duplicate dispatch dikoalesikan.
**Verifikasi:** `backend/tests/Feature/AssetExpiryAlertTest.php`,
`backend/tests/Feature/QueueReadinessTest.php`.

### AC-05 — Riwayat perpanjangan
Renewal tersimpan terhubung ke aset, dapat dilihat sesuai role, dan preview
invoice merender seluruh data wajib.
**Verifikasi:** `backend/tests/Feature/RenewalInvoicePreviewTest.php`.

### AC-06 — Dashboard
Ringkasan total aset, H-30, H-7, expired, dan expiring-soon sesuai data.
**Verifikasi:** `backend/tests/Feature/DashboardSummaryTest.php`.

### AC-07 — Kontrak & validasi response
Frontend menolak body dengan tipe salah, menormalkan `/api/v1`, dan tidak
mengembalikan JSON tanpa `safeParse` zod.
**Verifikasi:** `frontend/tests/api-response-contract.test.ts`,
`frontend/lib/schemas.test.ts`, `frontend/lib/api.test.ts`.

### AC-08 — Kesiapan operasional
`/up` dan `/health/ready` mengembalikan hasil pemeriksaan DB/Redis/queue dengan 503 saat
dependency gagal; mutasi kritikal tercatat dan `audit:verify` mendeteksi
perubahan/penghapusan; `queue:prune-failed` terjadwal.
**Verifikasi:** `backend/tests/Feature/HealthReadinessTest.php`,
`backend/tests/Feature/AuditTrailTest.php`,
`backend/tests/Feature/QueueReadinessTest.php`.

### AC-09 — Eksekusi bersih & prasyarat audit
README memuat jalur clone → install → boot → health check → test dalam ≤ 15
menit; `docs/AUDIT.md`, `docs/PRD.md`, `audit.yml`, dan `SEED_PASSWORD`
tersedia dan konsisten satu sama lain.
**Verifikasi:** `backend/tests/Feature/DocumentationReadinessTest.php`.

## 5. Status

| AC | Status | Catatan |
|---|---|---|
| AC-01 … AC-08 | Lulus | Test terkait hijau di CI pada `main` |
| AC-09 | Lulus | Diverifikasi oleh `DocumentationReadinessTest` |
| Di luar AC | Terbuka | `#106`, `#110`, `#111`, `#112`, `#114`, `#115`, `#116` masih ditangani terpisah |
