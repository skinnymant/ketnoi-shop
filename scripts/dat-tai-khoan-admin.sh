#!/usr/bin/env bash
# ============================================================
# Chẩn đoán + đặt lại tài khoản quản trị (trang /admin) trên laptop.
# Chạy trong Ubuntu (WSL2) tại thư mục gốc repo:
#   bash scripts/dat-tai-khoan-admin.sh
#
# - Kiểm tra ADMIN_EMAIL / ADMIN_PASSWORD trong .env (trống? còn giá trị mẫu?)
# - Kiểm tra container api có đang dùng đúng giá trị trong .env không
#   (sửa .env mà chưa tạo lại container → vẫn bị 401)
# - Cho đặt mật khẩu mới (gõ ẩn hoặc tự sinh), sao lưu .env, tạo lại container
#   api rồi thử đăng nhập thật. Mật khẩu KHÔNG được in ra (trừ khi tự sinh).
# ============================================================
set -u
cd "$(dirname "$0")/.." || exit 1
COMPOSE_FILE="docker-compose.laptop.yml"
API_LOCAL="http://localhost:4000"
API_PUBLIC="${API_PUBLIC:-https://api.swevietnam.com}"
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✔ %s\033[0m\n' "$*"; }
bad() { printf '  \033[31m✘ %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }

docker info >/dev/null 2>&1 || { echo "Docker chưa chạy — mở Docker Desktop rồi chạy lại."; exit 1; }
[ -f .env ] || { echo "Thiếu file .env (cp .env.laptop.example .env rồi điền)."; exit 1; }

# Đọc giá trị trong .env (bỏ dấu nháy bao quanh nếu có)
envval() { grep "^$1=" .env | tail -1 | cut -d= -f2- | sed -e "s/^'\(.*\)'\$/\1/" -e 's/^"\(.*\)"$/\1/'; }
sha() { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }
is2xx() { case "$1" in 2??) return 0 ;; esac; return 1; } # NestJS trả 201 cho POST thành công

# Gửi thử đăng nhập, in mã HTTP (không in token)
try_login() { # $1=url $2=email $3=password
  local esc_e esc_p
  esc_e=$(printf '%s' "$2" | sed 's/\\/\\\\/g; s/"/\\"/g')
  esc_p=$(printf '%s' "$3" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"email":"%s","password":"%s"}' "$esc_e" "$esc_p" |
    curl -s -m 15 -o /dev/null -w '%{http_code}' -X POST "$1/admin/auth/login" \
      -H 'Content-Type: application/json' --data-binary @-
}

# ---------- 1. Kiểm tra .env ----------
say "1. Tài khoản admin trong .env"
EMAIL=$(envval ADMIN_EMAIL)
PASS=$(envval ADMIN_PASSWORD)
PROBLEM=0
if [ -z "$EMAIL" ]; then bad "ADMIN_EMAIL đang trống/thiếu"; PROBLEM=1; else ok "ADMIN_EMAIL = $EMAIL"; fi
case "$PASS" in
  "") bad "ADMIN_PASSWORD đang trống/thiếu"; PROBLEM=1 ;;
  DOI_MAT_KHAU_ADMIN_MANH|DOI_MAT_KHAU_ADMIN|admin123)
      bad "ADMIN_PASSWORD còn là giá trị MẪU — ai đọc repo public cũng biết"; PROBLEM=1 ;;
  *) if [ ${#PASS} -lt 12 ]; then bad "ADMIN_PASSWORD ngắn (${#PASS} ký tự) — nên ≥ 12"; PROBLEM=1;
     else ok "ADMIN_PASSWORD đã đặt (${#PASS} ký tự)"; fi ;;
esac

# ---------- 2. Container có dùng đúng giá trị không ----------
say "2. Container api đang dùng giá trị nào"
if [ -z "$(dc ps -q api </dev/null 2>/dev/null)" ]; then
  bad "Container api không chạy"; PROBLEM=1
else
  # </dev/null: không để docker "nuốt" phần trả lời bạn gõ cho các câu hỏi sau
  C_EMAIL=$(dc exec -T api printenv ADMIN_EMAIL </dev/null 2>/dev/null)
  C_HASH=$(dc exec -T api sh -c 'printf %s "$ADMIN_PASSWORD" | sha256sum' </dev/null 2>/dev/null | cut -d' ' -f1)
  if [ "$C_EMAIL" = "$EMAIL" ] && [ "$C_HASH" = "$(sha "$PASS")" ]; then
    ok "Container khớp với .env"
  else
    bad "Container KHÔNG khớp .env (đã sửa .env nhưng chưa tạo lại container)"
    info "Email trong container: ${C_EMAIL:-<trống>}"
    PROBLEM=1
  fi
  if [ -n "$EMAIL" ] && [ -n "$PASS" ]; then
    code=$(try_login "$API_LOCAL" "$EMAIL" "$PASS")
    if is2xx "$code"; then ok "Đăng nhập thử bằng giá trị .env → $code (thành công)"
    else bad "Đăng nhập thử bằng giá trị .env → $code"; PROBLEM=1; fi
  fi
fi

# ---------- 3. Đặt lại ----------
say "3. Đặt lại tài khoản admin"
if [ "$PROBLEM" = 0 ]; then
  read -r -p "  Mọi thứ đang đúng. Vẫn muốn đổi mật khẩu? [y/N] " a
  [ "$a" = y ] || [ "$a" = Y ] || { echo; echo "Đăng nhập tại: https://www.swevietnam.com/admin/dang-nhap  (email: $EMAIL)"; exit 0; }
fi

read -r -p "  Email admin [${EMAIL:-admin@swevietnam.com}]: " NEW_EMAIL
NEW_EMAIL=${NEW_EMAIL:-${EMAIL:-admin@swevietnam.com}}
case "$NEW_EMAIL" in *@*.*) ;; *) echo "  Email không hợp lệ."; exit 1 ;; esac

