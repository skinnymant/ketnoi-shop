# Kiểm tra danh mục, thanh toán và bảo hành SWE

Ngày kiểm tra: 09/10/2026 (Asia/Saigon).

## Ngân hàng

API công khai đang trả mã ngân hàng `970436`, số tài khoản `1234567890`, chủ tài khoản `CONG TY KET NOI SHOP`. Mã BIN là Vietcombank theo danh sách ngân hàng VietQR; hai thông tin còn lại trùng dữ liệu mẫu trong seed, chưa được chủ website xác nhận. Tra mã BIN không xác minh quyền sở hữu tài khoản.

Bản sửa frontend chỉ cho chọn chuyển khoản khi cấu hình có `bank_transfer_enabled=true`, đủ thông tin người nhận và không còn thông tin mẫu. Nếu tải cấu hình thất bại, chuyển khoản không khả dụng; COD vẫn hoạt động. QR sau đặt hàng lấy người nhận từ phản hồi của API cho đơn đó, không dùng cấu hình cũ trên trang.

Bản sửa API yêu cầu JWT quản trị cho PUT/DELETE `/settings/:key`; GET giữ công khai để hiển thị thông tin cửa hàng. API từ chối tạo đơn BANK_TRANSFER khi chưa cấu hình hợp lệ. Seed mới để trống tài khoản và tắt chuyển khoản.

Để bật chuyển khoản sau khi triển khai API:

1. Chủ website xác nhận ngân hàng, số tài khoản và tên chủ tài khoản thực tế.
2. Qua API quản trị đã xác thực, giữ `bank_transfer_enabled=false`, cập nhật `bank_code` (BIN), `bank_account`, `bank_name` (tên chủ tài khoản).
3. Đối chiếu người nhận bằng ứng dụng ngân hàng rồi đặt `bank_transfer_enabled=true`.

Không lưu mật khẩu/token trong tài liệu hoặc mã nguồn.

## Thang Nhôm

Danh mục hiện chứa 6 mã không phải thang. Bản sửa mã nguồn phân loại:

| SKU | Danh mục đúng |
| --- | --- |
| 48-22-3078 | Công Cụ Dụng Cụ |
| 48-22-6109 | Công Cụ Dụng Cụ |
| TACSD30316 | Công Cụ Dụng Cụ |
| 2155 | Phụ Tùng - Linh Kiện |
| 26708 | Công Cụ Dụng Cụ |
| 09261 | Công Cụ Dụng Cụ |

54 sản phẩm hiện có chưa bao gồm thang thật. Giữ cây danh mục thang để nhập sản phẩm về sau.

`scripts/repair-ladder-category.cjs` chỉ chuyển 6 SKU trên nếu vẫn nằm trong nhóm thang; không sửa giá, tồn kho, đơn hàng hay sản phẩm khác. Có giao dịch và kiểm tra thay đổi đồng thời. Chạy trên đúng máy backend với DATABASE_URL của dự án:

```powershell
cd api
node ../scripts/repair-ladder-category.cjs
# Sau khi đối chiếu danh sách dry-run:
node ../scripts/repair-ladder-category.cjs --apply
```

Không chạy seed để sửa danh mục: seed hiện có bước xóa dữ liệu.

Nếu backend chạy bằng Docker Compose, trên đúng máy backend và tại thư mục gốc repository, có thể dùng kết nối PostgreSQL sẵn có bên trong container:

```sh
docker compose cp scripts/repair-ladder-category.cjs api:/app/repair-ladder-category.cjs
docker compose exec -T api node repair-ladder-category.cjs
# Sau khi đối chiếu danh sách dry-run:
docker compose exec -T api node repair-ladder-category.cjs --apply
```

Script không tự chạy khi triển khai và mặc định chỉ đọc. Cần triển khai mã API mới trên đúng máy backend để áp dụng kiểm tra ngân hàng và đồng bộ bảo hành; cập nhật giao diện Vercel không thay thế bước này.

## Bảo hành

`warrantyMonths` là nguồn thời hạn duy nhất cho thông số và cam kết trên trang chi tiết. Trang chủ/footer dùng câu theo từng sản phẩm, không cam kết chung 12 tháng. Quản trị cho phép để trống khi chưa xác nhận; `0` nghĩa là không bảo hành. API đồng bộ thông số Bảo hành theo trường này khi lưu.

Audit đọc 54 sản phẩm: 43 sản phẩm có thời hạn rõ trong thông số và khớp trường dữ liệu. 2 mã Milwaukee nêu 12 tháng trong mô tả. Còn 9 mã có trường 12 tháng nhưng thiếu xác nhận trong thông số/mô tả: STMT80944-8, TACSD30316, 2155, 26708, THT11151-3, THT11051-3, PA-3201, G2-GFB280Bar, QN15-3-15A. Chưa tự đổi thời hạn của các mã này trong database; cần chủ website xác nhận.

## Giới hạn triển khai backend

API đang hoạt động và trả danh mục 54 sản phẩm thật. Đăng nhập quản trị bằng cấu hình `api/.env` bị từ chối HTTP 401; `.env` ở thư mục gốc không có tài khoản quản trị khác. Tài liệu mới mô tả backend chạy trên laptop Ubuntu WSL2/Docker qua Cloudflare Tunnel, nhưng máy Windows hiện tại chưa có WSL/Docker. Chưa có địa chỉ/kênh truy cập máy backend thực tế, nên chưa triển khai mã API hoặc sửa 6 bản ghi danh mục trên dữ liệu thật. Đưa frontend lên Vercel không tự triển khai NestJS/PostgreSQL. Chưa chạy script đặt lại quản trị.

Ảnh và giao diện có thể triển khai độc lập. Chi tiết từng nguồn ảnh và kết quả đối chiếu watermark nằm trong `product-images/sources.json` và `product-images/watermark-audit.json`.
