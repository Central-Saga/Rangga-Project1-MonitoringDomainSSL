# Rencana rollback backend

Prinsip: **deploy baru tidak boleh merusak data lama**. Setiap rilis diberi tag
Git (`vX.Y.Z`) dan setiap migrasi harus memiliki `down()` yang aman.

## Rollback aplikasi (kode)

1. Tentukan tag sebelumnya: `git tag --sort=-creatordate | head`.
2. Checkout tag tersebut di host: `git checkout vX.Y.Z`.
3. Bersihkan cache: `php artisan optimize:clear && php artisan config:cache && php artisan route:cache`.
4. Restart PHP-FPM / worker: `sudo systemctl reload php8.3-fpm && sudo systemctl restart supervisor`.
5. Verifikasi: `curl -fsS http://127.0.0.1:8000/up` dan `php artisan route:list --path=api/v1`.

## Rollback migrasi

1. Lihat batch terakhir: `php artisan migrate:status`.
2. Untuk satu batch: `php artisan migrate:rollback --step=1`.
3. Hindari `migrate:fresh` di lingkungan produksi (menghapus seluruh data).

## Kompatibilitas mundur (BC)

- Endpoint lama `/api/*` tetap dipertahankan sebagai alias dari `/api/v1/*`,
  sehingga rollback kode frontend tidak memutus klien yang masih memakai prefix lama.
- Kolom baru wajib `nullable` atau memiliki default agar migrasi lama tetap bisa
  membaca baris yang dibuat versi baru.
- Perubahan format respons penambahan field (bukan penghapusan) agar klien lama
  tetap bisa parse.

## Verifikasi setelah rollback

- Jalankan `php artisan test` di lingkungan staging.
- Pastikan `X-Request-ID` masih dikembalikan dan login masih berfungsi.
- Catat waktu rollback dan alasan di CHANGELOG / catatan insiden.
