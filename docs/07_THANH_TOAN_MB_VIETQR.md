# Thanh toán chuyển khoản MB cho SWE

## Người nhận do chủ website cung cấp

- Ngân hàng: MB Bank — Ngân hàng TMCP Quân Đội.
- Chi nhánh: Việt Trì, Phú Thọ.
- Số tài khoản: `6605666888`.
- Tên hiển thị đúng theo ảnh: `CONG TY TNHH THUONG MAI VA DICH SWE`.
- BIN `970422` và số tài khoản đã được giải mã từ QR đính kèm, đồng thời đối chiếu BIN với danh sách ngân hàng của VietQR. Đây không phải thao tác xác minh pháp lý chủ tài khoản.

Nguồn kỹ thuật: [Quick Link VietQR](https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/) và [danh sách ngân hàng](https://www.vietqr.io/danh-sach-api/api-danh-sach-ma-ngan-hang/).

## Luồng đang triển khai trên Vercel

1. Trang thanh toán lấy người nhận được phê duyệt từ `GET /api/checkout` trên chính tên miền SWE. Thông tin công khai được quản lý tại `ketnoi-shop/web/lib/merchant-bank.ts`.
2. `POST /api/checkout` chỉ chuyển thông tin nhận hàng, mã sản phẩm, số lượng và phương thức thanh toán sang API đơn hàng hiện có. Token khách hàng, nếu có, vẫn được chuyển tiếp. Giá, số tiền và người nhận gửi thêm từ trình duyệt bị loại bỏ.
3. API NestJS ghi đơn và khoản thanh toán `BANK_TRANSFER / PENDING`, tự tính tổng tiền. Mã đơn và số tiền trong QR lấy từ phản hồi này.
4. Vercel chỉ cấp chỉ dẫn chuyển khoản sau khi kiểm tra đơn đã có một khoản thanh toán đang chờ, đúng phương thức, đúng đơn và đúng số tiền. Với API cũ chưa trả thông tin người nhận, dùng tài khoản MB được chủ website cung cấp. Nếu API mới trả người nhận khác, thiếu dữ liệu, hoặc từ chối chuyển khoản, không ghi đè và không tạo QR.
5. Đơn vẫn chờ SWE đối chiếu tiền vào tài khoản. Không có webhook ngân hàng và không tự đổi trạng thái sang đã thanh toán. Trong quản trị đơn hàng, chỉ xác nhận đã thanh toán sau khi đối chiếu giao dịch thực tế.

COD giữ nguyên. Lỗi tạo đơn không tự động chuyển sang COD, không tự gửi lại POST. Khi phản hồi không rõ đơn đã tạo hay chưa, giao diện chặn đặt lại và hướng dẫn liên hệ SWE. Không lưu thông tin cá nhân, số tiền hay QR có thể thanh toán trong bộ nhớ trình duyệt để tự khôi phục. Trong phiên chỉ lưu cờ yêu cầu đang chờ, mã đơn gần nhất và hình thức thanh toán; tải lại trang sau khi đặt hàng sẽ hiện mã đơn để liên hệ hỗ trợ, không tự khôi phục QR.

Nội dung chuyển khoản là mã đơn viết liền, bỏ dấu gạch nối (ví dụ `KN202610099999`). VietQR tự chuẩn hóa dấu gạch nối, nên dòng nội dung hiển thị và nút sao chép dùng đúng chuỗi đã mã hóa. Khi đối chiếu, nhân viên so sánh mã đơn sau khi bỏ dấu gạch nối.

Ảnh QR được tạo bởi `img.vietqr.io` với BIN, tài khoản, tên người nhận, số tiền và nội dung. Không gửi tên/địa chỉ/số điện thoại khách hàng đến dịch vụ QR. Nếu QR tải lỗi, khách vẫn đọc và sao chép thông tin chuyển khoản.

## Kiểm tra và giới hạn

- `node --test scripts/checkout.test.cjs`: kiểm thử giá/nguồn nhận từ máy chủ, dữ liệu giả mạo từ client, đối chiếu khoản thanh toán, phản hồi lỗi, chống chuyển phương thức và gửi lại ngoài ý muốn.
- Build và lint Next.js; kiểm thử trình duyệt với API giả cục bộ cho QR, sao chép, COD, lỗi QR, lỗi máy chủ, phản hồi mâu thuẫn và màn hình 390px.
- QR mẫu được giải mã lại để kiểm tra BIN/tài khoản/số tiền/nội dung. Không thực hiện chuyển tiền hoặc tạo đơn thật để kiểm thử.

Backend đang chạy riêng; lần kiểm tra trước vẫn có cấu hình ngân hàng mẫu và thiếu quyền quản trị/backend. Không sử dụng endpoint quản trị thiếu bảo vệ để thay cấu hình. Cầu nối Vercel cho phép dùng thông tin MB đã được phê duyệt với API cũ, nhưng không bỏ qua bất kỳ lỗi từ chối nào của API.

Khi có quyền truy cập máy backend, cần triển khai các bản vá API còn chờ và cập nhật cấu hình ngân hàng qua quyền quản trị: `bank_code=970422`, `bank_account=6605666888`, `bank_name=CONG TY TNHH THUONG MAI VA DICH SWE`, sau đó `bank_transfer_enabled=true`. Không chạy seed để cập nhật thanh toán vì seed xóa dữ liệu. Nếu đổi người nhận trong tương lai, phải cập nhật cấu hình đã phê duyệt ở cả Vercel và backend; thông tin mâu thuẫn sẽ dừng phát QR.
