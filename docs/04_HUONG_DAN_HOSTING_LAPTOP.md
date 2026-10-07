# HOSTING TRÊN LAPTOP QUA CLOUDFLARE TUNNEL — SWE PHÚ THỌ

Chạy backend (API + PostgreSQL + MinIO) ngay trên laptop cá nhân, đưa ra Internet
bằng **Cloudflare Tunnel** — không cần IP tĩnh, không cần mở port, không lo CGNAT,
có SSL miễn phí. Frontend vẫn deploy trên Vercel.

> Mọi lệnh dưới đây chạy **trong Ubuntu (WSL2)** trừ khi ghi rõ khác.

---

## 1. Chuẩn bị máy chạy 24/7
- Cắm dây LAN thay Wi-Fi cho ổn định.
- Control Panel → Power Options: đóng nắp = *Không làm gì*, không sleep, không tắt ổ khi cắm điện.
- Bật tự động đăng nhập Windows (để mất điện xong máy tự vào, Docker tự chạy lại).

## 2. Lấy code về
```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/skinnymant/ketnoi-shop.git
cd ketnoi-shop
```

## 3. Đưa tên miền về Cloudflare (miễn phí)
1. Tạo tài khoản **cloudflare.com** → *Add a site* → nhập tên miền.
2. Cloudflare cho 2 nameserver → vào **inet.vn** đổi nameserver sang 2 cái đó. Đợi vài giờ.

## 4. Tạo Cloudflare Tunnel (lấy TOKEN)
1. Vào **Cloudflare Zero Trust** (one.dash.cloudflare.com) → **Networks → Tunnels → Create a tunnel**.
2. Chọn loại **Cloudflared** → đặt tên (vd `swe-shop`) → **Save**.
3. Ở bước "Install connector", **copy đoạn TOKEN** (chuỗi rất dài sau `--token`). Dán vào `.env` ở mục CLOUDFLARE_TUNNEL_TOKEN.
4. Sang tab **Public Hostnames**, thêm 2 hostname (Type = HTTP):

   | Subdomain | Domain | Service (URL) |
   |-----------|--------|---------------|
   | `api`     | swevietnam.com | `http://api:4000` |
   | `media`   | swevietnam.com | `http://minio:9000` |

   > Dùng đúng tên service `api` và `minio` — đó là tên container trong mạng docker.

## 5. Tạo file .env
```bash
cp .env.laptop.example .env
nano .env      # điền hết: mật khẩu Postgres/MinIO, JWT_SECRET, ADMIN_*, domain, TOKEN
```
Sinh JWT_SECRET ngẫu nhiên: `openssl rand -hex 32`

## 6. Chạy stack
```bash
docker compose -f docker-compose.laptop.yml up -d --build
```
Xem log: `docker compose -f docker-compose.laptop.yml logs -f api`

## 7. Nạp dữ liệu (chỉ lần đầu)
```bash
docker compose -f docker-compose.laptop.yml exec api npx prisma db seed
```

## 8. Mở quyền đọc công khai cho bucket ảnh
```bash
docker compose -f docker-compose.laptop.yml exec minio \
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
docker compose -f docker-compose.laptop.yml exec minio \
  mc anonymous set download local/ketnoi-media
```
(Thay biến bằng giá trị thật nếu shell không tự đọc từ .env.)

## 9. Kiểm tra backend
Mở trình duyệt: `https://api.swevietnam.com/products?limit=1` → thấy JSON là OK.

## 10. Deploy frontend lên Vercel
- Import repo, Root Directory = `ketnoi-shop/web`.
- Env: `NEXT_PUBLIC_API_URL=https://api.swevietnam.com`,
        `NEXT_PUBLIC_SITE_URL=https://swevietnam.com`.
- Trong Cloudflare: bản ghi trỏ Vercel để **DNS only** (mây xám);
  `api`/`media` do tunnel tự tạo (mây cam).

## 11. (Tùy chọn) Ảnh thương hiệu cho 54 sản phẩm
Sau seed, sản phẩm dùng ảnh placeholder. Muốn có bộ ảnh thương hiệu SWE,
chạy lại script sinh ảnh trỏ vào API laptop (cần Python + Pillow). Nhờ trợ lý hỗ trợ.

## 12. Khi website báo "Không kết nối được tới API"
1. Mở **https://www.swevietnam.com/kiem-tra-api** — server Vercel tự gọi thử API và
   ghi **kết luận** (`ketLuan`) chỉ ra mắt xích bị đứt: laptop/tunnel, container api,
   Cloudflare chặn bot, hay thiếu `NEXT_PUBLIC_API_URL` trên Vercel.
2. Trên laptop (Ubuntu WSL), tại thư mục repo:
   ```bash
   bash scripts/kiem-tra-laptop.sh --fix
   ```
   Script kiểm tra lần lượt Docker → container → API → tunnel → Vercel, tự khởi động
   lại container bị dừng (`--fix`) và in gợi ý sửa ở mỗi mục ✘.
3. Sửa theo gợi ý ở mục ✘ **đầu tiên**, rồi chạy lại script tới khi tất cả ✔.
4. Nếu `/health` trả `{"ok":true,"service":"ketnoi-api",...}` và `/products` báo
   `Cannot GET` → cổng 4000 đang chạy **nhầm API của project khác**. Chạy:
   ```bash
   bash scripts/sua-api.sh
   ```
   Script liệt kê container, hỏi trước khi dừng container lạ (không xoá dữ liệu),
   build + chạy lại đúng API và tunnel, rồi kiểm tra lại toàn bộ.

Phòng ngừa: bật Docker Desktop → Settings → General → *Start Docker Desktop when you
sign in*; tạo monitor miễn phí (UptimeRobot) cho `https://api.swevietnam.com/health`.

> ⚠️ Image `minio/minio` đã bị gỡ khỏi Docker Hub — laptop hiện chạy được nhờ image
> có sẵn trong cache. **Đừng xoá image này** (`docker image prune -a`). Sao lưu phòng khi
> cần: `docker save minio/minio -o minio-image.tar` (khôi phục: `docker load -i minio-image.tar`).

---

## Checklist trước khi mở bán
- [ ] Đổi `ADMIN_PASSWORD`, `JWT_SECRET`, mật khẩu Postgres & MinIO (không dùng giá trị demo).
- [ ] Cập nhật thông tin VietQR thật (bank_code/bank_account/bank_name) trong Admin.
- [ ] Sao lưu DB định kỳ: `docker compose -f docker-compose.laptop.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`
- [ ] Khi có đơn đều đặn → cân nhắc chuyển sang VPS thật cho ổn định.
