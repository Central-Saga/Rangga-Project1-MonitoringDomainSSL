# Changelog

Semua perubahan penting dicatat di sini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id/1.1.0/).

## [Unreleased]

### Added
- Prefix API berversi `/api/v1` dengan alias legacy `/api` dan pembatasan
  parameter numerik.
- `X-Request-ID` pada seluruh response API dan korelasi `Log::withContext`.
- Jadwal `sanctum:prune-expired` harian pukul 03:00.
- `201 + Location` untuk seluruh endpoint create.
- `prepareForValidation` dan `withValidator` pada FormRequest utama.
- `select()` eksplisit pada query daftar.
- `docs/openapi.yaml`, `docs/ARCHITECTURE.md`, `docs/RUNBOOK.md`,
  `docs/ROLLBACK.md`, dan ADR 0001.
- Test kontrak API, cakupan route, request-id, dan enum domain.

### Changed
- `test-api.sh` tidak lagi memiliki kredensial default; wajib lewat environment
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_EMAIL`, `CLIENT_PASSWORD`.

### Removed
- `tests/Unit/ExampleTest.php` (placeholder) digantikan unit test domain.
