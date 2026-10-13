# Khôi phục backend SWE và sửa danh mục

## Trạng thái đã xác minh ngày 12/10/2026

- `https://api.swevietnam.com/health` trả HTTP **530**, nội dung **Cloudflare 1033**.
- Cloudflare không tìm thấy connector khỏe để nhận lưu lượng. Lỗi này chưa xác định được tình trạng PostgreSQL hay nguyên nhân connector dừng.
- Máy Windows chứa bản checkout `D:\duan` chưa cài WSL, không có Docker CLI và không có máy SSH được cấu hình trong `~/.ssh/config`.
- Người quản trị xác nhận backend nằm trên **máy khác**. Chưa nhận được IP/link quản trị và chưa truy cập máy đó. Các thay đổi dưới đây chưa được chạy trên dữ liệu thật.

Nguồn: [Cloudflare Error 1033](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1033/).

## 1. Xác định máy và checkout gốc

Chạy tại **máy đang giữ PostgreSQL/MinIO thật**, trong checkout đã dùng để tạo stack. Không tạo stack trên máy mới để xử lý lỗi Tunnel.

```bash
docker info --format '{{.ServerVersion}}'
docker compose -f docker-compose.laptop.yml ps -a
```

Nếu dùng VPS/Caddy, thay tên file bằng `docker-compose.prod.yml`. Không dùng `docker compose config` để gửi báo cáo: lệnh đó có thể in mật khẩu và token đã được nội suy. Không gửi `.env`, private key, token Tunnel hay log chưa kiểm tra vào chat.

## 2. Chẩn đoán chỉ đọc và khởi động lại container gốc

Công cụ cần Node.js >=18 và Docker Compose **trên máy backend**. Chế độ mặc định chỉ đọc:

```bash
node scripts/recover-existing-backend.cjs
```

Công cụ xác minh từng container có nhãn Compose đúng checkout/project/service và kiểm tra volume PostgreSQL/MinIO gốc còn tồn tại. Nếu thiếu bất kỳ container, sai checkout hoặc thiếu volume, công cụ dừng trước mọi thay đổi. Đầu ra chỉ gồm trạng thái dịch vụ và kết quả health, không in cấu hình môi trường.

Nếu PostgreSQL/MinIO đang chạy và cần khôi phục API/Tunnel:

```bash
node scripts/recover-existing-backend.cjs --restart-services=api,cloudflared
```

Nếu các container gốc đều tồn tại nhưng toàn bộ stack đã dừng:

```bash
node scripts/recover-existing-backend.cjs --restart-services=postgres,minio,api,cloudflared
```

Với VPS/Caddy:

```bash
node scripts/recover-existing-backend.cjs --compose=docker-compose.prod.yml --restart-services=api,caddy
```

Công cụ chỉ `start`/`restart` các **ID container có sẵn**, theo thứ tự phụ thuộc. Nó chờ PostgreSQL sẵn sàng trước API, kiểm tra `/health` cùng kết nối DB trước Tunnel/Caddy. Nó không tạo hay tải image mới, không sửa `.env`/DNS/Tunnel, không đặt lại tài khoản và không xóa volume. Container vẫn chạy lệnh khởi động vốn có của image; API hiện dùng `prisma migrate deploy` trong entrypoint. Khi dùng đúng image hiện hành, đây không phải thao tác triển khai image/migration mới.

Nếu health API nội bộ tốt nhưng public API vẫn 1033, kiểm tra connector đang chạy và trạng thái Tunnel ở Cloudflare Dashboard → Networking → Tunnels. Xác minh hostname `api.swevietnam.com` đang dùng connector gốc, service `http://api:4000`. Không thay DNS/token hoặc tạo Tunnel mới trước khi xác định chính xác Tunnel đang phục vụ website.

## 3. Sửa 6 SKU đang nằm trong Thang Nhôm

Sau khi backend hoạt động và đã xác minh đúng DB, sao lưu trước khi sửa. Ví dụ chạy trong shell của máy backend:

```bash
mkdir -p backups
chmod 700 backups
(set -o noclobber; docker compose -f docker-compose.laptop.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > backups/before-category-repair.dump)
test -s backups/before-category-repair.dump
```

Không ghi đè file sao lưu đã có; dùng tên file khác cho lần tiếp theo. Giữ bản sao lưu ở nơi chỉ người quản trị đọc được.

Đưa script vào container API và xem kế hoạch chỉ đọc:

```bash
docker compose -f docker-compose.laptop.yml cp scripts/repair-ladder-category.cjs api:/tmp/repair-ladder-category.cjs
docker compose -f docker-compose.laptop.yml exec -T api node /tmp/repair-ladder-category.cjs
```

Kế hoạch chỉ tác động các SKU sau đang nằm trong danh mục thang:

| SKU | Danh mục đúng |
| --- | --- |
| 48-22-3078 | Công cụ, dụng cụ |
| 48-22-6109 | Công cụ, dụng cụ |
| TACSD30316 | Công cụ, dụng cụ |
| 2155 | Phụ tùng, linh kiện |
| 26708 | Công cụ, dụng cụ |
| 09261 | Công cụ, dụng cụ |

