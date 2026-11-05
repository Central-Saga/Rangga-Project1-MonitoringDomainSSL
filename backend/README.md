# Backend - Sistem Monitoring Domain, Hosting & SSL

Folder ini berisi kode sumber untuk API dan logika server (Laravel).

## 🛠️ Teknologi
*   Laravel (PHP)
*   Laravel Sanctum (Autentikasi)

## 💻 Cara Menjalankan Backend
1. Masuk ke folder ini: `cd backend`
2. Install dependensi: `composer install`
3. Copy file environment: `cp .env.example .env`
4. Generate key: `php artisan key:generate`
5. Sesuaikan konfigurasi database di file `.env`
6. Jalankan migrasi dan seeder: `php artisan migrate:fresh --seed`
7. Jalankan server: `php artisan serve`

---
*Untuk panduan lengkap cara menjalankan keseluruhan sistem (termasuk frontend), silakan baca [README Utama di folder root](../README.md).*