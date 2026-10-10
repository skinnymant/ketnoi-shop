# HƯỚNG DẪN SỬ DỤNG — KẾT NỐI SHOP

Tài liệu dành cho **người dùng cuối (khách mua)** và **người quản trị** ở mức cơ bản.

---

## A. Dành cho khách mua hàng

### 1. Trang chủ (`/`)
- Banner giới thiệu, danh sách **danh mục**, và các **sản phẩm bán chạy**.
- Bấm vào tên danh mục hoặc thẻ sản phẩm để xem chi tiết.

### 2. Thanh tìm kiếm (trên cùng)
- Gõ từ khóa (VD: “khoan”, “thang”, “makita”) → Enter → ra trang kết quả.

### 3. Trang danh mục (`/danh-muc/...`)
- Xem tất cả sản phẩm trong danh mục (gồm cả danh mục con).
- **Sắp xếp**: Mới nhất / Bán chạy / Giá thấp→cao / Giá cao→thấp.
- **Phân trang**: chọn số trang ở cuối danh sách.

### 4. Trang sản phẩm (`/san-pham/...`)
- Xem ảnh, giá (kèm % giảm nếu có), thông số kỹ thuật, tình trạng còn hàng, mô tả và đánh giá.
- Chọn **số lượng** rồi bấm **“Thêm vào giỏ”**.

### 5. Giỏ hàng (`/gio-hang`)
- Xem lại sản phẩm đã thêm, tăng/giảm số lượng, xóa món, xem **tạm tính**.
- Bấm **“Thanh toán”** để tiếp tục.
- *Giỏ hàng được lưu trên trình duyệt của bạn (không mất khi tải lại trang).*

### 6. Đăng nhập / Đăng ký (`/dang-nhap`)
- Chuyển tab **Đăng ký** để tạo tài khoản: nhập họ tên, email **hoặc** số điện thoại, mật khẩu (≥ 6 ký tự).
- Hoặc **Đăng nhập** bằng email/SĐT đã đăng ký.

### 7. Thanh toán / Đặt hàng (`/thanh-toan`)
- Cần **đăng nhập** trước.
- Điền thông tin người nhận: họ tên, số điện thoại, địa chỉ (email và ghi chú không bắt buộc).
- Xem lại **đơn hàng** và **tổng cộng** (đã tính phí ship, miễn phí nếu đạt ngưỡng).
- Bấm **“Đặt hàng”** → nhận **mã đơn hàng** (VD: `KN20260705-1234`).
- *Hiện hỗ trợ đặt đơn (thanh toán COD). Cổng thanh toán online sẽ bổ sung ở giai đoạn sau.*

---

## B. Dành cho người quản trị (tạm thời)

> Trang Admin có giao diện sẽ được làm ở giai đoạn tiếp theo. Hiện quản trị qua các công cụ sau:

### 1. Xem & sửa dữ liệu — Prisma Studio
```bat
cd D:\duan\api
npx prisma studio
```
Mở http://localhost:5555 — xem/sửa trực tiếp các bảng: `products`, `categories`, `orders`, `customers`…

### 2. Quản lý ảnh — MinIO Console
- http://localhost:9001 — đăng nhập `ketnoi` / `ketnoi_dev_2026`
- Bucket ảnh: `ketnoi-media`

### 3. Thêm/sửa dữ liệu qua API
- Thêm danh mục, thương hiệu, sản phẩm, cập nhật cấu hình… bằng các endpoint trong `02_API_REFERENCE.md`.
- Upload ảnh sản phẩm: `POST /uploads/image` → nhận `url` → gán vào sản phẩm.

### 4. Nạp lại dữ liệu mẫu
```bat
cd D:\duan\api
npx prisma db seed
```
> Lệnh seed tự **xóa dữ liệu cũ** rồi tạo lại 10 sản phẩm mẫu. Cẩn thận khi đã có dữ liệu thật.

### 5. Cấu hình hiển thị (hotline, giờ làm việc, ngưỡng freeship)
- Lưu trong bảng `settings` (key–value). Sửa qua Prisma Studio hoặc `PUT /settings/:key`.
- Frontend tự đọc các giá trị này ở Header/Footer.

---

## C. Câu hỏi thường gặp

**Quên chạy backend thì sao?** Trang vẫn mở nhưng không có dữ liệu — hãy chạy API (mục 4, tài liệu bàn giao).

**Đặt hàng báo “cần đăng nhập”?** Bấm link Đăng nhập/Đăng ký ở trang thanh toán, tạo tài khoản rồi quay lại đặt.

**Giá hiển thị là gì?** Giá đã giảm (nếu có) in đậm màu đỏ; giá gốc gạch ngang bên cạnh.
