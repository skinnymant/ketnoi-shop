# Ảnh sản phẩm SWE

Bộ ảnh được đối chiếu theo SKU trong `api/prisma/seed.ts`. `catalog.json` chỉ trích xuất dữ liệu tĩnh từ mã nguồn; quá trình này không chạy seed, không xóa đơn hàng và không sửa cơ sở dữ liệu.

Hoàn tất ngày 07/10/2026: **54/54 SKU có ảnh**, tổng ảnh WebP khoảng **2,79 MB**. Đã kiểm tra tệp/hash, giữ ảnh do quản trị viên tải lên, SKU không có trong danh mục, TypeScript, lint và hiển thị trình duyệt với dữ liệu thử. Trang chi tiết không tràn ngang ở chiều rộng 390px.

- `sources.json`: kết quả đối chiếu từng mã, trang nguồn, URL ảnh gốc, ghi chú biến thể, kích thước và SHA-256 của ảnh dùng trên website.
- `review.html`: mở bằng trình duyệt để duyệt ảnh và nguồn của từng sản phẩm.
- `../../ketnoi-shop/web/lib/catalog-product-images.json`: ánh xạ SKU sang ảnh WebP cục bộ.
- `../../ketnoi-shop/web/public/products/`: các ảnh được triển khai cùng frontend.

Ảnh giữ nguyên bố cục và nhãn từ nguồn; chỉ thu nhỏ khi cần và chuyển sang WebP. Tên file chứa hash để trình duyệt nhận ảnh mới khi ảnh thay đổi.

## Cách sử dụng trên website

`withProductImages()` trong `web/lib/product-images.ts` dùng ảnh đã đối chiếu khi sản phẩm chưa có ảnh hoặc chỉ có ảnh từ `placehold.co`. Ảnh thật do quản trị viên tải lên được giữ nguyên. Sản phẩm ngoài danh mục hoặc chưa xác minh model không được tự gán ảnh.

Trang danh sách, chi tiết và quản trị dùng chung cơ chế này. Giỏ hàng mới nhận ảnh từ trang chi tiết. JSON-LD sử dụng URL ảnh tuyệt đối. Không thay giá, tồn kho, tên hay SKU trong cơ sở dữ liệu.

Mã LiOA `YBRIDX-30M-20A` trong dữ liệu cũ được người dùng xác nhận là **HYBRID-30M-20A loại thường** ngày 06/10/2026. Ảnh được chọn theo xác nhận này; ánh xạ vẫn dùng SKU cũ để tương thích với dữ liệu hiện có.

FS32V1 dùng ảnh đại diện dòng đinh cuộn xoắn Đinh Lực trên trang có biến thể Ø2.1×32mm; nguồn dùng chung ảnh cho nhiều chiều dài. Với các bộ máy Makita và Dekton chỉ có ảnh thân máy, `sources.json` ghi rõ ảnh không minh họa toàn bộ pin/sạc/hộp. Ảnh combo Dekton 2,5Ah không được dùng cho bộ 2,0Ah.

## Kiểm tra và tái tạo

Sau khi cài dependencies của frontend và API:

```powershell
node scripts/extract-product-catalog.cjs
node scripts/prepare-product-images.cjs
node scripts/check-product-images.cjs
```

Lệnh chuẩn bị tải ảnh từ các nguồn đã ghi trong `sources.json`, không kết nối database. Nên kiểm tra lại `review.html` sau khi tải vì nguồn bên ngoài có thể thay ảnh. Không chạy `prisma db seed` để cập nhật riêng ảnh: seed hiện tại có bước xóa dữ liệu cũ.

## Trạng thái backend khi thực hiện

Lần kiểm tra ngày 06/10/2026: `https://api.swevietnam.com/health` trả 200, nhưng `/products` và `/categories` trả 404. `/api/products` trả dữ liệu mẫu như “Classic Tee”, “Canvas Tote”, không khớp NestJS và danh mục dụng cụ SWE trong repository. Do đó bộ ảnh được kiểm tra bằng dữ liệu thử cục bộ; cần phục hồi đúng backend để đối chiếu và hiển thị danh mục thật.

Ngày 07/10/2026, `/products?limit=1` lại trả HTTP 530 / Cloudflare 1033. Người dùng cho biết có máy/VPS và sẽ gửi địa chỉ; chưa nhận địa chỉ trong lúc hoàn tất bộ ảnh. Không đổi DNS, Tunnel hoặc dùng danh mục thử làm dữ liệu sản xuất.
