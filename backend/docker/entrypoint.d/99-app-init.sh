#!/bin/sh
set -e

ARTISAN="php artisan"

echo "==> Menunggu database siap..."
until $ARTISAN migrate --force > /dev/null 2>&1; do
    echo "    database belum siap, coba lagi dalam 3 detik..."
    sleep 3
done
echo "==> Migrasi selesai."

# storage:link harus ada di entrypoint agar berkas yang diunggah bisa diakses
# lewat /storage (audit #112). --force membuatnya idempoten saat restart.
mkdir -p /var/www/html/storage/framework/views /var/www/html/storage/framework/cache /var/www/html/bootstrap/cache
$ARTISAN storage:link --force
# Perbaiki permission setelah bind-mount/volume mengubah umask direktori.
chmod -R u+rwX /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
echo "==> Storage link & permission siap."

USER_COUNT=$($ARTISAN tinker --execute 'echo App\Models\User::count();' 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ]; then
    echo "==> Database kosong, menjalankan seeder data dummy..."
    $ARTISAN db:seed --force
else
    echo "==> Database sudah terisi ($USER_COUNT user), lewati seeder."
fi

$ARTISAN config:cache > /dev/null 2>&1 || true
echo "==> Inisialisasi aplikasi selesai."
