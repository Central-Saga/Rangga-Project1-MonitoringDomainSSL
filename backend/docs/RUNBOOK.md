# Runbook backend Monitoring Infra

Dokumen ini mencatat prosedur operasional untuk empat mode gagal yang paling
sering terjadi (audit 17.3).

## 1. API tidak merespons / 5xx

1. Cek kesehatan: `curl -sS http://127.0.0.1:8000/up` harus mengembalikan 200.
2. Cek log terbaru (sudah berkorelasi dengan `X-Request-ID`):
   `php artisan pail --timeout=60` atau `tail -n 200 storage/logs/laravel.log`.
3. Jika klien melaporkan error, minta `X-Request-ID` dari header response
   (atau dari DevTools → Network → Response Headers) lalu cari id tersebut di log.
4. Periksadependensi: PostgreSQL (`pg_isready`), Redis (`redis-cli ping`), queue worker.

## 2. Koneksi database / Redis gagal

1. `php artisan tinker --execute="DB::select('select 1');"` → harus mengembalikan hasil.
2. `redis-cli ping` → `PONG`.
3. Jika Redis mati, cache dan session akan gagal; jalankan `php artisan cache:clear`
   setelah Redis pulih, lalu `php artisan config:clear && php artisan config:cache`.

## 3. Queue notifikasi menumpuk

1. `php artisan queue:failed` untuk melihat job gagal.
2. `php artisan queue:retry all` untuk mencoba ulang.
3. Pastikan worker berjalan dengan antrean `notifications`:
   `php artisan queue:work redis --queue=notifications --stop-when-empty`.
4. Job expiry dijadwalkan harian pukul 07:00; cek dengan `php artisan schedule:list`.

## 4. Token / autentikasi bermasalah

1. Token Sanctum kedaluwarsa setelah 7 hari (`SANCTUM_TOKEN_EXPIRATION=10080`).
2. Token yang kedaluwarsa dibersihkan otomatis oleh
   `sanctum:prune-expired --hours=24` (harian 03:00).
3. Bersihkan manual: `php artisan sanctum:prune-expired --hours=24`.
4. Password berubah → seluruh token dicabut; user wajib login ulang.

## Eskalasi

Jika langkah di atas tidak menyelesaikan masalah, kumpulkan: `X-Request-ID`,
waktu kejadian (UTC), method + path, dan potongan log, lalu eskalasi ke
pemilik layanan.
