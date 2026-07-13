# TÀI LIỆU BÀN GIAO — DỰ ÁN WEBSITE KẾT NỐI SHOP

Website thương mại điện tử bán máy móc, thiết bị công nghiệp (máy khoan, thang nhôm…).
Kiến trúc **monorepo**: Backend NestJS + PostgreSQL/Prisma, Frontend Next.js, lưu ảnh MinIO.

> Cập nhật: giai đoạn hoàn thiện cửa hàng (storefront) chạy đầu-cuối với dữ liệu thật.

---

## 1. Tổng quan kiến trúc

```
Trình duyệt (khách)
      │  http://localhost:3000
┌─────▼─────────────┐        ┌──────────────────────┐
│  FRONTEND         │  gọi   │  BACKEND (API)        │
│  Next.js 16       │ ─────▶ │  NestJS 11            │
│  ketnoi-shop/web  │  REST  │  api/                 │
└───────────────────┘        └───────┬──────────────┘
                                      │ Prisma 7
                        ┌─────────────▼──────────────┐
                        │  PostgreSQL 16 (34 bảng)    │
                        │  MinIO (ảnh)  ·  Redis       │
                        │  (Docker Compose)            │
                        └─────────────────────────────┘
```

---

## 2. Cấu trúc thư mục

```
D:\duan\
├── api/                     # Backend NestJS
│   ├── prisma/
│   │   ├── schema.prisma    # 34 bảng
│   │   └── seed.ts          # Dữ liệu mẫu (10 sản phẩm)
│   ├── prisma.config.ts     # Cấu hình Prisma (khai lệnh seed)
│   ├── src/
│   │   ├── prisma/          # PrismaService (kết nối DB)
│   │   ├── categories/      # API danh mục
│   │   ├── brands/          # API thương hiệu
│   │   ├── products/        # API sản phẩm (lọc, phân trang, tìm kiếm, CRUD)
│   │   ├── uploads/         # API upload ảnh lên MinIO
│   │   ├── settings/        # API cấu hình hệ thống
│   │   ├── auth/            # Đăng ký / đăng nhập (JWT + bcrypt)
│   │   ├── orders/          # Đặt hàng, xem đơn
│   │   ├── app.module.ts    # Gom toàn bộ module
│   │   └── main.ts          # Khởi động, ValidationPipe, CORS, cổng 4000
│   └── .env                 # DATABASE_URL, MINIO_*, JWT_*
│
├── ketnoi-shop/
│   ├── docker-compose.yml   # postgres + redis + minio
│   └── web/                 # Frontend Next.js
│       ├── app/             # Các trang (App Router)
│       │   ├── page.tsx             # Trang chủ
│       │   ├── danh-muc/[slug]/     # Trang danh mục
│       │   ├── san-pham/[slug]/     # Chi tiết sản phẩm
│       │   ├── tim-kiem/            # Tìm kiếm
│       │   ├── gio-hang/            # Giỏ hàng
│       │   ├── dang-nhap/           # Đăng nhập / đăng ký
│       │   └── thanh-toan/          # Thanh toán (đặt hàng)
│       ├── components/      # Header, Footer, ProductCard, cart/…
│       ├── lib/             # api.ts, types.ts, format.ts, auth-client.ts
│       └── .env.local       # NEXT_PUBLIC_API_URL
│
└── docs/                    # Tài liệu bàn giao (thư mục này)
```

---

## 3. Yêu cầu cài đặt

- **Node.js** 18.17 trở lên (khuyến nghị 20+)
- **Docker Desktop** (chạy PostgreSQL, Redis, MinIO)
- Trình duyệt web

---

## 4. Cách chạy dự án (quan trọng)

Mở **2 cửa sổ Terminal**.

### Terminal 1 — Hạ tầng + Backend
```bat
:: 1) Bật database + MinIO
cd D:\duan\ketnoi-shop
docker compose up -d

:: 2) Cài thư viện + tạo bảng + nạp dữ liệu mẫu (chỉ lần đầu)
cd D:\duan\api
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

:: 3) Chạy API (cổng 4000)
npm run start:dev
```
Kiểm tra: mở http://localhost:4000/health → `{"status":"ok","database":"connected"}`

### Terminal 2 — Frontend
```bat
cd D:\duan\ketnoi-shop\web
npm install
npm run dev
```
Mở **http://localhost:3000**

> **Lưu ý:** Frontend cần Backend đang chạy. Nếu API tắt, trang vẫn mở nhưng hiện thông báo “Không kết nối được API”.

---

## 5. Biến môi trường

**api/.env**
| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` / `MINIO_PUBLIC_URL` | Cấu hình lưu ảnh MinIO |
| `JWT_SECRET` / `JWT_EXPIRES` | Ký & hạn token đăng nhập (⚠ đổi `JWT_SECRET` khi lên production) |

**ketnoi-shop/web/.env.local**
| Biến | Ý nghĩa |
|------|---------|
| `NEXT_PUBLIC_API_URL` | Địa chỉ API (mặc định `http://localhost:4000`) |

---

## 6. Tiến độ dự án