GENERATED=0
read -r -p "  Tự sinh mật khẩu mạnh? [Y/n] " g
if [ "$g" = n ] || [ "$g" = N ]; then
  while :; do
    read -r -s -p "  Mật khẩu mới (≥ 12 ký tự, không dấu nháy đơn): " P1 || { echo; echo "  Đã huỷ."; exit 1; }; echo
    read -r -s -p "  Nhập lại: " P2 || { echo; echo "  Đã huỷ."; exit 1; }; echo
    if [ "$P1" != "$P2" ]; then echo "  Hai lần nhập không khớp."; continue; fi
    if [ ${#P1} -lt 12 ]; then echo "  Quá ngắn."; continue; fi
    case "$P1" in *"'"*) echo "  Không dùng dấu nháy đơn (')."; continue ;; esac
    case "$P1" in DOI_MAT_KHAU*|admin123) echo "  Không dùng giá trị mẫu."; continue ;; esac
    break
  done
  NEW_PASS=$P1
else
  NEW_PASS=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20)
  GENERATED=1
fi

# Ghi .env: sao lưu, bỏ dòng ADMIN_* cũ, thêm dòng mới (nháy đơn = giữ nguyên ký tự)
BAK=".env.bak-$(date +%Y%m%d-%H%M%S)"
cp .env "$BAK" && chmod 600 "$BAK"
{ grep -v -e '^ADMIN_EMAIL=' -e '^ADMIN_PASSWORD=' "$BAK"
  printf "ADMIN_EMAIL=%s\n" "$NEW_EMAIL"
  printf "ADMIN_PASSWORD='%s'\n" "$NEW_PASS"
} > .env
chmod 600 .env
ok "Đã cập nhật .env (bản cũ: $BAK)"

say "4. Tạo lại container api để nhận mật khẩu mới"
dc up -d --force-recreate --no-deps api </dev/null || { bad "Không tạo lại được container"; exit 1; }
for _ in $(seq 1 24); do
  curl -fsS -m 3 "$API_LOCAL/health" 2>/dev/null | grep -q '"database":"connected"' && break
  sleep 5
done

say "5. Thử đăng nhập"
code=$(try_login "$API_LOCAL" "$NEW_EMAIL" "$NEW_PASS")
if is2xx "$code"; then ok "API trên laptop → $code (đăng nhập thành công)"
else bad "API trên laptop → $code (xem: docker compose -f $COMPOSE_FILE logs --tail=30 api)"; fi
code=$(try_login "$API_PUBLIC" "$NEW_EMAIL" "$NEW_PASS")
if is2xx "$code"; then ok "$API_PUBLIC → $code (đăng nhập thành công)"
else bad "$API_PUBLIC → $code (tunnel chưa trỏ đúng container? chạy scripts/kiem-tra-laptop.sh)"; fi

echo
echo "Đăng nhập tại: https://www.swevietnam.com/admin/dang-nhap"
echo "  Email:    $NEW_EMAIL"
if [ "$GENERATED" = 1 ]; then
  echo "  Mật khẩu: $NEW_PASS"
  echo "  → Lưu vào trình quản lý mật khẩu NGAY, rồi xoá màn hình (lệnh: clear)."
else
  echo "  Mật khẩu: (mật khẩu bạn vừa nhập)"
fi
echo "Không gửi mật khẩu qua chat/email. Xoá bản sao lưu khi không cần: rm $BAK"