Sau khi kế hoạch khớp dữ liệu thật, chạy giao dịch sửa và kiểm tra lại:

```bash
docker compose -f docker-compose.laptop.yml exec -T api node /tmp/repair-ladder-category.cjs --apply
docker compose -f docker-compose.laptop.yml exec -T api node /tmp/repair-ladder-category.cjs
```

Lần kiểm tra cuối phải báo không còn sản phẩm cần sửa. Script chỉ cập nhật `categoryId`, giữ sản phẩm đã xóa và SKU khác, dừng nếu danh mục đích thiếu/không hoạt động, rollback cả giao dịch nếu có sản phẩm đổi trong lúc sửa. Không dùng `prisma db seed` để sửa lỗi này: seed hiện tại có thao tác xóa danh mục và đơn hàng.

## 4. Duy trì khả năng hoạt động

Compose laptop/VPS đã có `restart: always`; bản cập nhật thêm healthcheck API kiểm tra đúng JSON `status: ok` và `database: connected`, cùng timeout. PostgreSQL có healthcheck; API chờ DB, Tunnel/Caddy chờ API khỏe khi Compose tạo/khởi động stack. Healthcheck cung cấp trạng thái để phát hiện lỗi; nó **không tự khởi động lại container chỉ vì unhealthy**.

Giữ nguồn điện/mạng ổn định, cấu hình máy backend không sleep trong thời gian bán hàng, bảo đảm Docker khởi động cùng máy. Theo dõi `/health` từ ngoài mạng của backend và sao lưu DB định kỳ. Chưa cài giám sát định kỳ hay thay cài đặt nguồn điện trên máy thật trong lần triển khai này.

## Kiểm chứng mã nguồn

`node --test scripts/recover-existing-backend.test.cjs scripts/repair-ladder-category.test.cjs`: 10 kiểm thử đạt. Các ca kiểm tra bao gồm từ chối sai máy/volume, không tạo stack, thứ tự khôi phục, dừng khi DB/API chưa khỏe, HTTP 1033 và giao dịch sửa danh mục có rollback/idempotency. Chưa xác nhận Compose runtime trên máy backend vì chưa có quyền truy cập máy đó.

## Bản vá API cần triển khai trên backend

Ngoài việc sửa dữ liệu danh mục, image API mới có hai thay đổi cần triển khai trên đúng máy backend:

- Phí vận chuyển miễn khi **mọi sản phẩm trong đơn** có cờ `freeShip` hoặc tạm tính đạt ngưỡng `nguong_freeship`. Giỏ hỗn hợp dưới ngưỡng vẫn có phí 30.000đ. Ngưỡng thiếu/sai/không dương dùng mặc định 2.000.000đ như giao diện. API tính lại từ giá và cờ miễn ship trong DB; không nhận số tiền/cờ miễn ship do khách gửi lên làm căn cứ thu tiền.
- Bộ lọc/sắp xếp giá dùng giá hiệu lực `salePrice ?? price`. Sắp xếp tăng/giảm diễn ra trong PostgreSQL **trước** phân trang, giữ các bộ lọc danh mục/con, thương hiệu, tìm kiếm, khuyến mãi và thông số. Chỉ tải thông tin chi tiết của trang tối đa 50 sản phẩm; mọi giá trị lọc được bind làm tham số SQL.

51 kiểm thử đạt trên 6 suite về hợp đồng health, bộ lọc giá, bảo hành, tìm kiếm, phí ship và chuyển khoản. TypeScript và lint các file API thay đổi đều đạt. Các ca kiểm thử API là unit test dùng dữ liệu giả cục bộ; chưa chạy SQL hoặc gửi đơn trên DB production.

Backend mới thêm `capabilities: { effectivePriceFilters: true, productFreeShipping: true }` vào `/health` **sau khi DB kiểm tra thành công**. Frontend chỉ bật bộ lọc giá hiệu lực và ưu đãi miễn ship theo sản phẩm khi API khỏe và thông báo đúng capability tương ứng. API cũ thiếu trường capability, hoặc API đang lỗi, phải được coi là chưa hỗ trợ; không hiển thị lời hứa/ước tính dựa trên tính năng chưa được triển khai tại backend.

Đánh giá sản phẩm hiện chỉ có trạng thái duyệt `APPROVED`, liên kết khách hàng và sản phẩm. Chưa có quan hệ với đơn đã giao hoặc quy trình xác thực đã mua; không hiển thị nhãn “người mua đã xác minh” chỉ dựa trên việc đánh giá được duyệt.

**Triển khai Vercel chỉ cập nhật frontend.** Các bản vá API và việc chuyển 6 SKU trên dữ liệu thật vẫn cần truy cập backend, kiểm tra volume/sao lưu, rồi triển khai image API mới tại đó. Công cụ khôi phục container ở trên giữ image hiện có nên không tự cài các bản vá này.
