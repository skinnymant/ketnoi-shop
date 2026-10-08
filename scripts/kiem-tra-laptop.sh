#!/usr/bin/env bash
# ============================================================
# Tự kiểm tra toàn bộ đường đi: Docker → API → Cloudflare Tunnel → Vercel.
# Chạy trong Ubuntu (WSL2) tại thư mục gốc repo:
#   bash scripts/kiem-tra-laptop.sh          # chỉ kiểm tra
#   bash scripts/kiem-tra-laptop.sh --fix    # kiểm tra + tự khởi động lại container hỏng
# Đổi domain nếu cần:  API_URL=https://api.xxx SITE_URL=https://www.xxx bash scripts/...
# ============================================================
set -u

COMPOSE_FILE="docker-compose.laptop.yml"
API_URL="${API_URL:-https://api.swevietnam.com}"
SITE_URL="${SITE_URL:-https://www.swevietnam.com}"
FIX=0
[ "${1:-}" = "--fix" ] && FIX=1

ok()   { printf '  \033[32m✔ %s\033[0m\n' "$*"; }
bad()  { printf '  \033[31m✘ %s\033[0m\n' "$*"; LOI=$((LOI + 1)); }
hint() { printf '    → %s\n' "$*"; }
step() { printf '\n\033[1m[%s] %s\033[0m\n' "$1" "$2"; }
LOI=0

cd "$(dirname "$0")/.." || exit 1
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# ---------- 1. Docker ----------
step 1 "Docker có đang chạy không"
if ! docker info >/dev/null 2>&1; then
  bad "Không kết nối được Docker"
  hint "Mở Docker Desktop trên Windows, đợi biểu tượng cá voi đứng yên rồi chạy lại script."
  hint "Bật Docker Desktop → Settings → General → 'Start Docker Desktop when you sign in'."
  exit 1
fi
ok "Docker đang chạy"
[ -f .env ] || { bad "Thiếu file .env (cp .env.laptop.example .env rồi điền giá trị)"; exit 1; }

# ---------- 2. Container ----------
step 2 "Trạng thái container"
CAN_FIX=0
for svc in postgres minio api cloudflared; do
  state=$(dc ps --format '{{.State}} {{.Health}}' "$svc" 2>/dev/null | head -1)
  case "$state" in
    "running unhealthy"*) bad "$svc: running nhưng UNHEALTHY"; CAN_FIX=1 ;;
    running*)             ok  "$svc: $state" ;;
    "")                   bad "$svc: không chạy"; CAN_FIX=1 ;;
    *)                    bad "$svc: $state"; CAN_FIX=1 ;;
  esac
done
if [ "$CAN_FIX" = 1 ]; then
  if [ "$FIX" = 1 ]; then
    hint "Đang khởi động lại stack..."
    dc up -d
    hint "Đợi API khởi động (tối đa 90s)..."
    for _ in $(seq 1 18); do
      curl -fsS -m 3 http://localhost:4000/health >/dev/null 2>&1 && break
      sleep 5
    done
  else
    hint "Chạy lại với --fix để tự khởi động, hoặc: docker compose -f $COMPOSE_FILE up -d"
  fi
fi

# ---------- 3. API trên laptop ----------
step 3 "API trên laptop (http://localhost:4000)"
health=$(curl -sS -m 8 http://localhost:4000/health 2>&1)
if echo "$health" | grep -q '"database":"connected"'; then
  ok "/health: $health"
else
  bad "/health lỗi: ${health:0:200}"
  if echo "$health" | grep -q '"ok":true'; then
    hint "Cổng 4000 đang chạy NHẦM một API khác (không phải NestJS của repo này)."
    hint "Chạy: bash scripts/sua-api.sh"
  fi
  hint "10 dòng log cuối của api:"
  dc logs --tail=10 api 2>&1 | sed 's/^/      /'
fi
products=$(curl -sS -m 8 "http://localhost:4000/products?limit=1" 2>&1)
total=$(echo "$products" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$total" ] && [ "$total" -gt 0 ]; then
  ok "/products: có $total sản phẩm"
elif [ "$total" = "0" ]; then
  bad "/products trả 0 sản phẩm — DB chưa seed"
  hint "docker compose -f $COMPOSE_FILE exec api npx prisma db seed"
else
  bad "/products lỗi: ${products:0:200}"
fi

# ---------- 4. Cloudflare Tunnel ----------
step 4 "Cloudflare Tunnel ($API_URL)"
body=$(curl -sS -m 15 -w '\n%{http_code}' "$API_URL/health" 2>&1)
code=$(echo "$body" | tail -1)
body=$(echo "$body" | sed '$d')
case "$code" in
  200) ok "$API_URL/health → 200" ;;
  530) bad "$API_URL → 530 (Error 1033: tunnel không kết nối)"
       hint "Container cloudflared không chạy hoặc token sai." ;;
  502|504) bad "$API_URL → $code (tunnel tới được nhưng không gọi được api)"
       hint "Zero Trust → Tunnels → Public Hostnames: 'api' phải trỏ tới http://api:4000" ;;
  403|503) bad "$API_URL → $code (Cloudflare chặn / bắt xác minh bot)"
       hint "Cloudflare → Security → Bots: tắt Bot Fight Mode cho domain." ;;
  000) bad "Không kết nối được $API_URL: ${body:0:150}"
       hint "Kiểm tra DNS 'api' trong Cloudflare (phải là bản ghi Tunnel, mây cam)." ;;
  *)   bad "$API_URL/health → HTTP $code: ${body:0:150}" ;;
esac
# Chỉ xem log khi tunnel lỗi — lỗi cũ lúc container api đang khởi động lại
# (connection refused vài giây) không phải vấn đề.
if [ "$code" != 200 ]; then
  tun_err=$(dc logs --since=10m cloudflared 2>&1 | grep -iE 'ERR|error|unauthorized|failed' | tail -3)
  if [ -n "$tun_err" ]; then
    hint "Log cloudflared gần đây:"
    echo "$tun_err" | sed 's/^/      /'
  fi
fi

# ---------- 5. Vercel (frontend) ----------
step 5 "Frontend Vercel gọi API ($SITE_URL/kiem-tra-api)"
diag=$(curl -sS -m 25 "$SITE_URL/kiem-tra-api" 2>&1)
if echo "$diag" | grep -q '"ketLuan"'; then
  ketluan=$(echo "$diag" | sed -n 's/.*"ketLuan":"\([^"]*\)".*/\1/p')
  apibase=$(echo "$diag" | sed -n 's/.*"apiBase":"\([^"]*\)".*/\1/p')
  echo "    apiBase trên Vercel: $apibase"
  if echo "$diag" | grep -q '"health":{[^}]*"ok":true'; then
    ok "Vercel gọi được API. $ketluan"
  else
    bad "Vercel KHÔNG gọi được API."
    hint "$ketluan"
  fi
else
  bad "Chưa mở được $SITE_URL/kiem-tra-api (Vercel chưa deploy bản mới?)"
  hint "Mở thủ công trên trình duyệt sau khi Vercel deploy xong."
fi

# ---------- Kết luận ----------
printf '\n'
if [ "$LOI" = 0 ]; then
  printf '\033[32m✔ Tất cả đều ổn — website phải hoạt động bình thường.\033[0m\n'
else
  printf '\033[31m✘ Có %d vấn đề. Sửa theo gợi ý (→) ở mục ✘ ĐẦU TIÊN rồi chạy lại.\033[0m\n' "$LOI"
fi
