# ADR 0001 — Versioning API dengan prefix dan alias legacy

- Status: Accepted
- Tanggal: 2026-11-23

## Konteks

Audit 496 menemukan tidak ada versi API pada prefix route. Mengganti prefix
secara langsung akan memutus klien yang sudah memakai `/api/*`, termasuk
frontend yang sedang berjalan.

## Keputusan

1. Satu definisi route (`routes/api.php`) didaftarkan dua kali:
   - `/api/*` — alias legacy, nama route tanpa prefix.
   - `/api/v1/*` — kanonik berversi, nama route diawali `v1.`.
2. Parameter path dibatasi numerik (`[0-9]+` / `whereNumber`).
3. Kedua prefix memakai controller, FormRequest, dan Resource yang sama.

## Konsekuensi

- Perubahan status respons (mis. 201 + Location) otomatis berlaku di dua prefix.
- Nama route berbeda, jadi `route('assets.show')` tetap menunjuk ke alias legacy;
  kode baru sebaiknya memakai `route('v1.assets.show')`.
- `docs/openapi.yaml` mendokumentasikan keduanya lewat `servers`.
- Alternatif yang ditolak: header `Accept-Version` (sulit diuji dan tidak
  terlihat di URL) dan penghapusan prefix lama (merusak kompatibilitas).
