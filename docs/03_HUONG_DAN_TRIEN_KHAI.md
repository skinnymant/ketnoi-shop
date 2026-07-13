# HƯỚNG DẪN TRIỂN KHAI (DEPLOY) — KẾT NỐI SHOP

Tài liệu này hướng dẫn đưa website lên Internet với tên miền + HTTPS.

> **Lưu ý:** các bước tạo tài khoản, mua tên miền, nạp tiền dịch vụ và trỏ DNS **bạn phải tự thực hiện** bằng tài khoản của mình. Tài liệu này cung cấp toàn bộ cấu hình + lệnh cần chạy.

---

## 0. Kiến trúc khi chạy thật

```
Người dùng
  │ https://yourdomain.com
  ▼
Vercel (Frontend Next.js)  ──►  https://api.yourdomain.com  (Backend NestJS)
                                       │
                          PostgreSQL · MinIO (ảnh) · Redis
```
- **Frontend** → deploy lên **Vercel** (miễn phí, tự có SSL, CDN).
- **Backend + PostgreSQL + MinIO** → **1 trong 2 cách**:
  - **Cách A — VPS + Docker** (khuyến nghị, kiểm soát toàn bộ, có sẵn MinIO). Sổ tay dưới đây.
  - **Cách B — Railway** (dễ nhất, không cần quản trị server; ảnh dùng dịch vụ S3 ngoài).

**Cần chuẩn bị:** 1 tên miền (VD mua ở Namecheap/Tenten/Mắt Bão), tài khoản Vercel, và (Cách A) 1 VPS Ubuntu (VD DigitalOcean/Vultr/Hetzner, ~5–10$/tháng) **hoặc** (Cách B) tài khoản Railway.

---

## 1. FRONTEND — Vercel (dùng cho cả 2 cách)

1. Đưa code lên GitHub (nếu chưa): repo chứa thư mục `ketnoi-shop/web`.
2. Vào **vercel.com** → **Add New Project** → chọn repo.
3. **Root Directory**: chọn `ketnoi-shop/web`.
4. **Environment Variables** (lấy mẫu từ `ketnoi-shop/web/.env.production.example`):
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
5. **Deploy**. Sau đó vào **Settings → Domains** thêm `yourdomain.com` và làm theo hướng dẫn trỏ DNS (Vercel tự cấp SSL).

> Deploy backend TRƯỚC (mục 2) để có `api.yourdomain.com`, rồi mới điền vào biến ở trên.

---

## 2A. BACKEND — Cách A: VPS + Docker (khuyến nghị)

**Chuẩn bị VPS:** Ubuntu 22.04, cài Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

**Trỏ DNS (A record) về IP của VPS:**
| Bản ghi | Trỏ tới |
|---------|---------|
| `api.yourdomain.com` | IP VPS |
| `media.yourdomain.com` | IP VPS |

**Đưa code lên VPS** (git clone hoặc scp thư mục `D:\duan`). Trong thư mục dự án:

1. Sửa `Caddyfile`: thay `yourdomain.com` bằng tên miền thật.
2. Tạo file `.env` từ mẫu và điền giá trị thật (đổi hết mật khẩu):
   ```bash
   cp .env.prod.example .env
   nano .env        # điền POSTGRES_*, MINIO_*, JWT_SECRET, ADMIN_*, CORS_ORIGINS, MINIO_PUBLIC_URL
   ```
   - `JWT_SECRET`: sinh chuỗi ngẫu nhiên: `openssl rand -hex 32`
   - `CORS_ORIGINS`: `https://yourdomain.com`
   - `MINIO_PUBLIC_URL`: `https://media.yourdomain.com`
3. Khởi chạy:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   (Container `api` tự chạy `prisma migrate deploy` khi khởi động → tạo 34 bảng.)
4. **Nạp dữ liệu ban đầu** (chỉ lần đầu — xem mục 4).

