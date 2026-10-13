# Đo hiệu năng và các bước mua hàng SWE

Cơ chế đo dùng API cùng website `/api/metrics`, không cài Google Analytics hay dịch vụ theo dõi bên ngoài. Trình duyệt gửi bằng `fetch` với `keepalive`, bỏ cookie và `Referrer`; lỗi đo không ảnh hưởng thao tác mua hàng. Mã không tạo mã khách, mã phiên hoặc lưu dữ liệu theo dõi trong trình duyệt.

## Dữ liệu được gửi

Chỉ nhóm trang `home`, `product`, `category`, `search`, `cart`, `checkout`, `other`; không gửi đường dẫn sản phẩm, SKU, truy vấn tìm kiếm, mã đơn, giá trị đơn, tên, số điện thoại, email, địa chỉ, cookie hoặc token.

- Hiệu năng: LCP, INP, CLS, TTFB, FCP; giá trị số và mức `good`, `needs-improvement`, `poor` từ Web Vitals. Các thời gian dùng mili giây; CLS không có đơn vị.
- Bước mua: `product_view`, `add_to_cart`, `begin_checkout`, `order_created`; mỗi thao tác gửi bộ đếm 1. `product_view` chỉ phát khi trang đã tải được chi tiết sản phẩm, không đếm màn hình lỗi hoặc trang không tồn tại. `order_created` chỉ phát sau khi API đã tạo đơn thành công, không có nghĩa tiền đã được nhận hoặc đơn đã hoàn tất.
- Không đo trang quản trị/đăng nhập/đăng ký/tài khoản. Các số hiệu năng thuộc lần tải tài liệu ban đầu; điều hướng nội bộ Next.js không phải lần tải tài liệu mới.

Ví dụ mẫu đã lọc:

```json
{"scope":"swe_web_metrics","type":"vital","routeGroup":"product","metric":"LCP","value":2187.4,"rating":"good"}
```

```json
{"scope":"swe_web_metrics","type":"event","routeGroup":"checkout","event":"order_created","count":1}
```

## Quyền riêng tư và giới hạn

Do Not Track (`DNT: 1`) và Global Privacy Control được tôn trọng ở trình duyệt và endpoint. Mã endpoint không đọc hoặc ghi IP, User-Agent, cookie hay token. Nền tảng lưu trữ vẫn có thể tạo access log theo cấu hình riêng; cơ chế này không thay thế quản lý log của Vercel/Cloudflare.

Endpoint chỉ nhận POST JSON cùng origin được tin cậy, giới hạn 1.024 byte thực đọc và danh sách trường cố định. Trường lạ hoặc giá trị ngoài giới hạn bị từ chối, không được ghi vào log. Mỗi trình duyệt gửi tối đa 100 mẫu trong một lần tải tài liệu; mỗi instance server đang chạy chấp nhận tối đa 120 mẫu/phút để hạn chế chi phí. Đây là giới hạn cục bộ, không phải firewall phân tán.

## Cách sử dụng kết quả

Trong log của deployment Vercel, lọc chuỗi `swe_web_metrics`. Tổng số `event` theo nhóm cho thấy hoạt động tại từng bước; các mẫu `vital` giúp phát hiện nhóm trang tải chậm hoặc có dịch chuyển bố cục. Khi xuất các mẫu ra báo cáo, tính phân vị p75 trên cùng metric và nhóm trang, với khoảng thời gian và số mẫu được ghi rõ. CLS dùng giá trị gốc, không nhân 1.000.

Hiện chỉ có log mẫu, chưa có dashboard GA4 hoặc kho dữ liệu dài hạn. Không có ID khách/phiên nên không thể nối các bước của cùng một người thành cohort hoặc suy ra tỷ lệ chuyển đổi thực. Người chặn đo, mẫu bị giới hạn, bot và việc làm mới trang đều ảnh hưởng số đếm. Không dùng các số này để đối soát doanh thu, thanh toán hoặc tính số người mua duy nhất.

## Điểm tích hợp

`WebMetrics` đặt một lần tại layout để nhận Web Vitals. `ProductViewMetric` đặt trong phần trang đã tải thành công chi tiết sản phẩm để đếm lượt xem. `trackStoreEvent` gọi sau khi thêm giỏ, khi vào thanh toán với giỏ có hàng, và sau khi nhận kết quả tạo đơn thành công. Không phát sự kiện `payment_success` khi khách chỉ mở QR hoặc bấm sao chép.

Tham chiếu triển khai: [Next.js useReportWebVitals](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals). Mã gọi dùng callback cố định để tránh báo lại metric khi component render lại.
