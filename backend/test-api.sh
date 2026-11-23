#!/bin/bash
# Tes end-to-end API Monitoring Infra.
#
# Kredensial TIDAK boleh ditanam di skrip. Isi lewat environment, misalnya:
#   ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD='...' \
#   CLIENT_EMAIL=client@local.test CLIENT_PASSWORD='...' \
#   ./test-api.sh
# Variabel opsional: BASE_URL (default http://127.0.0.1:8000/api), RENEWAL_ID (default 1).
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:8000/api}"
RENEWAL_ID="${RENEWAL_ID:-1}"
cd "$(dirname "$0")"

missing=()
for name in ADMIN_EMAIL ADMIN_PASSWORD CLIENT_EMAIL CLIENT_PASSWORD; do
  if [ -z "${!name:-}" ]; then missing+=("$name"); fi
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "GAGAL: environment berikut wajib diisi: ${missing[*]}" >&2
  echo "Contoh: ADMIN_EMAIL=... ADMIN_PASSWORD=... CLIENT_EMAIL=... CLIENT_PASSWORD=... $0" >&2
  exit 2
fi

# Bangun payload JSON dengan aman (tidak menyisipkan kredensial ke dalam single-quoted string).
login_payload() {
  php -r 'echo json_encode(["email" => $argv[1], "password" => $argv[2]]);' "$1" "$2"
}

extract_token() {
  php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["token"] ?? "";'
}

echo "=== 1. Login admin ==="
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -H "Accept: application/json" \
  -d "$(login_payload "$ADMIN_EMAIL" "$ADMIN_PASSWORD")")
TOKEN=$(printf '%s' "$LOGIN" | extract_token)
if [ -z "$TOKEN" ]; then echo "GAGAL login admin:"; echo "$LOGIN"; exit 1; fi
echo "Token OK: ${TOKEN:0:20}..."
AUTH="Authorization: Bearer $TOKEN"

echo ""
echo "=== 2. Dashboard summary ==="
curl -s "$BASE/dashboard/summary" -H "$AUTH" -H "Accept: application/json" | php -r '$d=json_decode(stream_get_contents(STDIN),true); print_r($d["summary"] ?? $d);'

echo ""
echo "=== 3. Assets expiring in 7 days ==="
curl -s "$BASE/assets?expiring_in=7&per_page=3" -H "$AUTH" -H "Accept: application/json" | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach(($d["data"]??[]) as $a){ echo "- {$a["name"]} ({$a["type"]}) expired {$a["expired_date"]} sisa {$a["days_until_expiry"]} hari\n"; } echo "total: ".($d["meta"]["total"]??"?")."\n";'

echo ""
echo "=== 4. Jalankan command cek expired ==="
timeout 60 php artisan assets:check-expiry

echo ""
echo "=== 5. Notifikasi (setelah queue diproses) ==="
timeout 90 php artisan queue:work redis --queue=notifications --stop-when-empty >/dev/null 2>&1 || true
curl -s "$BASE/notifications?per_page=5" -H "$AUTH" -H "Accept: application/json" | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach(($d["data"]??[]) as $n){ echo "- [{$n["data"]["level"]}] {$n["data"]["message"]}\n"; } echo "unread: ".($d["unread_count"]??"?")."\n";'

echo ""
echo "=== 6. PDF laporan expiring ==="
curl -s -o /tmp/report.pdf -w "HTTP %{http_code}, %{size_download} bytes\n" "$BASE/reports/expiring-assets/pdf?days=30" -H "$AUTH"
file /tmp/report.pdf

echo ""
echo "=== 7. PDF invoice renewal ==="
curl -s -o /tmp/invoice.pdf -w "HTTP %{http_code}, %{size_download} bytes\n" "$BASE/renewals/${RENEWAL_ID}/invoice/pdf" -H "$AUTH"
file /tmp/invoice.pdf

echo ""
echo "=== 8. RBAC: client tidak boleh kelola users ==="
SLOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -H "Accept: application/json" \
  -d "$(login_payload "$CLIENT_EMAIL" "$CLIENT_PASSWORD")")
STOKEN=$(printf '%s' "$SLOGIN" | extract_token)
if [ -z "$STOKEN" ]; then echo "GAGAL login client:"; echo "$SLOGIN"; exit 1; fi
curl -s -o /dev/null -w "client akses /users: HTTP %{http_code} (harus 403)\n" "$BASE/users" -H "Authorization: Bearer $STOKEN"
curl -s "$BASE/assets?per_page=2" -H "Authorization: Bearer $STOKEN" -H "Accept: application/json" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo "client lihat assets miliknya: ".count($d["data"]??[])." item, total ".($d["meta"]["total"]??"?")."\n";'

echo ""
echo "=== SELESAI ==="