| Giai đoạn | Nội dung | Trạng thái |
|-----------|----------|------------|
| GĐ1 | Môi trường dev + monorepo (web + api) | ✅ Xong |
| GĐ2 | Database 34 bảng + seed dữ liệu mẫu | ✅ Xong |
| GĐ3 | Backend API: danh mục, thương hiệu, sản phẩm, upload ảnh, cấu hình, đăng nhập (JWT), đơn hàng | ✅ Xong phần lõi |
| GĐ4 | Frontend cửa hàng: trang chủ, danh mục, sản phẩm, tìm kiếm, giỏ hàng, đăng nhập, thanh toán | ✅ Xong |
| GĐ5a | Trang Admin — quản lý **đơn hàng** (trạng thái, thống kê) và **sản phẩm** (thêm/sửa/xóa, upload ảnh, thông số) | ✅ Xong |
| GĐ5b | SEO — metadata động (title/description/OpenGraph) cho trang sản phẩm & danh mục, dữ liệu có cấu trúc JSON-LD (Product), `sitemap.xml`, `robots.txt` | ✅ Xong |
| GĐ5c | Thanh toán: **COD** + **Chuyển khoản VietQR** (mã QR tự sinh theo đơn) + quản lý thanh toán trong Admin (đánh dấu đã nhận tiền) | ✅ Xong |
| GĐ5d | **Chuẩn bị triển khai**: CORS theo env, `api/Dockerfile`, `docker-compose.prod.yml` + Caddy (auto-SSL), mẫu `.env.prod`, và hướng dẫn deploy (`docs/03_HUONG_DAN_TRIEN_KHAI.md`) | ✅ Xong (chờ bạn chạy deploy bằng tài khoản của mình) |
| GĐ5e | Cổng thanh toán online VNPay/MoMo (cần tài khoản merchant), tìm kiếm Meilisearch | ⏳ Còn lại |

**Ước lượng: ~70–75% lộ trình.** Website đã chạy được đầu-cuối (duyệt hàng → giỏ → đăng ký → đặt đơn).

### Việc còn lại (đề xuất thứ tự)
1. **Trang Admin** — quản lý sản phẩm/đơn hàng qua giao diện (hiện quản trị tạm qua Prisma Studio hoặc gọi API).
2. **Thanh toán online** — tích hợp VNPay/MoMo (hiện đơn tạo ở trạng thái chờ, thanh toán COD).
3. **Tìm kiếm nâng cao** — Meilisearch cho gợi ý tức thì khi có nhiều sản phẩm.
4. **Nội dung & SEO** — sitemap.xml, robots.txt, dữ liệu JSON-LD, trang blog/chính sách.
5. **Triển khai** — Frontend lên Vercel, Backend + DB lên VPS/Railway.

---

## 6b. Trang Quản trị (Admin)

- **Truy cập:** http://localhost:3000/admin/dang-nhap
- **Tài khoản demo:** `admin@ketnoi.local` / `admin123` (đổi trong `api/.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- **Chức năng hiện có:**
  - *Đơn hàng* (`/admin/don-hang`): xem toàn bộ đơn, cập nhật trạng thái (Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn thành / Đã hủy), thống kê (tổng đơn, đơn chờ, doanh thu).
  - *Sản phẩm* (`/admin/san-pham`): danh sách, **thêm/sửa/xóa** sản phẩm với form đầy đủ (giá, danh mục, thương hiệu, **upload ảnh** lên MinIO, thông số kỹ thuật).
- **Bảo mật:** các API ghi sản phẩm (`POST/PATCH/DELETE /products`) đã yêu cầu token admin.
- ⚠ Đây là cơ chế demo (1 tài khoản qua biến môi trường). Production nên dùng bảng `users` + `roles` (RBAC) đã có sẵn trong schema.

## 7. Quản trị dữ liệu (tạm thời, khi chưa có trang Admin)

- **Prisma Studio** (xem/sửa bảng trực quan): trong `D:\duan\api` chạy `npx prisma studio` → http://localhost:5555
- **MinIO Console** (quản lý ảnh): http://localhost:9001 — đăng nhập `ketnoi` / `ketnoi_dev_2026`
- **Thêm/sửa sản phẩm qua API**: xem `02_API_REFERENCE.md`

---

## 8. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|------------|--------------------------|
| Mở **localhost:3000 không được** | Chưa chạy `npm run dev` trong `ketnoi-shop/web`; hoặc đang cài `npm install`. Xem log terminal. |
| Trang mở nhưng báo “Không kết nối được API” | Backend chưa chạy (`npm run start:dev` trong `api`) hoặc DB chưa bật. Kiểm tra http://localhost:4000/health |
| `P1001 Can't reach database` | Docker chưa bật: `docker compose up -d` tại `D:\duan\ketnoi-shop` |
| Trang sản phẩm trống | Chưa seed: `npx prisma db seed` trong `api` |
| Lỗi CORS trên trình duyệt | API chỉ cho phép origin `http://localhost:3000` (sửa trong `api/src/main.ts` nếu đổi cổng) |
| Ảnh không hiển thị | MinIO chưa bật, hoặc bucket `ketnoi-media` để private (đặt policy public-read trong MinIO Console) |
| Cổng 3000/4000 bị chiếm | Đóng tiến trình đang dùng cổng, hoặc đổi cổng (`PORT` cho API, `next dev -p` cho web) |

---

Xem thêm: **01_HUONG_DAN_SU_DUNG.md** (hướng dẫn sử dụng) và **02_API_REFERENCE.md** (danh sách API).
