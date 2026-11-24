# Arsitektur backend

```
HTTP client
   │
   ▼
bootstrap/app.php ──► TrustProxies ──► AssignRequestId (X-Request-ID + Log::withContext)
   │
   ▼
routes/api.php ──► /api/* (legacy) + /api/v1/* (kanonik)
   │
   ▼
Middleware API ──► CookieTokenToBearer ──► VerifyCookieCsrf ──► auth:sanctum
   │                                                    ──► throttle ──► SubstituteBindings
   ▼
FormRequest ──► prepareForValidation ──► rules + withValidator ──► authorize
   │
   ▼
Controller (tipis) ──► Service (use case) ──► Model Eloquent
   │                                         │
   │                                         ├─► Resources (format respons)
   │                                         └─► DB transaction
   ▼
JsonResource ──► 200 / 201 + Location / 204
```

## Prinsip

- **Controller tipis:** hanya autorisasi, delegasi, dan pembentukan respons.
- **FormRequest:** normalisasi (`prepareForValidation`), aturan (`rules`),
  dan aturan bisnis lintas field (`withValidator`) berada di satu tempat.
- **Service:** logika use case transaksional (lihat `RenewalService`).
- **Resource:** satu bentuk respons JSON untuk legacy dan v1.
- **Kontrak HTTP:** `docs/openapi.yaml` mengikuti `routes/api.php`.

## Batas I/O

Semua akses database lewat Eloquent. Query daftar memakai `select()` eksplisit
dan `paginate()` dengan batas `per_page` 1..50 (lihat `ConstrainsListQueries`).
Relasi dimuat dengan `with()` untuk menghindari lazy loading; strict mode aktif
di luar production.

## Observabilitas

Setiap request API mendapat `X-Request-ID` (dari klien atau dibuat baru),
dikembalikan di header response, dan disuntikkan ke `Log::withContext`.
Penjadwalan: `assets:check-expiry` (07:00) dan `sanctum:prune-expired` (03:00).
