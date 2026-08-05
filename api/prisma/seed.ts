// =====================================================================
// SWE PHÚ THỌ VIỆT NAM — SEED DỮ LIỆU CATALOG (redesign)
// Tạo: 9 danh mục gốc (+3 danh mục con Thang Nhôm), 20 thương hiệu,
// 2 kho, 54 sản phẩm (ảnh + thông số + tồn kho) và cấu hình hệ thống.
// Vị trí file: api/prisma/seed.ts
// Chạy bằng:  npx prisma db seed
// Chạy lại bao nhiêu lần cũng được: script tự dọn dữ liệu cũ trước
// (kể cả đơn hàng demo — xóa orderItem/payment/shipment/order trước product).
// Ghi chú: dự án dùng Prisma 7 + driver adapter (PrismaPg) nên
//          PrismaClient phải được khởi tạo kèm adapter, giống prisma.service.ts.
// Ghi chú giá: theo số liệu khảo sát, price = giá niêm yết (giá gốc),
//          salePrice = giá bán sau giảm (null = bán đúng giá niêm yết).
// =====================================================================

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ============================ TIỆN ÍCH ===============================

// Bỏ dấu tiếng Việt (kể cả đ/Đ) để tạo slug, sku
function boDau(chuoi: string): string {
  return chuoi
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Slug: bỏ dấu, chữ thường, mọi ký tự lạ thành gạch nối
function taoSlug(chuoi: string): string {
  return boDau(chuoi)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type CapThongSo = [string, string];

// Lấy giá trị Model trong bảng thông số (dùng làm SKU + chữ trên ảnh)
function docModel(thongSo: CapThongSo[]): string | undefined {
  const dong = thongSo.find(([k]) => k === 'Model');
  return dong ? dong[1] : undefined;
}

// Đọc số tháng bảo hành từ thông số "Bảo hành":
// "12 Tháng" -> 12, "10 năm" -> 120; thiếu hoặc không đọc được -> 12
function docBaoHanh(thongSo: CapThongSo[]): number {
  const dong = thongSo.find(([k]) => k === 'Bảo hành');
  if (!dong) return 12;
  const so = parseInt(dong[1], 10);
  if (isNaN(so)) return 12;
  return /năm/i.test(dong[1]) ? so * 12 : so;
}

// SKU dự phòng khi sản phẩm không có Model: viết tắt từ slug + số thứ tự
function skuTuSlug(slug: string, stt: number): string {
  const vietTat = slug
    .split('-')
    .map((tu) => tu.charAt(0))
    .join('')
    .toUpperCase();
  return `SWE-${vietTat}-${stt}`;
}

// ========================= DANH MỤC GỐC ==============================
// 9 danh mục cấp 1 theo thứ tự khảo sát; position theo thứ tự khai báo

const DANH_MUC_GOC: { name: string; slug: string }[] = [
  { name: 'Công Cụ, Dụng Cụ', slug: 'cong-cu-dung-cu' },
  { name: 'Thiết Bị Dùng Pin', slug: 'thiet-bi-dung-pin' },
  { name: 'Dụng Cụ Điện', slug: 'dung-cu-dien' },
  { name: 'Thiết Bị Nâng Đỡ', slug: 'thiet-bi-nang-do' },
  { name: 'Thang Nhôm', slug: 'thang-nhom' },
  { name: 'Máy Hàn & Phụ Kiện', slug: 'may-han-phu-kien' },
  { name: 'Dụng Cụ Khí Nén', slug: 'dung-cu-khi-nen' },
  { name: 'Thiết Bị Dùng Nước', slug: 'thiet-bi-dung-nuoc' },
  { name: 'Phụ Tùng, Linh Kiện', slug: 'phu-tung-linh-kien' },
];

// 3 danh mục con (cấp 2) của Thang Nhôm
const DANH_MUC_CON_THANG: { name: string; slug: string }[] = [
  { name: 'Thang Nhôm Chữ A', slug: 'thang-nhom-chu-a' },
  { name: 'Thang Nhôm Rút', slug: 'thang-nhom-rut' },
  { name: 'Thang Nhôm Ghế', slug: 'thang-nhom-ghe' },
];

// ========================= DỮ LIỆU SẢN PHẨM ==========================

type SanPhamNguon = {
  ten: string; // tên sản phẩm (đã giải mã HTML entity: &amp; &quot;)
  thuongHieu: string; // tên thương hiệu (đã giải mã HTML entity)
  danhMucSlug: string; // slug danh mục gốc theo khảo sát
  giaGoc: number; // price — giá niêm yết
  giaBan: number | null; // salePrice — giá bán sau giảm (null = không giảm)
  daBan: number; // soldCount
  thongSo: CapThongSo[]; // thông số (đã bỏ cặp "Thương hiệu")
  moTaNgan: string; // shortDesc — tự viết, 1 câu
  moTa: string; // description — tự viết, HTML 2-3 câu <p>
};

const SAN_PHAM: SanPhamNguon[] = [
  // ---------------- Công Cụ, Dụng Cụ ----------------
  {
    ten: 'Bộ cờ lê vòng miệng 14 chi tiết Stanley STMT80944 8-32mm',
    thuongHieu: 'Stanley',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 1424000,
    giaBan: 1025000,
    daBan: 117,
    thongSo: [
      ['Model', 'STMT80944-8'],
      ['Xuất xứ', 'Ấn Độ'],
    ],
    moTaNgan:
      'Bộ cờ lê vòng miệng 14 cỡ từ 8 đến 32mm bằng thép hợp kim mạ crôm, đủ dùng cho cả sửa chữa gia đình lẫn xưởng cơ khí.',
    moTa:
      '<p>Bộ cờ lê vòng miệng Stanley STMT80944 gồm 14 chi tiết trải đều dải cỡ 8-32mm, giúp thợ sửa xe và thợ cơ khí xử lý gọn hầu hết các loại bu lông, đai ốc thông dụng.</p><p>Thân cờ lê rèn từ thép hợp kim, bề mặt mạ crôm sáng bóng chống gỉ, đầu vòng 12 cạnh ôm chắc giúp hạn chế trờn góc khi siết lực lớn.</p><p>SWE Việt Nam cam kết hàng chính hãng Stanley, kiểm tra đủ chi tiết trước khi giao.</p>',
  },
  {
    ten: 'Thùng đựng dụng cụ PACKOUT Milwaukee 48-22-8429 (554x422x394 mm)',
    thuongHieu: 'Milwaukee',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 3720000,
    giaBan: 3300000,
    daBan: 1,
    thongSo: [
      ['Model', '48-22-8429'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Thùng dụng cụ hệ PACKOUT cỡ lớn 554x422x394mm, xếp chồng và khóa liền các module giúp mang đồ nghề ra công trình gọn gàng.',
    moTa:
      '<p>Thùng đựng dụng cụ Milwaukee 48-22-8429 thuộc hệ PACKOUT nổi tiếng, cho phép ghép chồng và khóa chặt với các hộp cùng hệ để di chuyển toàn bộ đồ nghề chỉ trong một chuyến.</p><p>Vỏ nhựa polymer chịu va đập mạnh, gioăng kín hạn chế bụi nước, phù hợp môi trường công trường khắc nghiệt.</p><p>Sản phẩm chính hãng Milwaukee do SWE Việt Nam phân phối, bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Lưỡi cưa cắt gỗ 60 răng Makita P-67963 (185mm)',
    thuongHieu: 'Makita',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 281420,
    giaBan: 255000,
    daBan: 81,
    thongSo: [
      ['Model', 'P-67963'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Lưỡi cưa gỗ 185mm 60 răng cho đường cắt mịn, lắp vừa các máy cưa đĩa cầm tay thông dụng.',
    moTa:
      '<p>Lưỡi cưa Makita P-67963 đường kính 185mm với 60 răng hợp kim, chuyên cho các đường cắt gỗ cần độ mịn cao như ván ép, gỗ công nghiệp và gỗ tự nhiên.</p><p>Răng cắt phủ hợp kim giữ độ bén lâu, thân lưỡi cân bằng tốt giúp máy chạy êm, ít rung.</p><p>Hàng chính hãng Makita, SWE Việt Nam bảo hành 12 tháng theo tiêu chuẩn hãng.</p>',
  },
  {
    ten: 'Thùng đựng máy kèm phụ kiện Makita 183N93-7',
    thuongHieu: 'Makita',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 463430,
    giaBan: 259000,
    daBan: 99,
    thongSo: [
      ['Model', '183N93-7'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Thùng nhựa chính hãng Makita dùng đựng máy khoan, máy vặn vít cùng phụ kiện, khóa lẫy chắc chắn dễ mang theo.',
    moTa:
      '<p>Thùng đựng máy Makita 183N93-7 được thiết kế để chứa máy khoan, máy vặn vít dùng pin cùng pin sạc và phụ kiện đi kèm, giữ đồ nghề luôn ngăn nắp.</p><p>Nhựa cứng chịu lực tốt, khóa lẫy đóng mở nhanh, tay xách đúc liền thoải mái khi di chuyển.</p><p>SWE Việt Nam giao hàng chính hãng, bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Bộ 10 đầu tuýp dài 1/2" Thép Cr-mo Total THKISD12102L',
    thuongHieu: 'Total',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 550000,
    giaBan: 539000,
    daBan: 42,
    thongSo: [
      ['Model', 'THKISD12102L'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Bộ 10 đầu tuýp dài chuẩn 1/2 inch bằng thép Cr-Mo chịu lực, dùng được cho cả súng siết bu lông khí nén.',
    moTa:
      '<p>Bộ đầu tuýp Total THKISD12102L gồm 10 chi tiết dạng dài chuẩn 1/2 inch, đáp ứng các vị trí bu lông nằm sâu mà tuýp ngắn không với tới.</p><p>Thép Cr-Mo tôi luyện chịu được mô-men xoắn lớn của súng siết khí nén, bề mặt phun cát chống trượt tay.</p><p>SWE Việt Nam cam kết hàng Total chính hãng, bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Hộp đựng dụng cụ có ngăn kéo và bánh xe Milwaukee 48-22-8420',
    thuongHieu: 'Milwaukee',
    danhMucSlug: 'cong-cu-dung-cu',
    giaGoc: 7000000,
    giaBan: 5990000,
    daBan: 0,
    thongSo: [
      ['Model', '48-22-8420'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Hộp đồ nghề PACKOUT có ngăn kéo và bánh xe lớn, kéo đi nhẹ nhàng trên nền công trường gồ ghề.',
    moTa:
      '<p>Milwaukee 48-22-8420 là hộp dụng cụ dạng vali kéo thuộc hệ PACKOUT, tích hợp ngăn kéo chia ô và bánh xe chịu tải giúp vận chuyển lượng lớn đồ nghề mà không tốn sức.</p><p>Khung nhựa gia cường chịu va đập, mặt trên ghép chồng được với các thùng PACKOUT khác thành trạm dụng cụ di động.</p><p>Sản phẩm chính hãng, SWE Việt Nam bảo hành 12 tháng và giao hàng toàn quốc.</p>',
  },

  // ---------------- Thiết Bị Dùng Pin ----------------
  {
    ten: 'Máy siết bu lông dùng pin 18V Makita DTW700RTJ',
    thuongHieu: 'Makita',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 11392920,
    giaBan: null,
    daBan: 7,
    thongSo: [
      ['Model', 'DTW700RTJ'],
      ['Động cơ', 'Không Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy siết bu lông pin 18V động cơ không chổi than, lực siết mạnh mẽ cho gara ô tô và lắp dựng kết cấu thép.',
    moTa:
      '<p>Makita DTW700RTJ là máy siết bu lông chạy pin 18V dùng động cơ không chổi than, cho lực siết lớn để tháo lắp bu lông bánh xe, kết cấu thép và máy móc công nghiệp.</p><p>Nhiều cấp chỉnh lực giúp kiểm soát chính xác, thân máy đầm chắc và bền bỉ theo chuẩn Makita.</p><p>Bộ sản phẩm chính hãng đầy đủ pin sạc, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Pin Dewalt DCB184-KR 20V-5.0Ah',
    thuongHieu: 'Dewalt',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 1620000,
    giaBan: 1199000,
    daBan: 3028,
    thongSo: [
      ['Model', 'DCB184-KR'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 tháng'],
    ],
    moTaNgan:
      'Pin Li-ion 20V dung lượng 5.0Ah cho hệ máy Dewalt, chạy lâu hơn hẳn pin tiêu chuẩn mà kích thước vẫn gọn.',
    moTa:
      '<p>Pin Dewalt DCB184-KR dung lượng 5.0Ah dùng chung cho hệ máy pin Dewalt 20V MAX, từ máy khoan, máy vặn vít đến máy cắt.</p><p>Cell pin chất lượng cao cho thời gian làm việc dài, có đèn báo dung lượng tiện theo dõi khi thi công.</p><p>SWE Việt Nam bán hàng chính hãng, bảo hành 12 tháng theo chính sách hãng.</p>',
  },
  {
    ten: 'Pin Dekton 21V 8.0Ah M21-B8150PRO (Cell Tabless)',
    thuongHieu: 'Dekton',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 2090000,
    giaBan: 1690000,
    daBan: 0,
    thongSo: [
      ['Model', 'M21-B8150PRO'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Pin Dekton 21V 8.0Ah dùng công nghệ cell Tabless thoát nhiệt nhanh, hợp với máy cần dòng xả lớn.',
    moTa:
      '<p>Pin Dekton M21-B8150PRO 21V dung lượng 8.0Ah trang bị cell Tabless thế hệ mới, giảm nội trở và tỏa nhiệt tốt hơn khi máy kéo dòng cao.</p><p>Dung lượng lớn phù hợp cho máy siết bu lông, máy cắt, máy xịt rửa dùng chung chân pin Dekton M21.</p><p>Hàng chính hãng Dekton, SWE Việt Nam bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy vặn vít dùng pin 16V Dekton D16-CV180XPRO (2 Pin 2.0Ah & 1 sạc)',
    thuongHieu: 'Dekton',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 2160000,
    giaBan: 1600000,
    daBan: 1,
    thongSo: [
      ['Model', 'D16-CV180XPRO-CB'],
      ['Động cơ', 'Không Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy vặn vít pin 16V không chổi than kèm 2 pin và sạc, gọn nhẹ cho lắp đặt nội thất, điện nước.',
    moTa:
      '<p>Dekton D16-CV180XPRO là máy vặn vít dùng pin 16V với động cơ không chổi than bền bỉ, thích hợp bắn vít thạch cao, lắp ráp nội thất và sửa chữa điện nước.</p><p>Trọn bộ gồm 2 pin 2.0Ah và 1 sạc giúp làm việc liên tục không gián đoạn, đèn LED trợ sáng ở góc tối.</p><p>SWE Việt Nam cam kết hàng chính hãng, bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy siết bu lông dùng pin 18V Makita DTW190RFJX',
    thuongHieu: 'Makita',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 5896800,
    giaBan: 5490000,
    daBan: 40,
    thongSo: [
      ['Model', 'DTW190RFJX'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy siết bu lông pin 18V Makita kèm phụ kiện, lực siết ổn định cho công việc lắp ráp và sửa chữa thường xuyên.',
    moTa:
      '<p>Makita DTW190RFJX mang lực siết khỏe trong thân máy pin 18V gọn gàng, phục vụ tháo lắp bu lông ốc vít trong sửa chữa xe máy, ô tô và cơ khí dân dụng.</p><p>Báng cầm bọc cao su chống trượt, công tắc đảo chiều nhanh giúp thao tác liền mạch cả ngày.</p><p>Bộ máy chính hãng đầy đủ pin, sạc và hộp đựng — SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Máy khoan động lực dùng pin 18V Makita HP488DWAE',
    thuongHieu: 'Makita',
    danhMucSlug: 'thiet-bi-dung-pin',
    giaGoc: 3409560,
    giaBan: 3350000,
    daBan: 115,
    thongSo: [
      ['Model', 'HP488DWAE'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy khoan động lực pin 18V khoan được cả tường gạch lẫn gỗ, thép, kèm 2 pin và sạc dùng ngay.',
    moTa:
      '<p>Makita HP488DWAE là máy khoan động lực dùng pin 18V với chế độ khoan búa cho tường gạch, kết hợp khoan thường và bắt vít trên gỗ, kim loại.</p><p>Trọn bộ 2 pin và sạc giúp thợ thi công cả buổi không lo hết điện, khớp chỉnh lực nhiều nấc thao tác linh hoạt.</p><p>SWE Việt Nam giao máy chính hãng Makita, bảo hành 6 tháng.</p>',
  },

  // ---------------- Dụng Cụ Điện ----------------
  {
    ten: 'Máy cắt sắt Bosch GCO 14-24',
    thuongHieu: 'Bosch',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 3843000,
    giaBan: 3745000,
    daBan: 97,
    thongSo: [
      ['Model', '0601B371K0'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng Chính Hãng'],
    ],
    moTaNgan:
      'Máy cắt sắt bàn dùng đá cắt 355mm công suất lớn của Bosch, cắt nhanh thép hộp, thép thanh cho xưởng cơ khí.',
    moTa:
      '<p>Bosch GCO 14-24 là máy cắt sắt bàn dùng đá cắt 355mm, xử lý nhanh thép hộp, thép ống và thép thanh trong gia công cơ khí, làm cửa sắt.</p><p>Động cơ khỏe kết hợp ê tô kẹp xoay góc giúp đường cắt thẳng, cắt vát chuẩn xác.</p><p>Máy chính hãng Bosch, SWE Việt Nam bảo hành 12 tháng toàn quốc.</p>',
  },
  {
    ten: 'Máy cắt sắt bàn Makita M2401B (355mm)',
    thuongHieu: 'Makita',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 2918160,
    giaBan: 2548000,
    daBan: 269,
    thongSo: [
      ['Model', 'M2401B'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Thái Lan'],
      ['Bảo hành', '6 Tháng'],
      ['Đường kính lưỡi', '355mm'],
      ['Công suất', '2000W'],
    ],
    moTaNgan:
      'Máy cắt sắt bàn 355mm công suất 2000W dòng M-series bền bỉ, lựa chọn kinh tế cho xưởng nhỏ.',
    moTa:
      '<p>Makita M2401B dùng lưỡi cắt 355mm với động cơ 2000W, cắt gọn thép hộp, sắt xây dựng với chi phí đầu tư hợp lý.</p><p>Tấm chắn tia lửa và khóa an toàn giúp thao tác yên tâm, chân đế vững hạn chế rung khi cắt.</p><p>SWE Việt Nam phân phối chính hãng, bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy khoan búa Bosch GBH 2-26DRE 800W',
    thuongHieu: 'Bosch',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 4048000,
    giaBan: 3499000,
    daBan: 300,
    thongSo: [
      ['Model', '0611253704'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy khoan búa 800W chuôi SDS-plus quen thuộc của Bosch, khoan bê tông êm tay và cực bền.',
    moTa:
      '<p>Bosch GBH 2-26DRE là dòng khoan búa 800W chuôi SDS-plus được thợ xây dựng tin dùng nhiều năm nhờ độ bền và lực đục ổn định.</p><p>Ba chế độ khoan thường, khoan búa và đục nhẹ đáp ứng từ khoan bê tông tới đục gạch ốp, kèm ly hợp an toàn chống kẹt mũi.</p><p>Máy chính hãng Bosch, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Máy cắt sắt Dewalt D28730-B1',
    thuongHieu: 'Dewalt',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 4350000,
    giaBan: 2680000,
    daBan: 176,
    thongSo: [
      ['Model', 'D28730-B1'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Ấn Độ'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy cắt sắt bàn Dewalt động cơ khỏe, cắt nhanh thép hộp và thép thanh, hợp cường độ làm việc cao ở xưởng.',
    moTa:
      '<p>Dewalt D28730-B1 là máy cắt sắt bàn cho xưởng cơ khí và đội thi công, cắt mượt thép hộp, thép V, thép tròn với năng suất cao.</p><p>Kết cấu chắc chắn, ê tô kẹp phôi điều chỉnh nhanh giúp đường cắt ổn định và an toàn.</p><p>Sản phẩm chính hãng Dewalt, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Máy khoan búa 26 phụ kiện Makita M8103KX2B',
    thuongHieu: 'Makita',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 1058400,
    giaBan: 699000,
    daBan: 804,
    thongSo: [
      ['Model', 'M8103KX2B'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Thái Lan'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy khoan động lực kèm vali 26 phụ kiện, một bộ đủ khoan tường, khoan gỗ, bắt vít quanh nhà.',
    moTa:
      '<p>Makita M8103KX2B là bộ máy khoan búa kèm 26 phụ kiện gồm mũi khoan tường, khoan gỗ, khoan sắt và đầu bắt vít, mua một lần dùng cho mọi việc lặt vặt trong nhà.</p><p>Chế độ khoan búa xử lý tường gạch dễ dàng, thân máy nhỏ gọn hợp tay người dùng phổ thông.</p><p>SWE Việt Nam bán hàng chính hãng Makita, bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy Khoan Động Lực Bosch GSB 16RE',
    thuongHieu: 'Bosch',
    danhMucSlug: 'dung-cu-dien',
    giaGoc: 1780000,
    giaBan: 1649000,
    daBan: 430,
    thongSo: [
      ['Model', '06012281K1'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy khoan động lực Bosch nhỏ gọn, đảo chiều và chỉnh tốc vô cấp, đáp ứng khoan tường lẫn bắt vít gia đình.',
    moTa:
      '<p>Bosch GSB 16RE là máy khoan động lực cầm tay được ưa chuộng cho sửa chữa nhà cửa: khoan tường gạch, khoan gỗ, khoan kim loại và bắt vít.</p><p>Công tắc chỉnh tốc vô cấp cùng nút đảo chiều tiện dụng, vỏ máy bền bỉ theo tiêu chuẩn Bosch.</p><p>Hàng chính hãng, bảo hành 12 tháng tại SWE Việt Nam.</p>',
  },

  // ---------------- Thiết Bị Nâng Đỡ ----------------
  {
    ten: 'Xe đẩy hàng 4 bánh Jumbo HL-110C',
    thuongHieu: 'JUMBO',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 2250000,
    giaBan: 1990000,
    daBan: 80,
    thongSo: [
      ['Model', 'HL-110C'],
      ['Xuất xứ', 'Thái Lan'],
      ['Bảo hành', '12 tháng'],
      ['Tải trọng', '170Kg'],
    ],
    moTaNgan:
      'Xe đẩy hàng 4 bánh sàn thép tải trọng 170kg, tay đẩy gập gọn cất trong kho hay cốp xe đều tiện.',
    moTa:
      '<p>Xe đẩy hàng Jumbo HL-110C với sàn thép sơn tĩnh điện chịu tải 170kg, chuyên chở hàng hóa trong kho xưởng, cửa hàng và văn phòng.</p><p>Bốn bánh xe cao su di chuyển êm không hằn sàn, tay đẩy gập phẳng giúp cất giữ gọn gàng.</p><p>SWE Việt Nam giao hàng chính hãng Jumbo Thái Lan, bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Xe đẩy tay 2 bánh Phong Thạnh X370',
    thuongHieu: 'Phong Thạnh',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 1210000,
    giaBan: 1039000,
    daBan: 59,
    thongSo: [
      ['Model', 'X370'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '24 Tháng'],
    ],
    moTaNgan:
      'Xe đẩy tay 2 bánh kiểu chữ L hàng Việt Nam chắc chắn, chuyên kéo hàng thùng, bao tải trong lối đi hẹp.',
    moTa:
      '<p>Xe đẩy tay Phong Thạnh X370 dạng 2 bánh chữ L thuận tiện luồn lách trong kho chật và ngõ nhỏ, phù hợp chở thùng carton, bao gạo, bình nước.</p><p>Khung thép hàn chắc chắn sản xuất tại Việt Nam, bánh hơi giảm xóc khi qua nền gồ ghề.</p><p>SWE Việt Nam cam kết chính hãng với bảo hành lên tới 24 tháng.</p>',
  },
  {
    ten: 'Xe đẩy hàng tay gấp Phong Thạnh XTB 100DG',
    thuongHieu: 'Phong Thạnh',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 1650000,
    giaBan: 1570000,
    daBan: 267,
    thongSo: [
      ['Model', 'XTB100DG'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '12 Tháng'],
      ['Tải trọng', '200Kg'],
    ],
    moTaNgan:
      'Xe đẩy sàn nhựa tay gấp tải 200kg của Phong Thạnh, bền bỉ cho kho hàng và cửa hàng tạp hóa.',
    moTa:
      '<p>Phong Thạnh XTB 100DG có sàn nhựa nguyên sinh chịu tải 200kg, tay đẩy gập nhanh chỉ với một thao tác, tiết kiệm diện tích khi không dùng.</p><p>Bánh xe đúc êm ái, khung sườn thép mạ bền bỉ — thương hiệu xe đẩy Việt Nam quen thuộc nhiều năm.</p><p>Mua tại SWE Việt Nam được bảo hành chính hãng 12 tháng.</p>',
  },
  {
    ten: 'Xe đẩy hàng 4 bánh Black&Decker BXWT-H303',
    thuongHieu: 'Black & Decker',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 799000,
    giaBan: 719000,
    daBan: 7,
    thongSo: [
      ['Model', 'H303'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Xe đẩy gấp gọn 4 bánh nhỏ nhẹ, hợp chở hàng nhẹ trong văn phòng, cửa hàng hay gia đình.',
    moTa:
      '<p>Xe đẩy Black & Decker BXWT-H303 hướng đến nhu cầu gia đình và văn phòng: chở thùng nước, hàng tạp hóa, hành lý gọn nhẹ.</p><p>Sàn nhựa ABS cứng cáp, tay kéo gập sát sàn để cất sau ghế ô tô hoặc gầm bàn.</p><p>SWE Việt Nam phân phối chính hãng, bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Xe đẩy hàng 4 bánh Jumbo HB-210C',
    thuongHieu: 'JUMBO',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 3500000,
    giaBan: 2950000,
    daBan: 126,
    thongSo: [
      ['Model', 'HB-210 C'],
      ['Xuất xứ', 'Thái Lan'],
      ['Bảo hành', '12 tháng'],
      ['Tải trọng', '300Kg'],
    ],
    moTaNgan:
      'Xe đẩy hàng 4 bánh Thái Lan tải trọng 300kg, sàn rộng chở được kiện hàng lớn trong kho xưởng.',
    moTa:
      '<p>Jumbo HB-210C là dòng xe đẩy tải nặng với sức chở tới 300kg, sàn thép rộng rãi phù hợp kho vận, siêu thị và nhà xưởng.</p><p>Bánh xe chịu lực quay 360 độ giúp đánh lái nhẹ nhàng dù chất đầy hàng, tay đẩy gập tiện cất giữ.</p><p>Hàng Jumbo Thái Lan chính hãng, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Xe đẩy hàng Phong Thạnh XTL 130DS',
    thuongHieu: 'Phong Thạnh',
    danhMucSlug: 'thiet-bi-nang-do',
    giaGoc: 2950000,
    giaBan: 2789000,
    daBan: 229,
    thongSo: [
      ['Model', 'XTL 130DS'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '24 Tháng'],
    ],
    moTaNgan:
      'Xe đẩy hàng sàn lưới thép của Phong Thạnh, kết cấu vững cho tải nặng, bảo hành dài tới 24 tháng.',
    moTa:
      '<p>Phong Thạnh XTL 130DS dùng sàn lưới thép hàn chắc chắn, thoát nước tốt nên hợp cả môi trường kho lạnh, chợ đầu mối.</p><p>Khung sườn thép dày sản xuất trong nước, bánh xe chịu tải bền bỉ theo thời gian.</p><p>SWE Việt Nam giao hàng chính hãng kèm bảo hành 24 tháng.</p>',
  },

  // ---------------- Thang Nhôm (nhóm đồ nghề cầm tay theo khảo sát) ----------------
  {
    ten: 'Kìm tuốt dây 7 trong 1 Milwaukee 48-22-3078',
    thuongHieu: 'Milwaukee',
    danhMucSlug: 'thang-nhom',
    giaGoc: 470000,
    giaBan: 390000,
    daBan: 439,
    thongSo: [
      ['Model', '48-22-3078'],
      ['Xuất xứ', 'Trung Quốc'],
    ],
    moTaNgan:
      'Kìm tuốt dây đa năng 7 trong 1: tuốt vỏ, cắt dây, uốn khoen và vặn vít — một cây thay cả túi đồ.',
    moTa:
      '<p>Kìm Milwaukee 48-22-3078 gộp 7 chức năng trong một cây kìm: tuốt vỏ dây nhiều cỡ, cắt dây, uốn khoen, kẹp và vặn vít, giúp thợ điện thao tác nhanh gọn.</p><p>Lưỡi thép rèn sắc bén, tay cầm bọc êm chống trượt khi làm việc lâu.</p><p>Hàng chính hãng Milwaukee, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Kìm tuốt dây điện, tuốt dây cáp Milwaukee 48-22-6109',
    thuongHieu: 'Milwaukee',
    danhMucSlug: 'thang-nhom',
    giaGoc: 461000,
    giaBan: null,
    daBan: 5,
    thongSo: [
      ['Model', '48-22-6109'],
      ['Xuất xứ', 'Trung Quốc'],
    ],
    moTaNgan:
      'Kìm chuyên tuốt dây điện và dây cáp, rãnh tuốt định cỡ chuẩn giúp không phạm lõi đồng.',
    moTa:
      '<p>Milwaukee 48-22-6109 là kìm tuốt dây chuyên dụng cho thợ điện, các rãnh tuốt định cỡ sẵn giúp bóc vỏ cách điện nhanh mà không làm xước lõi.</p><p>Kết cấu thép bền, lò xo tự mở giảm mỏi tay khi thao tác hàng trăm mối nối mỗi ngày.</p><p>SWE Việt Nam cam kết hàng Milwaukee chính hãng, bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Bộ 31 tua vít Total TACSD30316',
    thuongHieu: 'Total',
    danhMucSlug: 'thang-nhom',
    giaGoc: 104000,
    giaBan: 99000,
    daBan: 19,
    thongSo: [
      ['Model', 'TACSD30316'],
      ['Xuất xứ', 'Trung Quốc'],
    ],
    moTaNgan:
      'Bộ 31 món gồm tay vặn và đầu vít đủ chuẩn dẹp, bake, lục giác, sao — xử lý mọi con vít trong nhà.',
    moTa:
      '<p>Bộ tua vít Total TACSD30316 gồm 31 chi tiết với tay vặn và loạt đầu vít dẹp, bake, lục giác, hoa thị, đáp ứng từ sửa đồ điện tử tới lắp ráp nội thất.</p><p>Đầu vít thép Cr-V tôi cứng, hộp nhựa chia ngăn giúp tìm nhanh đúng cỡ cần dùng.</p><p>Sản phẩm chính hãng Total do SWE Việt Nam phân phối, bảo hành theo chính sách hãng.</p>',
  },
  {
    ten: 'Băng keo cao su 3M Temflex 2155',
    thuongHieu: '3M',
    danhMucSlug: 'thang-nhom',
    giaGoc: 99000,
    giaBan: 70000,
    daBan: 0,
    thongSo: [
      ['Model', '2155'],
      ['Xuất xứ', 'Việt Nam'],
    ],
    moTaNgan:
      'Băng keo cao su tự dính 3M chuyên bọc cách điện và chống ẩm cho mối nối dây, cáp điện.',
    moTa:
      '<p>Băng keo cao su 3M Temflex 2155 tự hợp nhất khi quấn, tạo lớp đệm cách điện và chống ẩm tin cậy cho các mối nối dây, đầu cáp hạ thế.</p><p>Chất cao su co giãn ôm khít bề mặt không đều, chịu thời tiết tốt khi thi công ngoài trời.</p><p>SWE Việt Nam bán hàng 3M chính hãng, nguồn gốc rõ ràng.</p>',
  },
  {
    ten: 'Kìm đa năng cách điện 1000V Wiha 26708 (180mm)',
    thuongHieu: 'WIHA',
    danhMucSlug: 'thang-nhom',
    giaGoc: 500000,
    giaBan: 365000,
    daBan: 3,
    thongSo: [
      ['Model', '26708'],
      ['Xuất xứ', 'Germany'],
    ],
    moTaNgan:
      'Kìm đa năng 180mm cách điện chuẩn 1000V của Wiha Đức, an toàn khi thao tác gần nguồn điện.',
    moTa:
      '<p>Kìm Wiha 26708 dài 180mm đạt chuẩn cách điện VDE 1000V, cho phép thợ điện kẹp, cắt, uốn dây an toàn ngay cả khi làm việc gần thiết bị mang điện.</p><p>Thép công cụ Đức tôi chính xác giữ lưỡi cắt bén lâu, tay cầm hai lớp dễ nhận biết khi hao mòn.</p><p>Hàng chính hãng Wiha, SWE Việt Nam kiểm tra kỹ trước khi giao.</p>',
  },
  {
    ten: 'Bộ kìm cách điện 3 chi tiết Sata 09-261 (09261)',
    thuongHieu: 'SATA',
    danhMucSlug: 'thang-nhom',
    giaGoc: 1784000,
    giaBan: 1250000,
    daBan: 0,
    thongSo: [
      ['Model', '09261'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Bộ 3 kìm cách điện gồm kìm điện, kìm cắt và kìm nhọn đạt chuẩn an toàn cho thợ điện chuyên nghiệp.',
    moTa:
      '<p>Bộ Sata 09261 trang bị đủ ba cây kìm thiết yếu — kìm điện, kìm cắt và kìm mũi nhọn — với tay cầm cách điện đạt chuẩn an toàn cho công việc điện dân dụng và công nghiệp.</p><p>Thép hợp kim rèn nguyên khối, khớp kìm êm và lưỡi cắt bén giúp thao tác chuẩn xác.</p><p>SWE Việt Nam giao hàng chính hãng Sata, bảo hành 6 tháng.</p>',
  },

  // ---------------- Máy Hàn & Phụ Kiện ----------------
  {
    ten: 'Máy hàn điện tử mini Hukan G2-200MINI (IGBT)',
    thuongHieu: 'Hukan',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 2164000,
    giaBan: 1790000,
    daBan: 0,
    thongSo: [
      ['Model', 'G2-200MINI'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
      ['Hàn liên tục', '1.6 - 3.2mm'],
    ],
    moTaNgan:
      'Máy hàn que mini công nghệ IGBT nhẹ tay, hàn que 1.6-3.2mm êm mối, hợp thợ sửa chữa di động.',
    moTa:
      '<p>Hukan G2-200MINI là máy hàn que điện tử dùng board IGBT thế hệ 2, thân máy nhỏ nhẹ dễ xách theo công trình nhưng vẫn hàn liên tục que 1.6-3.2mm.</p><p>Chức năng chống dính que và mồi hồ quang nhanh giúp người mới cũng lên mối đẹp.</p><p>Máy chính hãng Hukan, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Máy Hàn Que Điện Tử Jasic ARC200T',
    thuongHieu: 'Jasic',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 1750000,
    giaBan: 1700000,
    daBan: 375,
    thongSo: [
      ['Model', 'ARC200T'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '18 Tháng'],
      ['Hàn liên tục', '1.6 - 4mm'],
    ],
    moTaNgan:
      'Máy hàn que điện tử Jasic bền bỉ, hàn liên tục que 1.6-4mm, chuẩn mực trong tầm giá cho xưởng nhỏ.',
    moTa:
      '<p>Jasic ARC200T là dòng máy hàn que quen mặt ở các xưởng cơ khí Việt Nam nhờ độ lì và ổn định, hàn tốt que từ 1.6 đến 4mm.</p><p>Dòng hàn giữ ổn định ngay cả khi điện áp chập chờn, quạt tản nhiệt lớn cho phép hàn liên tục thời gian dài.</p><p>SWE Việt Nam phân phối chính hãng với bảo hành dài 18 tháng.</p>',
  },
  {
    ten: 'Máy hàn que điện tử Hồng Ký HK 200N',
    thuongHieu: 'Hồng Ký',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 2690000,
    giaBan: null,
    daBan: 262,
    thongSo: [
      ['Model', 'HK 200N'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '18 Tháng'],
      ['Hàn liên tục', '1.6 - 3.2mm'],
      ['Trọng lượng', '5.5kg'],
    ],
    moTaNgan:
      'Máy hàn que thương hiệu Việt Hồng Ký nặng chỉ 5.5kg, mồi hồ quang nhạy, bảo hành tới 18 tháng.',
    moTa:
      '<p>Hồng Ký HK 200N là máy hàn que điện tử sản xuất tại Việt Nam, thân máy 5.5kg gọn nhẹ, hàn ngọt que 1.6-3.2mm cho cơ khí dân dụng và sửa chữa nông cụ.</p><p>Board mạch được nhiệt đới hóa phù hợp khí hậu nóng ẩm, linh kiện thay thế sẵn có trên toàn quốc.</p><p>SWE Việt Nam cam kết hàng chính hãng, bảo hành 18 tháng.</p>',
  },
  {
    ten: 'Máy hàn lạnh hàn Inox JASIC TIG250S W228 Hàn không cần đánh bóng',
    thuongHieu: 'Jasic',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 8700000,
    giaBan: 8265000,
    daBan: 66,
    thongSo: [
      ['Model', 'TIG250S W228'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '18 Tháng'],
    ],
    moTaNgan:
      'Máy hàn TIG kiêm hàn lạnh cho mối hàn inox sáng đẹp, gần như không cần đánh bóng lại.',
    moTa:
      '<p>Jasic TIG250S W228 hỗ trợ chế độ hàn lạnh xung nhuyễn, cho mối hàn inox mỏng phẳng mịn và ít biến màu, tiết kiệm hẳn công đánh bóng.</p><p>Máy phù hợp làm cửa inox, lan can, bồn bể — những hạng mục đòi hỏi thẩm mỹ mối hàn cao.</p><p>Hàng Jasic chính hãng tại SWE Việt Nam, bảo hành 18 tháng.</p>',
  },
  {
    ten: 'Máy Hàn Tig Jasic Tig 250A W227',
    thuongHieu: 'Jasic',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 8900000,
    giaBan: 8455000,
    daBan: 38,
    thongSo: [
      ['Model', 'Tig 250A W227'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '18 Tháng'],
    ],
    moTaNgan:
      'Máy hàn TIG 250A hai chức năng TIG và hàn que, đáp ứng gia công inox lẫn sắt thép hằng ngày.',
    moTa:
      '<p>Jasic Tig 250A W227 gộp hai chế độ TIG và hàn que trong một máy, linh hoạt chuyển giữa hàn inox thẩm mỹ và hàn kết cấu sắt thép.</p><p>Mồi hồ quang cao tần không cần chạm giúp giảm lem mối hàn ở đầu que.</p><p>SWE Việt Nam giao máy chính hãng, bảo hành 18 tháng toàn quốc.</p>',
  },
  {
    ten: 'Máy hàn que mini Hồng Ký HKM1250',
    thuongHieu: 'Hồng Ký',
    danhMucSlug: 'may-han-phu-kien',
    giaGoc: 1390000,
    giaBan: null,
    daBan: 232,
    thongSo: [
      ['Model', 'HKM1250'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '18 Tháng'],
      ['Hàn liên tục', '1.6 - 3.2mm'],
    ],
    moTaNgan:
      'Máy hàn que mini giá mềm của Hồng Ký, đủ sức hàn que 1.6-3.2mm cho việc sửa vặt quanh nhà.',
    moTa:
      '<p>Hồng Ký HKM1250 nhắm tới người dùng gia đình và thợ bán chuyên: máy nhỏ gọn, cắm điện dân dụng hàn ngay que 1.6-3.2mm.</p><p>Tính năng chống dính và bảo vệ quá nhiệt giúp máy bền, người mới học hàn cũng dễ làm quen.</p><p>Sản phẩm Việt Nam chính hãng, SWE Việt Nam bảo hành 18 tháng.</p>',
  },

  // ---------------- Dụng Cụ Khí Nén ----------------
  {
    ten: 'Cuộn ống hơi 5m Total THT11051-3',
    thuongHieu: 'Total',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 107000,
    giaBan: 102000,
    daBan: 48,
    thongSo: [
      ['Model', 'THT11051-3'],
      ['Xuất xứ', 'Trung Quốc'],
    ],
    moTaNgan:
      'Cuộn ống dẫn hơi 5m đầu nối nhanh, phụ kiện gọn nhẹ cho máy nén khí gia đình và tiệm sửa xe.',
    moTa:
      '<p>Ống hơi Total THT11051-3 dài 5m kèm đầu nối nhanh hai phía, lắp thẳng vào máy nén khí để cấp hơi cho súng xịt, súng bắn vít.</p><p>Vỏ ống dẻo chịu áp tốt, khó gập xoắn khi kéo quanh khu vực làm việc.</p><p>SWE Việt Nam bán hàng Total chính hãng, đổi trả trong 7 ngày nếu lỗi.</p>',
  },
  {
    ten: '15m Cuộn dây hơi xoắn dẫn khí nén 5x8mm Total THT11151-3',
    thuongHieu: 'Total',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 231000,
    giaBan: 226000,
    daBan: 15,
    thongSo: [['Model', 'THT11151-3']],
    moTaNgan:
      'Dây hơi xoắn 15m cỡ 5x8mm tự thu gọn sau khi kéo, giữ khu làm việc luôn ngăn nắp.',
    moTa:
      '<p>Dây hơi xoắn Total THT11151-3 dài 15m đường kính 5x8mm, thiết kế lò xo tự co rút giúp dây không bò lan ra sàn xưởng.</p><p>Chất liệu PU đàn hồi chịu áp lực khí nén ổn định, hai đầu nối nhanh tháo lắp tiện lợi.</p><p>Hàng chính hãng Total do SWE Việt Nam cung cấp.</p>',
  },
  {
    ten: '6mm Máy mài thẳng khí nén Shinano SI-2001S-6',
    thuongHieu: 'Shinano',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 2400000,
    giaBan: 1990000,
    daBan: 1,
    thongSo: [
      ['Model', 'SI-2001S-6'],
      ['Xuất xứ', 'Nhật Bản'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy mài thẳng khí nén Nhật Bản kẹp mũi 6mm, tốc độ cao cho việc mài khuôn và làm nguội chi tiết.',
    moTa:
      '<p>Shinano SI-2001S-6 là máy mài thẳng chạy khí nén sản xuất tại Nhật Bản, đầu kẹp 6mm quay tốc độ cao phục vụ mài khuôn mẫu, vát mép và đánh bavia chi tiết cơ khí.</p><p>Thân máy hợp kim gọn nhẹ, độ rung thấp giúp mài chính xác trong thời gian dài.</p><p>SWE Việt Nam nhập hàng chính hãng, bảo hành 12 tháng.</p>',
  },
  {
    ten: '150mm Máy chà nhám tròn Shinano SI-3111-6',
    thuongHieu: 'Shinano',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 6322000,
    giaBan: 4789000,
    daBan: 0,
    thongSo: [
      ['Model', 'SI-3111-6'],
      ['Xuất xứ', 'Nhật Bản'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy chà nhám tròn khí nén đế 150mm hàng Nhật, quỹ đạo lệch tâm cho bề mặt mịn không xoáy.',
    moTa:
      '<p>Shinano SI-3111-6 dùng đế nhám 150mm chuyển động lệch tâm, chuyên xử lý bề mặt sơn ô tô, đồ gỗ và kim loại đạt độ mịn cao mà không để lại vết xoáy.</p><p>Chạy hoàn toàn bằng khí nén nên máy nhẹ, êm và bền hơn hẳn máy điện cùng cỡ.</p><p>Hàng Shinano Nhật Bản chính hãng, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Máy mài hơi 6mm màu trắng TOP PA-3201',
    thuongHieu: 'TOP',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 453000,
    giaBan: null,
    daBan: 25,
    thongSo: [
      ['Model', 'PA-3201'],
      ['Xuất xứ', 'Taiwan'],
    ],
    moTaNgan:
      'Máy mài hơi mini đầu kẹp 6mm giá kinh tế, đắc lực cho việc mài chi tiết nhỏ ở tiệm cơ khí.',
    moTa:
      '<p>TOP PA-3201 là máy mài hơi dạng bút đầu kẹp 6mm, nhỏ gọn để mài rãnh hẹp, đánh bóng khuôn và làm sạch mối hàn chi tiết nhỏ.</p><p>Van chỉnh gió ngay thân máy giúp kiểm soát tốc độ linh hoạt theo từng vật liệu.</p><p>SWE Việt Nam giao hàng TOP chính hãng xuất xứ Đài Loan.</p>',
  },
  {
    ten: '6mm Máy mài dùng khí nén Sata 02511',
    thuongHieu: 'SATA',
    danhMucSlug: 'dung-cu-khi-nen',
    giaGoc: 2605000,
    giaBan: 2450000,
    daBan: 17,
    thongSo: [
      ['Model', '02511'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 tháng'],
    ],
    moTaNgan:
      'Máy mài khí nén đầu kẹp 6mm của Sata, vòng tua cao và độ rung thấp cho đường mài sắc nét.',
    moTa:
      '<p>Sata 02511 là máy mài thẳng khí nén chuyên nghiệp với đầu kẹp 6mm, dùng cho mài khuôn, phá cạnh sắc và xử lý bề mặt trong gia công chính xác.</p><p>Thân máy hợp kim chắc chắn, cửa xả khí hướng ra sau tránh thổi bụi vào phôi.</p><p>SWE Việt Nam cam kết hàng chính hãng Sata, bảo hành 6 tháng.</p>',
  },

  // ---------------- Thiết Bị Dùng Nước ----------------
  {
    ten: 'Máy xịt rửa áp lực 790W Dekton DK-CWR2200VTG (Motor lõi đồng)',
    thuongHieu: 'Dekton',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 2260000,
    giaBan: 1799000,
    daBan: 60,
    thongSo: [
      ['Model', 'DK-CWR2200VTG'],
      ['Động cơ', 'Không Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Máy xịt rửa 790W motor lõi đồng không chổi than, áp lực mạnh rửa xe máy, ô tô tại nhà nhẹ nhàng.',
    moTa:
      '<p>Dekton DK-CWR2200VTG trang bị motor lõi đồng không chổi than 790W cho áp lực nước mạnh và tuổi thọ cao, đánh bay bùn đất bám trên xe, sân gạch, tường rào.</p><p>Kèm bình xà phòng tạo bọt và vòi phun điều chỉnh tia, thao tác rửa xe tại nhà đơn giản như ở tiệm.</p><p>SWE Việt Nam bảo hành chính hãng 12 tháng.</p>',
  },
  {
    ten: 'Súng xịt rửa áp lực cao (GEN 2) Hukan G2-GFB280Bar',
    thuongHieu: 'Hukan',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 936000,
    giaBan: 790000,
    daBan: 0,
    thongSo: [
      ['Model', 'G2-GFB280Bar'],
      ['Xuất xứ', 'Trung Quốc'],
    ],
    moTaNgan:
      'Súng xịt rửa thế hệ 2 chịu áp tới 280 bar, nâng cấp đáng giá cho máy rửa xe gia đình lẫn tiệm.',
    moTa:
      '<p>Súng xịt Hukan G2-GFB280Bar chịu áp lực làm việc tới 280 bar, lắp được cho nhiều dòng máy rửa xe thông dụng qua các đầu chuyển kèm theo.</p><p>Tay cò nhẹ chống mỏi, thân súng kim loại kín khít hạn chế rò rỉ khi dùng cường độ cao.</p><p>Hàng Hukan chính hãng, SWE Việt Nam hỗ trợ đổi trả trong 7 ngày.</p>',
  },
  {
    ten: 'Máy phun xịt rửa cao áp Bosch Universal AQT 125',
    thuongHieu: 'Bosch',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 3765000,
    giaBan: 3099000,
    daBan: 78,
    thongSo: [
      ['Model', '06008A7AK0'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy rửa xe cao áp dòng Universal của Bosch, áp lực ổn định kèm phụ kiện đủ dùng cho cả sân vườn.',
    moTa:
      '<p>Bosch Universal AQT 125 mang áp lực nước mạnh mẽ để rửa ô tô, xe máy, hiên nhà và đồ ngoại thất sân vườn.</p><p>Thiết kế đứng gọn gàng dễ cất, khớp nối nhanh giúp triển khai và thu dọn chỉ trong ít phút.</p><p>Máy chính hãng Bosch, SWE Việt Nam bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy phun xịt rửa áp lực cao Bosch Easy Aquatak 110',
    thuongHieu: 'Bosch',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 2509000,
    giaBan: 1869000,
    daBan: 25,
    thongSo: [
      ['Model', '06008A7FK0'],
      ['Động cơ', 'Chổi Than'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy rửa xe Easy Aquatak 110 nhỏ gọn dễ dùng, phù hợp nhu cầu xịt rửa nhẹ nhàng hằng tuần.',
    moTa:
      '<p>Bosch Easy Aquatak 110 hướng tới gia đình lần đầu sắm máy rửa xe: cắm điện, nối nước là dùng được ngay, không cần căn chỉnh phức tạp.</p><p>Súng phun kèm đầu chỉnh tia linh hoạt từ xối mạnh đến phun sương, trọng lượng nhẹ dễ di chuyển quanh nhà.</p><p>SWE Việt Nam giao máy chính hãng Bosch, bảo hành 6 tháng.</p>',
  },
  {
    ten: 'Máy hút bụi 3 chức năng 15L Stanley SL19301-4BA (900W)',
    thuongHieu: 'Stanley',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 1790000,
    giaBan: 1689000,
    daBan: 16,
    thongSo: [
      ['Model', 'SL19301-4BA'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '16 Tháng'],
    ],
    moTaNgan:
      'Máy hút bụi 15L ba chức năng hút khô, hút nước và thổi, công suất 900W cho gia đình lẫn xưởng gỗ.',
    moTa:
      '<p>Stanley SL19301-4BA gộp ba chức năng hút khô, hút nước và thổi bụi trong thùng chứa 15L, dọn được từ vụn gỗ, nước tràn đến bụi mịn góc nhà.</p><p>Động cơ 900W mạnh mẽ kèm bộ phụ kiện đầu hút đa dạng, bánh xe xoay giúp kéo máy nhẹ nhàng.</p><p>Hàng chính hãng Stanley, SWE Việt Nam bảo hành 16 tháng.</p>',
  },
  {
    ten: '790W Máy xịt rửa áp lực Dekton DK-CWR2200XPRO',
    thuongHieu: 'Dekton',
    danhMucSlug: 'thiet-bi-dung-nuoc',
    giaGoc: 2150000,
    giaBan: 1749000,
    daBan: 12,
    thongSo: [
      ['Model', 'DK-CWR2200XPRO'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Máy xịt rửa 790W bản XPRO của Dekton, đủ áp rửa sạch xe và sân nhà với giá dễ tiếp cận.',
    moTa:
      '<p>Dekton DK-CWR2200XPRO là lựa chọn kinh tế cho nhu cầu xịt rửa tại nhà: rửa xe máy, ô tô, chuồng trại và sân gạch.</p><p>Máy kèm vòi phun áp lực và bình bọt tuyết, ống nước đủ dài thao tác quanh xe thoải mái.</p><p>SWE Việt Nam cam kết chính hãng Dekton, bảo hành 6 tháng.</p>',
  },

  // ---------------- Phụ Tùng, Linh Kiện ----------------
  {
    ten: 'Đinh cuộn xoắn Pallet 2.1x32mm',
    thuongHieu: 'Đinh Lực',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 750000,
    giaBan: null,
    daBan: 0,
    thongSo: [
      ['Model', 'FS32V1'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '6 Tháng'],
      ['Thùng', '36 Cuộn'],
    ],
    moTaNgan:
      'Đinh cuộn thân xoắn 2.1x32mm chuyên đóng pallet gỗ bằng súng bắn đinh, bám gỗ chắc không lỏng mối.',
    moTa:
      '<p>Đinh cuộn xoắn Đinh Lực 2.1x32mm dùng cho súng bắn đinh cuộn trong sản xuất pallet, thùng gỗ và bao bì xuất khẩu.</p><p>Thân đinh xoắn tăng độ bám gấp nhiều lần đinh trơn, hàng sản xuất tại Việt Nam với nguồn cung ổn định theo thùng 36 cuộn.</p><p>SWE Việt Nam cung cấp giá tốt cho xưởng lấy số lượng.</p>',
  },
  {
    ten: 'Ổ cắm điện rulo 15m loại nhỏ 15A Lioa QN15-3-15A',
    thuongHieu: 'Lioa',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 720000,
    giaBan: 599000,
    daBan: 1,
    thongSo: [
      ['Model', 'QN15-3-15A'],
      ['Xuất xứ', 'Việt Nam'],
    ],
    moTaNgan:
      'Rulo cuốn dây 15m dòng 15A của Lioa, kéo điện ra sân vườn, công trình nhỏ an toàn gọn gàng.',
    moTa:
      '<p>Ổ cắm rulo Lioa QN15-3-15A tích hợp 15m dây trên tang cuốn quay tay, cấp điện xa cho máy khoan, máy cắt hay đèn chiếu sáng sự kiện.</p><p>Ổ cắm 3 chấu kèm công tắc và bảo vệ quá tải, dây đồng Lioa chuẩn Việt Nam an toàn khi dùng liên tục.</p><p>SWE Việt Nam bán hàng Lioa chính hãng.</p>',
  },
  {
    ten: 'Ổ cắm kéo dài kết hợp dây HYBRID 30M-20A',
    thuongHieu: 'Lioa',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 1482000,
    giaBan: 1240000,
    daBan: 11,
    thongSo: [
      ['Model', 'YBRIDX-30M-20A'],
      ['Xuất xứ', 'Việt Nam'],
      ['Bảo hành', '10 năm'],
    ],
    moTaNgan:
      'Bộ ổ cắm kéo dài 30m chịu dòng 20A, chuyên cấp nguồn cho thiết bị công suất lớn ngoài trời.',
    moTa:
      '<p>Bộ dây kéo dài Lioa HYBRID 30M-20A gồm 30m dây tiết diện lớn chịu dòng tới 20A, đáp ứng máy hàn, máy cắt và thiết bị công suất cao ở xa nguồn điện.</p><p>Phích và ổ cắm đúc liền chống tuột, vỏ dây dai chịu kéo quét trên nền bê tông.</p><p>Hàng Lioa chính hãng tại SWE Việt Nam, bảo hành dài hạn theo hãng.</p>',
  },
  {
    ten: 'Roto máy cắt nhôm LS1030N/LS1040 Makita 516718-8',
    thuongHieu: 'Makita',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 882327,
    giaBan: 849000,
    daBan: 13,
    thongSo: [
      ['Model', '516718-8'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Roto thay thế chính hãng cho máy cắt nhôm Makita LS1030N/LS1040, phục hồi máy khỏe như ban đầu.',
    moTa:
      '<p>Roto Makita 516718-8 là linh kiện thay thế chính hãng cho máy cắt nhôm LS1030N và LS1040, xử lý dứt điểm tình trạng máy yếu, đánh lửa do roto mòn.</p><p>Dây đồng quấn chuẩn nhà máy giúp máy chạy êm và giữ đúng công suất thiết kế.</p><p>SWE Việt Nam bảo hành linh kiện 6 tháng.</p>',
  },
  {
    ten: 'Rotor cho máy mài góc 9553b và 9553Nb',
    thuongHieu: 'Makita',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 349000,
    giaBan: 260000,
    daBan: 32,
    thongSo: [
      ['Model', '515619-7'],
      ['Xuất xứ', 'Trung Quốc'],
      ['Bảo hành', '12 Tháng'],
    ],
    moTaNgan:
      'Rotor thay thế cho máy mài góc Makita 9553B/9553NB, giúp máy hết yếu lửa và chạy êm trở lại.',
    moTa:
      '<p>Rotor 515619-7 dùng thay thế cho hai dòng máy mài góc Makita 9553B và 9553NB khi máy có dấu hiệu nóng bất thường, tia lửa lớn hoặc mất công suất.</p><p>Lõi thép và dây đồng gia công đúng thông số gốc, lắp vừa khít không cần chế sửa.</p><p>Linh kiện chính hãng, SWE Việt Nam bảo hành 12 tháng.</p>',
  },
  {
    ten: 'Rotor GWS 060 Bosch 1619P01844',
    thuongHieu: 'Bosch',
    danhMucSlug: 'phu-tung-linh-kien',
    giaGoc: 310000,
    giaBan: 280000,
    daBan: 21,
    thongSo: [
      ['Model', '1619P01844'],
      ['Bảo hành', '6 Tháng'],
    ],
    moTaNgan:
      'Rotor chính hãng cho máy mài góc Bosch GWS 060, thay nhanh để máy mài lấy lại sức mạnh vốn có.',
    moTa:
      '<p>Rotor Bosch 1619P01844 là phụ tùng chuẩn cho máy mài góc GWS 060, khắc phục tình trạng máy quay yếu, kêu lạ sau thời gian dài sử dụng.</p><p>Sản phẩm từ kênh linh kiện chính hãng Bosch nên độ bền và cân bằng động đạt chuẩn nhà máy.</p><p>SWE Việt Nam bảo hành 6 tháng, tư vấn chọn đúng mã phụ tùng.</p>',
  },
];

// Chọn slug danh mục cho sản phẩm: riêng nhóm Thang Nhôm, nếu tên là thang
// thật thì gắn vào danh mục con phù hợp, còn lại gắn danh mục gốc
function chonSlugDanhMuc(sp: SanPhamNguon): string {
  if (sp.danhMucSlug !== 'thang-nhom') return sp.danhMucSlug;
  const ten = sp.ten.toLowerCase();
  if (!ten.includes('thang')) return 'thang-nhom';
  if (ten.includes('rút')) return 'thang-nhom-rut';
  if (ten.includes('ghế')) return 'thang-nhom-ghe';
  if (ten.includes('chữ a')) return 'thang-nhom-chu-a';
  return 'thang-nhom';
}

// ============================== MAIN =================================

async function main() {
  console.log('🧹 Dọn dữ liệu cũ...');
  // Xóa theo thứ tự CON trước CHA để không vướng khóa ngoại.
  // DB có đơn hàng demo nên phải dọn nhóm bán hàng TRƯỚC khi xóa sản phẩm.
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  // Các bảng khác còn trỏ tới sản phẩm
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.promotionProduct.deleteMany();
  // Dữ liệu catalog
  await prisma.inventory.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.setting.deleteMany();

  console.log('🏷️  Tạo thương hiệu...');
  // Lấy danh sách thương hiệu duy nhất theo thứ tự xuất hiện trong dữ liệu
  const tenThuongHieu: string[] = [];
  for (const sp of SAN_PHAM) {
    if (!tenThuongHieu.includes(sp.thuongHieu)) tenThuongHieu.push(sp.thuongHieu);
  }
  const mapThuongHieu = new Map<string, string>(); // tên -> id
  for (const ten of tenThuongHieu) {
    const th = await prisma.brand.create({
      data: { name: ten, slug: taoSlug(ten), isActive: true },
    });
    mapThuongHieu.set(ten, th.id);
  }

  console.log('🗂️  Tạo cây danh mục...');
  const mapDanhMuc = new Map<string, string>(); // slug -> id
  let viTri = 0;
  for (const dm of DANH_MUC_GOC) {
    viTri += 1;
    const created = await prisma.category.create({
      data: {
        name: dm.name,
        slug: dm.slug,
        level: 1,
        position: viTri,
        seoTitle: `${dm.name} Chính Hãng, Giá Tốt | SWE Việt Nam`,
        seoDesc: `Mua ${dm.name.toLowerCase()} chính hãng, bảo hành đầy đủ, giao toàn quốc tại SWE Việt Nam.`,
      },
    });
    mapDanhMuc.set(dm.slug, created.id);
  }
  // 3 danh mục con của Thang Nhôm (cấp 2)
  const idThangNhom = mapDanhMuc.get('thang-nhom');
  if (!idThangNhom) throw new Error('Chưa tạo danh mục gốc Thang Nhôm');
  let viTriCon = 0;
  for (const con of DANH_MUC_CON_THANG) {
    viTriCon += 1;
    const created = await prisma.category.create({
      data: {
        name: con.name,
        slug: con.slug,
        level: 2,
        position: viTriCon,
        parentId: idThangNhom,
        seoTitle: `${con.name} Chính Hãng, Giá Tốt | SWE Việt Nam`,
        seoDesc: `Mua ${con.name.toLowerCase()} chính hãng, bảo hành đầy đủ, giao toàn quốc tại SWE Việt Nam.`,
      },
    });
    mapDanhMuc.set(con.slug, created.id);
  }

  console.log('🏬 Tạo kho...');
  const khoHCM = await prisma.warehouse.create({
    data: { name: 'Kho HCM', address: 'Quận Tân Bình, TP.HCM', phone: '02800000001' },
  });
  const khoHN = await prisma.warehouse.create({
    data: { name: 'Kho Hà Nội', address: 'Quận Thanh Xuân, Hà Nội', phone: '02400000002' },
  });

  console.log(`📦 Tạo ${SAN_PHAM.length} sản phẩm...`);
  const slugDaDung = new Set<string>();
  const skuDaDung = new Set<string>();
  let stt = 0;
  for (const sp of SAN_PHAM) {
    stt += 1;

    // Slug từ tên; trùng thì nối thêm model, vẫn trùng thì thêm số
    const model = docModel(sp.thongSo);
    let slug = taoSlug(sp.ten);
    if (slugDaDung.has(slug) && model) slug = taoSlug(`${sp.ten} ${model}`);
    const slugGoc = slug;
    let hauTo = 2;
    while (slugDaDung.has(slug)) {
      slug = `${slugGoc}-${hauTo}`;
      hauTo += 1;
    }
    slugDaDung.add(slug);

    // SKU = Model trong thông số; thiếu thì sinh từ slug viết tắt
    let sku = model ?? skuTuSlug(slug, stt);
    if (skuDaDung.has(sku)) sku = `${sku}-${stt}`;
    skuDaDung.add(sku);

    const idDanhMuc = mapDanhMuc.get(chonSlugDanhMuc(sp));
    const idThuongHieu = mapThuongHieu.get(sp.thuongHieu);
    if (!idDanhMuc || !idThuongHieu) {
      throw new Error(`Thiếu danh mục/thương hiệu cho sản phẩm: ${sp.ten}`);
    }

    // Freeship khi giá bán thực tế (salePrice, không có thì price) >= 2 triệu
    const giaHieuLuc = sp.giaBan ?? sp.giaGoc;

    // Tồn kho 20-100 mỗi sản phẩm, chia 2 kho — tính tất định theo STT
    // để seed chạy lại vẫn ra cùng số liệu
    const tonHCM = 10 + ((stt * 13) % 41); // 10..50
    const tonHN = 10 + ((stt * 29) % 41); // 10..50

    await prisma.product.create({
      data: {
        name: sp.ten,
        slug,
        sku,
        shortDesc: sp.moTaNgan,
        description: sp.moTa,
        price: sp.giaGoc,
        salePrice: sp.giaBan,
        soldCount: sp.daBan,
        freeShip: giaHieuLuc >= 2_000_000,
        warrantyMonths: docBaoHanh(sp.thongSo),
        isActive: true,
        categoryId: idDanhMuc,
        brandId: idThuongHieu,
        seoTitle: `${sp.ten} Chính Hãng, Giá Tốt`,
        seoDesc: `Mua ${sp.ten} chính hãng tại SWE Việt Nam, giá tốt, giao nhanh toàn quốc.`,
        images: {
          create: [
            {
              url: `https://placehold.co/800x800/png?text=${encodeURIComponent(sku)}`,
              alt: sp.ten,
              position: 0,
            },
            {
              url: `https://placehold.co/800x800/png?text=${encodeURIComponent(`${sku}-2`)}`,
              alt: sp.ten,
              position: 1,
            },
          ],
        },
        specs: {
          create: sp.thongSo.map(([specName, specValue], i) => ({
            specName,
            specValue,
            position: i,
          })),
        },
        inventory: {
          create: [
            { warehouseId: khoHCM.id, quantity: tonHCM },
            { warehouseId: khoHN.id, quantity: tonHN },
          ],
        },
      },
    });
  }

  console.log('⚙️  Tạo cấu hình hệ thống...');
  await prisma.setting.createMany({
    data: [
      { key: 'hotline_hcm', value: '0865 457 498' },
      { key: 'gio_lam_viec', value: '8H - 21H (T2 - CN)' },
      { key: 'nguong_freeship', value: '2000000' },
      // Thông tin chuyển khoản (VietQR) — sửa trong Admin/Prisma Studio
      { key: 'bank_code', value: '970436' }, // BIN Vietcombank
      { key: 'bank_account', value: '1234567890' },
      { key: 'bank_name', value: 'CONG TY KET NOI SHOP' },
    ],
  });

  // Đếm lại để báo cáo
  const [soDM, soTH, soSP, soTon] = await Promise.all([
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.count(),
    prisma.inventory.count(),
  ]);
  console.log('✅ Seed xong!');
  console.log(`   Danh mục: ${soDM} | Thương hiệu: ${soTH} | Sản phẩm: ${soSP} | Dòng tồn kho: ${soTon}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
