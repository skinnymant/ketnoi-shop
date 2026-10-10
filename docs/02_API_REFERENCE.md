# DANH SÁCH API — KẾT NỐI SHOP

Base URL: `http://localhost:4000`
Định dạng: JSON. Các endpoint có 🔒 cần header `Authorization: Bearer <accessToken>`.

> Ghi chú: giá (`price`, `salePrice`, `total`…) trả về dạng **chuỗi** (Decimal) để không mất chính xác — frontend tự `Number()` khi hiển thị.

---

## Sức khỏe hệ thống
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/health` | Kiểm tra API + kết nối DB |

## Danh mục — `/categories`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/categories` | Cây danh mục (3 cấp) cho menu |
| GET | `/categories/:slug` | 1 danh mục + danh mục con + cha |
| POST | `/categories` | Tạo danh mục |
| PATCH | `/categories/:id` | Sửa danh mục |
| DELETE | `/categories/:id` | Xóa mềm |

## Thương hiệu — `/brands`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/brands` | Danh sách thương hiệu |
| GET | `/brands/:slug` | Chi tiết 1 thương hiệu |
| POST / PATCH `/:id` / DELETE `/:id` | | Tạo / sửa / xóa mềm |

## Sản phẩm — `/products`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/products` | Danh sách có **lọc / phân trang / sắp xếp / tìm kiếm** |
| GET | `/products/:slug` | Chi tiết sản phẩm (ảnh, thông số, tồn kho, đánh giá) |
| POST 🔒admin | `/products` | Tạo sản phẩm (kèm ảnh + thông số) |
| PATCH 🔒admin | `/products/:id` | Sửa sản phẩm |
| DELETE 🔒admin | `/products/:id` | Xóa mềm |

**Tham số lọc cho `GET /products`** (query string):
`category` (slug), `brand` (slug), `minPrice`, `maxPrice`, `search`, `spec` (dạng `Điện áp:18V`), `sort` (`newest`|`price_asc`|`price_desc`|`best_selling`), `page`, `limit`.
Ví dụ: `/products?category=may-khoan-pin&brand=makita&sort=price_asc&page=1&limit=12`
Trả về: `{ data: [...], meta: { total, page, limit, totalPages } }`

## Upload ảnh — `/uploads`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| POST | `/uploads/image` | `multipart/form-data`, field **`file`**, ảnh ≤ 5MB → trả `{ url, key, size }` |

## Cấu hình — `/settings`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/settings` | Toàn bộ cấu hình dạng `{ key: value }` |
| GET | `/settings/:key` | 1 cấu hình |
| PUT | `/settings/:key` | Tạo/cập nhật, body `{ "value": "..." }` |
| DELETE | `/settings/:key` | Xóa |

## Đăng nhập — `/auth`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| POST | `/auth/register` | Đăng ký. Body: `{ fullName, password, email? , phone? }` (cần email HOẶC phone) |
| POST | `/auth/login` | Đăng nhập. Body: `{ emailOrPhone, password }` |
| GET 🔒 | `/auth/me` | Thông tin tài khoản hiện tại |

Cả register/login trả về: `{ accessToken, customer: { id, fullName, email, phone, membershipTier } }`

## Đơn hàng — `/orders` 🔒
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| POST | `/orders` | Đặt hàng |
| GET | `/orders` | Danh sách đơn của tôi |
| GET | `/orders/:code` | Chi tiết 1 đơn theo mã |

**Body cho `POST /orders`:**
```json
{
  "receiverName": "Nguyễn Văn A",
  "receiverPhone": "0900123456",
  "receiverEmail": "a@example.com",
  "shippingAddress": "123 Lê Lợi, Q1, TP.HCM",
  "note": "Giao giờ hành chính",
  "items": [ { "productId": "<uuid>", "quantity": 2 } ]
}
```
Hệ thống tự tính `subtotal`, `shippingFee` (miễn phí nếu đạt ngưỡng freeship), `total`, sinh `orderCode` (VD `KN20260705-1234`) và **đóng băng** tên + giá sản phẩm tại thời điểm đặt.

## Quản trị — `/admin`
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| POST | `/admin/auth/login` | Đăng nhập admin. Body: `{ email, password }` → `{ accessToken, admin }` |
| GET 🔒admin | `/admin/stats` | Thống kê: tổng đơn, đơn chờ, doanh thu |
| GET 🔒admin | `/admin/orders` | Toàn bộ đơn hàng (kèm items + khách) |
| GET 🔒admin | `/admin/orders/:code` | Chi tiết 1 đơn |
| PATCH 🔒admin | `/admin/orders/:code/status` | Cập nhật trạng thái đơn. Body: `{ "status": "CONFIRMED" }` |
| PATCH 🔒admin | `/admin/orders/:code/payment` | Cập nhật trạng thái thanh toán. Body: `{ "status": "PAID" }` |

> Khi đặt hàng, gửi thêm `"paymentMethod": "COD"` hoặc `"BANK_TRANSFER"` trong body `POST /orders` (mặc định COD). Mỗi đơn tự tạo 1 bản ghi `Payment`. Thông tin ngân hàng cho VietQR lưu ở `settings` (keys: `bank_code`, `bank_account`, `bank_name`).

🔒admin = cần Bearer token lấy từ `/admin/auth/login`. Trạng thái hợp lệ: `PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`.

---

## Ví dụ nhanh (PowerShell)

```powershell
# Đăng ký -> lấy token
$r = Invoke-RestMethod http://localhost:4000/auth/register -Method Post `
  -ContentType "application/json" `
  -Body '{"fullName":"Tung","phone":"0900123456","password":"123456"}'

# Lấy 1 productId từ danh sách
$pid = (Invoke-RestMethod "http://localhost:4000/products?limit=1").data[0].id

# Đặt hàng
Invoke-RestMethod http://localhost:4000/orders -Method Post `
  -Headers @{ Authorization = "Bearer $($r.accessToken)" } `
  -ContentType "application/json" `
  -Body (@{
    receiverName="Tung"; receiverPhone="0900123456";
    shippingAddress="123 Le Loi, Q1, HCM";
    items=@(@{ productId=$pid; quantity=2 })
  } | ConvertTo-Json)
```
