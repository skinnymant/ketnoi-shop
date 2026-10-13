import Link from 'next/link';
import {
  getBrandsSafe,
  getCategoriesSafe,
  getProducts,
  getProductsByCategory,
} from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ApiError from '@/components/ApiError';
import type { ProductCard as ProductCardType } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Tính % giảm giá từ price/salePrice (API trả Decimal dạng CHUỖI).
function tinhPhanTramGiam(p: ProductCardType): number {
  const gia = Number(p.price);
  const giaKhuyenMai = p.salePrice === null ? null : Number(p.salePrice);
  if (giaKhuyenMai === null || !gia || giaKhuyenMai >= gia) return 0;
  return Math.round(((gia - giaKhuyenMai) / gia) * 100);
}

// 3 cam kết bán hàng hiển thị ngay dưới hero
const USP = [
  { icon: '🚚', text: 'Giao toàn quốc', href: '/chinh-sach-giao-hang' },
  { icon: '✅', text: 'Đổi trả 7 ngày', href: '/chinh-sach-doi-tra' },
  { icon: '🛠️', text: 'Bảo hành theo sản phẩm', href: '/chinh-sach-bao-hanh' },
];

// Lưới 5 cột dùng chung cho mọi khu vực sản phẩm
function LuoiSanPham({ products, eager = false }: { products: ProductCardType[]; eager?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p, index) => (
        <ProductCard key={p.id} product={p} eager={eager && index < 2} />
      ))}
    </div>
  );
}

export default async function Home() {
  // Đợt 1 — fetch song song:
  // - 2 truy vấn sản phẩm gộp chung try/catch để biết API sống hay chết
  // - danh mục + thương hiệu đã bọc an toàn sẵn (lỗi → mảng rỗng)
  const [ketQuaSanPham, categories, brands] = await Promise.all([
    Promise.all([
      // API chưa hỗ trợ sort=discount → lấy 20 sản phẩm rồi tự xếp theo % giảm
      getProducts({ limit: 20 }),
      getProducts({ sort: 'best_selling', limit: 10 }),
    ]).catch(() => null),
    getCategoriesSafe(),
    getBrandsSafe(),
  ]);

  const error = ketQuaSanPham === null;
  const nguonFlashSale = ketQuaSanPham?.[0].data ?? [];
  const banChay = ketQuaSanPham?.[1].data ?? [];

  // Flash Sale: 5 sản phẩm có mức giảm % sâu nhất
  const flashSale = nguonFlashSale
    .filter((p) => tinhPhanTramGiam(p) > 0)
    .sort((a, b) => tinhPhanTramGiam(b) - tinhPhanTramGiam(a))
    .slice(0, 5);

  // Đợt 2 — khu vực theo danh mục: thử 6 danh mục gốc đầu tiên (theo position),
  // chỉ giữ tối đa 4 khu thực sự có sản phẩm.
  const khuVucTho = await Promise.all(
    categories.slice(0, 6).map(async (c) => ({
      danhMuc: c,
      sanPham: await getProductsByCategory(c.slug, 5),
    })),
  );
  const khuVucDanhMuc = khuVucTho
    .filter((k) => k.sanPham.length > 0)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
      {/* 1. Hero banner — gradient teal, không dùng ảnh ngoài */}
      <section className="mb-3 overflow-hidden rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 p-4 text-white sm:mb-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
          SWE Việt Nam
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          Dụng cụ & thiết bị công nghiệp
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
          Bosch, Makita, Milwaukee, Jasic — tư vấn đúng model cho công việc của bạn.
        </p>
        <Link
          href="/khuyen-mai"
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 sm:mt-5"
        >
          Xem khuyến mãi
        </Link>
      </section>

      {/* 2. Dải USP — 3 cam kết bán hàng */}
      <section aria-label="Chính sách mua hàng" className="mb-4 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        {USP.map((u) => (
          <Link
            key={u.text}
            href={u.href}
            className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-center hover:border-teal-700 sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-left"
          >
            <span className="text-xl" aria-hidden>
              {u.icon}
            </span>
            <span className="text-xs font-medium text-zinc-800 sm:text-sm">{u.text}</span>
          </Link>
        ))}
      </section>

      {/* API tắt: vẫn giữ khung trang, chỉ báo lỗi ở phần dữ liệu */}
      {error && (
        <div className="mb-6">
          <ApiError />
        </div>
      )}

      {/* 3. Flash Sale — 5 sản phẩm giảm sâu nhất */}
      {flashSale.length > 0 && (
        <section className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-red-600 px-4 py-2.5">
            <h2 className="text-sm font-bold uppercase text-white sm:text-base">
              Ưu đãi nổi bật
            </h2>
            <Link
              href="/khuyen-mai"
              className="text-xs font-semibold text-white hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          <LuoiSanPham products={flashSale} eager />
        </section>
      )}

      {/* 4. Khu vực theo danh mục — tối đa 4 danh mục đầu có sản phẩm */}
      {khuVucDanhMuc.map(({ danhMuc, sanPham }, index) => (
        <section
          key={danhMuc.id}
          className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white"
        >
          <div className="flex items-center justify-between bg-teal-700 px-4 py-2.5">
            <h2 className="text-sm font-bold uppercase text-white sm:text-base">
              {danhMuc.name}
            </h2>
            <Link
              href={`/danh-muc/${danhMuc.slug}`}
              className="text-xs font-medium text-white/90 hover:text-white"
            >
              Xem tất cả →
            </Link>
          </div>
          <LuoiSanPham products={sanPham} eager={flashSale.length === 0 && index === 0} />
        </section>
      ))}

      {/* 5. Sản phẩm bán chạy */}
      <section
        id="ban-chay"
        className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white"
      >
        <div className="flex items-center justify-between bg-teal-700 px-4 py-2.5">
          <h2 className="text-sm font-bold uppercase text-white sm:text-base">
            Sản phẩm bán chạy
          </h2>
        </div>
        {error ? (
          <p className="p-4 text-sm text-zinc-500">
            Không tải được dữ liệu sản phẩm.
          </p>
        ) : banChay.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Chưa có sản phẩm nào.</p>
        ) : (
          <LuoiSanPham products={banChay} eager={flashSale.length === 0 && khuVucDanhMuc.length === 0} />
        )}
      </section>

      {/* 6. Dải thương hiệu — chip chữ cuộn ngang */}
      {brands.length > 0 && (
        <section className="mb-2">
          <h2 className="mb-3 text-base font-bold text-zinc-800">
            Thương hiệu
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/tim-kiem?q=${encodeURIComponent(b.name)}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:border-teal-700 hover:text-teal-700"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
