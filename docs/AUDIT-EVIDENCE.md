# Audit 496 v1.1 — bukti verifikasi temuan lama

Dokumen ini mencatat bukti bahwa sebagian temuan v1.1 (yang dibuat dari snapshot `7037edb`) sudah tidak relevan pada `main` setelah PR #91, #118, #119, #121. Semua perintah dijalankan dari root repo kecuali disebut lain.

| Issue | Parameter | Bukti saat ini | Perintah |
|---|---|---|---|
| #96 | `frontend 2.4` `shared/ui` presentational | `frontend/components/shared/ui/` berisi `Button.tsx`, `DataTable.tsx`, `FieldError.tsx`, `PageHeader.tsx`, `StateNotice.tsx`, `index.ts`; tidak ada `fetch(`/`axios` di dalamnya | `grep -RInE 'fetch\\(|axios' frontend/components/shared/ui` |
| #98 | `backend 0.10` Pint + Larastan | `larastan/larastan ^3.0` + `laravel/pint ^1.27` di `backend/composer.json`; `backend/phpstan.neon.dist`; `pint --test` PASS 113 file; `phpstan analyse` `[OK] No errors` | `cd backend && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --no-progress --memory-limit=1G` |
| #99 | `frontend 1.14` tipe respons | Boundary zod di `frontend/lib/api.ts:264-289` mem-`safeParse` semua body 2xx. Satu-satunya cast pada data (`parsed.data as T`) sudah dihilangkan; cast sekarang hanya pada skema (`as ZodType<T>`) dan untuk 204 (`undefined as T`, tanpa body). Test: `lib/api.test.ts`, `lib/schemas.test.ts`, `tests/api-response-contract.test.ts` | `grep -n 'as ' frontend/lib/api.ts` |
| #100 | `frontend 9.5` bundle awal | `npm run check:bundle`: base chunks **171156 byte (167.1 KiB)**, budget 204800 byte (200 KiB) — LULUS. Ukuran dihitung gzip dari `polyfillFiles + rootMainFiles + chunk rute` | `cd frontend && npm run build && npm run check:bundle` |
| #102 | `backend 1.7` index FK | `sessions.user_id` di `backend/database/migrations/0001_01_01_000000_create_users_table.php:37` memakai `->index()->constrained()->nullOnDelete()` (PR #118) | `grep -n user_id backend/database/migrations/0001_01_01_000000_create_users_table.php` |
| #105 | `backend 4.4`, `4.6` | `4.4`: tujuh delapan kolom yang disebut audit (`asset_id`, `data`, `last_activity`, `notifiable`, `payload`, `previous_expired_date`, `renewed_by`, `token`) adalah field framework/derived, bukan input klien. `4.6`: keenam `Rule::exists` kini lewat `App\Http\Concerns\ScopedExists` (soft-delete + scope tenant); `grep Rule::exists app/Http/Requests` → 0 (PR #119, test `ScopedExistsTest`) | `cd backend && ./vendor/bin/phpstan analyse --no-progress --memory-limit=1G && php artisan test --filter=ScopedExistsTest` |
| #117 | `frontend 12.4` `console.log` | Tidak ada `console.log` di `frontend/app`, `components`, `lib`, `tests`, maupun artefak `frontend/.next/static` | `grep -RInF console.log frontend/app frontend/components frontend/lib frontend/tests` |

## Ringkasan verifikasi bersama

```
backend:  ./vendor/bin/pint --test -> PASS 113 files
          ./vendor/bin/phpstan analyse --no-progress --memory-limit=1G -> [OK] No errors
          php artisan test -> 53 passed (305 assertions)
frontend: npx tsc --noEmit -> OK
          npx vitest run -> 14 file, 89 test passed
          npm run lint -> OK
          npm run build -> OK
          npm run check:bundle -> 167.1 KiB < 200 KiB
```

Catatan: temuan v1.1 diambil pada `7037edb`; PR #118, #119 dan #121 mengubah kondisi tersebut. Baris yang masih perlu ditangani secara nyata (queue/health/audit, cookie/header, docs prasyarat, coverage) tidak dimasukkan dalam tabel ini.
