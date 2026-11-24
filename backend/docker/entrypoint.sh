#!/bin/sh
set -e

# Menjalankan skrip inisialisasi (migrasi, seed, storage:link) sebelum service
# utama aktif. Dipakai oleh Dockerfile; image serversideup di Containerfile
# menjalankan /etc/entrypoint.d secara otomatis. (audit #112)
if [ -d /etc/entrypoint.d ]; then
    for script in /etc/entrypoint.d/*.sh; do
        [ -f "$script" ] || continue
        echo "==> entrypoint: $(basename "$script")"
        sh "$script"
    done
fi

exec "$@"
