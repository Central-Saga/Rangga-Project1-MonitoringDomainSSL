# Project 2 — Web Portfolio: Katalog Produk + Sistem Pesanan Online

Deliverable **Project 2** untuk audit 496 (240 backend + 256 frontend).
Issue pelacak: **#70 — [Audit 496][P0] Repo Project 2 (web portfolio) tidak ada**.

| Item | Nilai |
|---|---|
| Repo | https://github.com/Central-Saga/Rangga-Project2-KatalogProduk |
| Branch default | `main` |
| HEAD `main` | `e26a5c4cf1d18e79d8da13e9546769708d1e5e8c` |
| Pull request deliverable | https://github.com/Central-Saga/Rangga-Project2-KatalogProduk/pull/1 |
| Peserta | Wayan Rangga (`ranggane131-del`) |

---

## Ringkasan aplikasi

Web portfolio bertema **Katalog Produk + Sistem Pesanan Online** — seluruh alur belanja
(katalog → keranjang → checkout → pelacakan pesanan) dilakukan di website, tanpa WhatsApp,
dan tersimpan di database relasional.

- **Publik:** landing page, katalog + filter kategori/pencarian/pengurutan, detail produk,
  keranjang berbasis session, checkout, kode order unik, lacak pesanan, testimoni,
  halaman dokumentasi PRD/ERD di `/dokumentasi`.
- **Admin (role-guarded):** dashboard, CRUD produk + upload foto, CRUD kategori, kelola pesanan
  + ubah status, laporan penjualan, moderasi testimoni.

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Laravel 12 (PHP 8.2+) |
| View | Blade + Tailwind CSS 4 (Vite 7) |
| Database | SQLite (default), bisa MySQL/PostgreSQL |
| Auth | Session + bcrypt, middleware `auth` + `admin` (`users.is_admin`) |
| Upload | Gambar di `public/uploads/products/` (validasi tipe & ukuran di server) |
| Deploy | Dockerfile multi-stage (PHP 8.3 + Apache), `railway.json` |
| CI | GitHub Actions: Pint + PHPUnit + Vite build |

## Cara menjalankan (dari nol, ±5 menit)

```bash
git clone https://github.com/Central-Saga/Rangga-Project2-KatalogProduk.git
cd Rangga-Project2-KatalogProduk

composer install
cp .env.example .env            # Windows PowerShell: copy .env.example .env
php artisan key:generate

# SQLite (default)
touch database/database.sqlite  # Windows: New-Item database/database.sqlite -ItemType File

php artisan migrate --seed
npm ci && npm run build
php artisan serve
```

Buka <http://localhost:8000>. Akun demo:

| Peran | Email | Password | Akses |
|---|---|---|---|
| Admin | `admin@katalog.test` | `password` | `/admin` |
| Pelanggan | `pelanggan@katalog.test` | `password` | katalog & checkout |

## Bukti verifikasi

Dijalankan pada PHP 8.2.12 / Composer 2.9.5 / Node 24:

| Perintah | Hasil |
|---|---|
| `composer install` | sukses |
| `php artisan migrate:fresh --seed` | 8 migrasi + 4 seeder sukses |
| `npm ci && npm run build` | sukses (JS 51.52 kB gzip, CSS 105.81 kB) |
| `php artisan test` | **22 passed** (63 assertions) |
| `vendor/bin/pint --test` | **passed** |

## Definition of Done (#70)

- [x] Repo Project 2 di org Central-Saga dengan pola `<Nama>-Project2-<Tema>`:
      `Rangga-Project2-KatalogProduk`
- [x] Kode bisa dijalankan (build sukses) + README berisi stack & cara run
- [x] Commit bertahap (12 commit: scaffold → katalog → admin → checkout → test/deploy → perbaikan audit)
- [x] Link repo + SHA HEAD dicatat di dokumen ini dan dikomentari di issue #70
- [ ] Audit 496 dijalankan ulang oleh auditor, lalu issue ditutup dengan bukti skor

## Perbaikan yang disertakan pada deliverable

- Lock Composer di-pin ke platform PHP 8.2 agar `composer install` tidak gagal di PHP 8.2/8.3.
- Artefak build (`public/build`, `.phpunit.result.cache`) dikeluarkan dari repo dan `.gitignore` dilengkapi.
- Checkout publik dipulihkan (tidak lagi memaksa login) sesuai alur PRD.
- Halaman `/dokumentasi` diperbaiki (sebelumnya view terpotong → error 500).
- Otorisasi admin diperketat: `users.is_admin` + middleware `admin` (pelanggan mendapat 403).
- Pipeline CI (Pint + PHPUnit + Vite build) ditambahkan.
