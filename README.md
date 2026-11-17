# Rangga — Monitoring Domain, Hosting & SSL + Web Portfolio

Repository ini memuat dua deliverable peserta (`ranggane131-del`, Wayan Rangga):

| Deliverable | Lokasi | Keterangan |
|---|---|---|
| **Project 1** — Sistem Monitoring Domain, Hosting & SSL | `backend/` (Laravel) + `frontend/` (Next.js) | Sistem internal monitoring aset infrastruktur |
| **Project 2** — Web Portfolio: Katalog Produk + Sistem Pesanan Online | [`Central-Saga/Rangga-Project2-KatalogProduk`](https://github.com/Central-Saga/Rangga-Project2-KatalogProduk) | Repo terpisah, Laravel 12 + Blade + Tailwind |

## Project 2

Project 2 sebelumnya tidak memiliki artefak sehingga audit 496 tidak bisa dijalankan (issue **#70**).
Deliverable sekarang tersedia dan sudah diverifikasi dapat di-clone, di-boot, dan diuji:

- **Repo:** <https://github.com/Central-Saga/Rangga-Project2-KatalogProduk>
- **HEAD `main`:** `e26a5c4cf1d18e79d8da13e9546769708d1e5e8c`
- **Pull request:** <https://github.com/Central-Saga/Rangga-Project2-KatalogProduk/pull/1>
- **Detail, stack, cara run, dan bukti verifikasi:** [`PROJECT2.md`](PROJECT2.md)

Ringkas — stack: Laravel 12 (PHP 8.2+), Blade + Tailwind CSS 4 (Vite), SQLite/MySQL.
Build frontend sukses, `php artisan test` **22 passed** (63 assertions), `pint --test` passed,
dan CI GitHub Actions (Pint + PHPUnit + Vite build) aktif.

## Struktur repository

```
.
├── backend/          # Project 1 — API Laravel
├── frontend/         # Project 1 — UI Next.js
├── PROJECT2.md       # Deliverable Project 2 (link, cara run, bukti)
├── PRD.md            # Product Requirements Document (Project 1)
├── ERD.md            # Entity Relationship Diagram (Project 1)
└── podman-compose.yml
```

## Dokumentasi

- [`PROJECT2.md`](PROJECT2.md) — deliverable Project 2 + bukti verifikasi
- [`PRD.md`](PRD.md) — kebutuhan produk Project 1
- [`ERD.md`](ERD.md) — rancangan data Project 1
