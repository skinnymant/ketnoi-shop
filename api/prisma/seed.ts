// =====================================================================
// KETNOI-SHOP — SEED DỮ LIỆU MẪU (Bước 2.4)
// Tạo: cây danh mục, 2 thương hiệu, 2 kho, 10 sản phẩm (ảnh + thông số
// + tồn kho), vài dòng cấu hình hệ thống.
// Vị trí file: api/prisma/seed.ts
// Chạy bằng:  npx prisma db seed
// Chạy lại bao nhiêu lần cũng được: script tự dọn dữ liệu cũ trước.
// Ghi chú: dự án dùng Prisma 7 + driver adapter (PrismaPg) nên
//          PrismaClient phải được khởi tạo kèm adapter, giống prisma.service.ts.
// =====================================================================

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('🧹 Dọn dữ liệu cũ...');
  // Xóa theo thứ tự CON trước CHA để không vướng khóa ngoại
  await prisma.inventory.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.setting.deleteMany();

  console.log('🏷️  Tạo thương hiệu...');
  const makita = await prisma.brand.create({
    data: { name: 'Makita', slug: 'makita', description: 'Thương hiệu dụng cụ điện Nhật Bản' },
  });
  const nika = await prisma.brand.create({
    data: { name: 'Nikawa', slug: 'nikawa', description: 'Thương hiệu thang nhôm Nhật Bản' },
  });

  console.log('🗂️  Tạo cây danh mục...');
  // Cấp 1
  const catPin = await prisma.category.create({
    data: { name: 'Thiết Bị Dùng Pin', slug: 'thiet-bi-dung-pin', level: 1, position: 1 },
  });
  const catThang = await prisma.category.create({
    data: { name: 'Thang Nhôm', slug: 'thang-nhom', level: 1, position: 2 },
  });
  // Cấp 2 (con của cấp 1)
  const catKhoanPin = await prisma.category.create({
    data: {
      name: 'Máy Khoan Pin', slug: 'may-khoan-pin', level: 2,
      parentId: catPin.id,
      seoTitle: 'Máy Khoan Pin Chính Hãng Giá Tốt',
      seoDesc: 'Máy khoan pin Makita, Bosch chính hãng, bảo hành 12 tháng.',
    },
  });
  const catThangA = await prisma.category.create({
    data: { name: 'Thang Nhôm Chữ A', slug: 'thang-nhom-chu-a', level: 2, parentId: catThang.id },
  });

  console.log('🏬 Tạo kho...');
  const khoHCM = await prisma.warehouse.create({
    data: { name: 'Kho HCM', address: 'Quận Tân Bình, TP.HCM', phone: '02800000001' },
  });
  const khoHN = await prisma.warehouse.create({
    data: { name: 'Kho Hà Nội', address: 'Quận Thanh Xuân, Hà Nội', phone: '02400000002' },
  });

  console.log('📦 Tạo 10 sản phẩm...');
  // Hàm tiện ích: tạo 1 sản phẩm kèm ảnh + thông số + tồn kho 2 kho
  async function taoSanPham(sp: {
    name: string; slug: string; sku: string; price: number; salePrice: number;
    categoryId: string; brandId: string; soldCount: number; freeShip?: boolean;
    specs: [string, string][]; tonHCM: number; tonHN: number;
  }) {
    await prisma.product.create({
      data: {
        name: sp.name,
        slug: sp.slug,
        sku: sp.sku,
        shortDesc: `${sp.name} chính hãng, bảo hành 12 tháng.`,
        description: `<p><strong>${sp.name}</strong> - sản phẩm chính hãng, đầy đủ CO/CQ, bảo hành 12 tháng toàn quốc.</p>`,
        price: sp.price,
        salePrice: sp.salePrice,
        soldCount: sp.soldCount,
        freeShip: sp.freeShip ?? false,
        warrantyMonths: 12,
        isActive: true,
        categoryId: sp.categoryId,
        brandId: sp.brandId,
        seoTitle: `${sp.name} Chính Hãng, Giá Tốt`,
        seoDesc: `Mua ${sp.name} giá tốt, giao nhanh HCM & Hà Nội.`,
        images: {
          create: [
            { url: `https://placehold.co/800x800/png?text=${encodeURIComponent(sp.sku)}-1`, alt: sp.name, position: 0 },
            { url: `https://placehold.co/800x800/png?text=${encodeURIComponent(sp.sku)}-2`, alt: sp.name, position: 1 },
          ],
        },
        specs: {
          create: sp.specs.map(([specName, specValue], i) => ({ specName, specValue, position: i })),
        },
        inventory: {
          create: [
            { warehouseId: khoHCM.id, quantity: sp.tonHCM },
            { warehouseId: khoHN.id, quantity: sp.tonHN },
          ],
        },
      },
    });
  }

  // ----- 6 máy khoan pin Makita -----
  await taoSanPham({
    name: 'Máy khoan pin Makita DF333DSAE 12V', slug: 'may-khoan-pin-makita-df333dsae-12v',
    sku: 'MK-DF333DSAE', price: 2900000, salePrice: 2150000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 320, freeShip: true,
    specs: [['Điện áp', '12V'], ['Đầu kẹp', '10mm'], ['Pin kèm', '2 pin + 1 sạc'], ['Xuất xứ', 'Nhật Bản']],
    tonHCM: 15, tonHN: 8,
  });
  await taoSanPham({
    name: 'Máy khoan pin Makita DHP453 18V', slug: 'may-khoan-pin-makita-dhp453-18v',
    sku: 'MK-DHP453', price: 4200000, salePrice: 3590000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 214, freeShip: true,
    specs: [['Điện áp', '18V'], ['Đầu kẹp', '13mm'], ['Chức năng', 'Khoan búa'], ['Pin kèm', '1 pin + 1 sạc']],
    tonHCM: 10, tonHN: 6,
  });
  await taoSanPham({
    name: 'Máy khoan pin Makita HP333DSAX 12V', slug: 'may-khoan-pin-makita-hp333dsax-12v',
    sku: 'MK-HP333DSAX', price: 3300000, salePrice: 2790000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 158,
    specs: [['Điện áp', '12V'], ['Đầu kẹp', '10mm'], ['Chức năng', 'Khoan búa'], ['Pin kèm', '2 pin + 1 sạc']],
    tonHCM: 12, tonHN: 5,
  });
  await taoSanPham({
    name: 'Máy khoan pin Makita DDF485 18V', slug: 'may-khoan-pin-makita-ddf485-18v',
    sku: 'MK-DDF485', price: 3800000, salePrice: 3250000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 96,
    specs: [['Điện áp', '18V'], ['Đầu kẹp', '13mm'], ['Động cơ', 'Không chổi than'], ['Pin kèm', 'Thân máy']],
    tonHCM: 7, tonHN: 9,
  });
  await taoSanPham({
    name: 'Máy vặn vít pin Makita DTD173 18V', slug: 'may-van-vit-pin-makita-dtd173-18v',
    sku: 'MK-DTD173', price: 5900000, salePrice: 5190000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 67, freeShip: true,
    specs: [['Điện áp', '18V'], ['Lực siết', '180 N.m'], ['Động cơ', 'Không chổi than'], ['Xuất xứ', 'Nhật Bản']],
    tonHCM: 5, tonHN: 3,
  });
  await taoSanPham({
    name: 'Máy khoan pin Makita DF012DSE 7.2V', slug: 'may-khoan-pin-makita-df012dse-72v',
    sku: 'MK-DF012DSE', price: 2500000, salePrice: 2090000,
    categoryId: catKhoanPin.id, brandId: makita.id, soldCount: 45,
    specs: [['Điện áp', '7.2V'], ['Kiểu dáng', 'Bút gập'], ['Pin kèm', '2 pin + 1 sạc']],
    tonHCM: 8, tonHN: 2,
  });

  // ----- 4 thang nhôm Nikawa -----
  await taoSanPham({
    name: 'Thang nhôm chữ A Nikawa NKD-04 4 bậc', slug: 'thang-nhom-chu-a-nikawa-nkd-04',
    sku: 'NK-NKD04', price: 1450000, salePrice: 1190000,
    categoryId: catThangA.id, brandId: nika.id, soldCount: 280, freeShip: true,
    specs: [['Số bậc', '4'], ['Chiều cao chữ A', '0.92m'], ['Tải trọng', '150kg'], ['Chất liệu', 'Nhôm cao cấp']],
    tonHCM: 20, tonHN: 14,
  });
  await taoSanPham({
    name: 'Thang nhôm chữ A Nikawa NKD-05 5 bậc', slug: 'thang-nhom-chu-a-nikawa-nkd-05',
    sku: 'NK-NKD05', price: 1650000, salePrice: 1390000,
    categoryId: catThangA.id, brandId: nika.id, soldCount: 195,
    specs: [['Số bậc', '5'], ['Chiều cao chữ A', '1.15m'], ['Tải trọng', '150kg']],
    tonHCM: 16, tonHN: 11,
  });
  await taoSanPham({
    name: 'Thang nhôm ghế Nikawa NKS-04 4 bậc', slug: 'thang-nhom-ghe-nikawa-nks-04',
    sku: 'NK-NKS04', price: 1900000, salePrice: 1590000,
    categoryId: catThangA.id, brandId: nika.id, soldCount: 132,
    specs: [['Số bậc', '4'], ['Kiểu', 'Thang ghế tay vịn'], ['Tải trọng', '150kg']],
    tonHCM: 9, tonHN: 7,
  });
  await taoSanPham({
    name: 'Thang nhôm rút đôi Nikawa NK-38AI', slug: 'thang-nhom-rut-doi-nikawa-nk-38ai',
    sku: 'NK-38AI', price: 3600000, salePrice: 3090000,
    categoryId: catThangA.id, brandId: nika.id, soldCount: 88, freeShip: true,
    specs: [['Chiều cao chữ A', '1.9m'], ['Chiều cao chữ I', '3.8m'], ['Tải trọng', '150kg']],
    tonHCM: 6, tonHN: 4,
  });

  console.log('⚙️  Tạo cấu hình hệ thống...');
  await prisma.setting.createMany({
    data: [
      { key: 'hotline_hcm', value: '0900 000 001' },
      { key: 'hotline_hn', value: '0900 000 002' },
      { key: 'gio_lam_viec', value: '8H - 21H (T2 - CN)' },
      { key: 'nguong_freeship', value: '2000000' },
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