Caddy sẽ tự xin SSL Let's Encrypt cho `api.` và `media.`. Kiểm tra: `https://api.yourdomain.com/health` → `{"status":"ok",...}`.

---

## 2B. BACKEND — Cách B: Railway (không cần server)

1. **railway.app** → New Project → **Deploy from GitHub** → chọn repo, service root = `api`.
2. Thêm plugin **PostgreSQL** (Railway tạo sẵn `DATABASE_URL`).
3. **Object storage (ảnh):** Railway không có MinIO. Vì code dùng chuẩn S3 (`@aws-sdk/client-s3`), hãy dùng **Cloudflare R2** hoặc **AWS S3** (đều S3-compatible), rồi điền biến `MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY / MINIO_BUCKET / MINIO_PUBLIC_URL` tương ứng.
4. **Variables** cho service `api`: `JWT_SECRET`, `JWT_EXPIRES`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS=https://yourdomain.com`, và các biến MinIO/S3 ở trên. (`DATABASE_URL` Railway tự có.)
5. **Build/Start**: Railway tự nhận Dockerfile trong `api/` → build + chạy (CMD tự migrate). Gán domain `api.yourdomain.com` trong Settings → Networking.

---

## 3. Tên miền & SSL — tóm tắt
- **Frontend** (`yourdomain.com`): trỏ theo hướng dẫn Vercel; SSL tự động.
- **Backend** (`api.yourdomain.com`) + **ảnh** (`media.yourdomain.com`):
  - Cách A: Caddy tự cấp SSL (không cần làm gì thêm ngoài trỏ DNS).
  - Cách B: Railway cấp SSL tự động khi gán domain.

---

## 4. Sau khi deploy (chạy 1 lần)

**Nạp danh mục/thương hiệu/cấu hình mẫu** (tùy chọn — hoặc nhập dữ liệu thật):
```bash
# Cách A (VPS):
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```
**Cấu hình thật** (sửa trong Admin hoặc Prisma Studio / API `PUT /settings/:key`):
- `hotline_hcm`, `hotline_hn`, `gio_lam_viec`, `nguong_freeship`
- `bank_code`, `bank_account`, `bank_name` (thông tin chuyển khoản VietQR thật)

**Tạo bucket ảnh** (nếu MinIO chưa tự tạo): API tự tạo bucket `ketnoi-media` khi khởi động; nếu ảnh mở ra bị 403 → đặt policy public-read cho bucket trong MinIO Console.

---

## 5. ✅ Checklist bảo mật TRƯỚC khi mở cho khách

- [ ] Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài (không dùng giá trị demo).
- [ ] Đổi `ADMIN_PASSWORD` (không để `admin123`).
- [ ] `CORS_ORIGINS` chỉ chứa domain thật (không để `localhost`).
- [ ] Đổi toàn bộ mật khẩu PostgreSQL & MinIO.
- [ ] Không commit file `.env` lên Git (đã có trong `.gitignore`).
- [ ] Bật sao lưu định kỳ PostgreSQL (VD `pg_dump` cron, hoặc backup của Railway).
- [ ] (Khuyến nghị) bảo vệ endpoint `POST /uploads/image` bằng token admin — hiện đang mở.

---

## 6. Chi phí tham khảo (ước lượng)
- Vercel Frontend: **miễn phí** (Hobby).
- VPS (Cách A): ~**5–10 USD/tháng**.
- Railway (Cách B): có gói dùng thử; sau đó tính theo mức dùng.
- Tên miền: ~**10–15 USD/năm**.
- Cloudflare R2 (nếu dùng): gần như miễn phí ở mức nhỏ.

---

## 7. Cập nhật phiên bản sau này
- **Frontend:** push code lên GitHub → Vercel tự build lại.
- **Backend (Cách A):** `git pull` trên VPS rồi `docker compose -f docker-compose.prod.yml up -d --build`.
- **Đổi schema DB:** tạo migration ở máy dev (`npx prisma migrate dev`), commit, deploy — container tự chạy `migrate deploy`.
