#!/usr/bin/env bash
# ============================================================
# Sửa lỗi "API chạy nhầm": dừng container lạ đang chiếm cổng 4000 / tunnel,
# build + chạy lại đúng API NestJS của repo này, rồi kiểm tra lại toàn bộ.
# Chạy trong Ubuntu (WSL2) tại thư mục gốc repo:
#   bash scripts/sua-api.sh
# Mọi thao tác dừng container đều hỏi xác nhận trước. Không xoá volume/dữ liệu.
# ============================================================
set -u
cd "$(dirname "$0")/.." || exit 1
HERE=$(pwd -P)
COMPOSE_FILE="docker-compose.laptop.yml"
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ask() { read -r -p "$1 [y/N] " a; [ "$a" = y ] || [ "$a" = Y ]; }

docker info >/dev/null 2>&1 || { echo "Docker chưa chạy — mở Docker Desktop rồi chạy lại."; exit 1; }
[ -f .env ] || { echo "Thiếu .env (cp .env.laptop.example .env rồi điền)."; exit 1; }

# ---------- 1. Liệt kê container ----------
say "1. Container đang chạy và thư mục gốc của chúng"
docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Label "com.docker.compose.project.working_dir"}}' |
  awk -F'\t' '{printf "  %-28s %-38s %s\n", $2, substr($3,1,38), ($4==""?"(không thuộc compose)":$4)}'

# Container "lạ": chiếm cổng 4000, tên ketnoi-api, hoặc là cloudflared —
# nhưng KHÔNG được tạo từ thư mục repo này.
LA=""
for id in $(docker ps -q); do
  name=$(docker inspect -f '{{.Name}}' "$id" | sed 's#^/##')
  wd=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$id")
  ports=$(docker port "$id" 2>/dev/null)
  image=$(docker inspect -f '{{.Config.Image}}' "$id")
  [ -n "$wd" ] && [ "$(cd "$wd" 2>/dev/null && pwd -P)" = "$HERE" ] && continue
  if echo "$ports" | grep -q ':4000$' || [ "$name" = ketnoi-api ] || echo "$image" | grep -q cloudflared; then
    LA="$LA $id"
    echo "  → Container lạ: $name  (image: $image, thư mục: ${wd:-không rõ})"
  fi
done

# ---------- 2. Dừng container lạ ----------
say "2. Dừng container lạ"
if [ -z "$LA" ]; then
  echo "  Không có container lạ."
else
  if ask "  Dừng các container lạ ở trên? (chỉ dừng, không xoá dữ liệu)"; then
    # shellcheck disable=SC2086
    docker stop $LA >/dev/null && echo "  Đã dừng."
    # Tắt tự khởi động lại để chúng không quay lại khi Docker restart
    # shellcheck disable=SC2086
    docker update --restart=no $LA >/dev/null 2>&1
  else
    echo "  Bỏ qua — API đúng sẽ không chạy được nếu cổng 4000 còn bị chiếm."
  fi
fi

# ---------- 3. Build + chạy lại đúng API ----------
say "3. Build và chạy lại API + tunnel của repo này"
dc up -d --build --force-recreate api cloudflared || { echo "  Lỗi khi khởi động — xem thông báo ở trên."; exit 1; }
echo "  Đợi API sẵn sàng (tối đa 2 phút)..."
ok=0
for _ in $(seq 1 24); do
  if curl -fsS -m 3 http://localhost:4000/health 2>/dev/null | grep -q '"database":"connected"'; then ok=1; break; fi
  sleep 5
done
if [ "$ok" != 1 ]; then
  echo "  API chưa lên. 30 dòng log cuối:"; dc logs --tail=30 api; exit 1
fi
echo "  API đúng đã chạy: $(curl -sS http://localhost:4000/health)"

# ---------- 4. Dữ liệu ----------
say "4. Kiểm tra dữ liệu"
total=$(curl -sS "http://localhost:4000/products?limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2)
echo "  Số sản phẩm: ${total:-?}"
if [ "${total:-}" = 0 ]; then
  echo "  DB trống. Lưu ý: seed XOÁ toàn bộ sản phẩm/đơn hàng hiện có rồi nạp dữ liệu mẫu."
  ask "  Nạp dữ liệu mẫu (seed)?" && dc exec api npx prisma db seed
fi

# ---------- 5. Kiểm tra tổng thể ----------
say "5. Kiểm tra tổng thể"
bash scripts/kiem-tra-laptop.sh
