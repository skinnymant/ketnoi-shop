import Link from 'next/link';
import SearchBox from './SearchBox';
import CategoryNav, { CategoryNavMobile } from './CategoryNav';
import CartLink from './cart/CartLink';
import { getCategoriesSafe, getSettingsSafe } from '@/lib/api';

// Header 3 tầng: (1) thông tin nền trắng, (2) nav chính nền teal,
// (3) danh mục — mega-menu trên desktop, hàng cuộn ngang trên mobile.
export default async function Header() {
  const [categories, settings] = await Promise.all([
    getCategoriesSafe(),
    getSettingsSafe(),
  ]);
  const hotline = settings.hotline_hcm ?? settings.hotline_hn;
  const gioLamViec = settings.gio_lam_viec ?? '8H - 21H (T2 - CN)';

  return (
    <header className="sticky top-0 z-30 shadow-sm">
      {/* Tầng 1: logo + tìm kiếm + giờ làm việc/hotline + hướng dẫn thanh toán */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
          <Link href="/" className="shrink-0 leading-tight">
            <span className="text-xl font-extrabold text-teal-700">SWE</span>
            <span className="text-xl font-extrabold text-zinc-800">
              {' '}
              Việt Nam
            </span>
            <span className="block text-[10px] font-medium tracking-wide text-zinc-400">
              DỤNG CỤ &amp; THIẾT BỊ CÔNG NGHIỆP CHÍNH HÃNG
            </span>
          </Link>

          <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
            <SearchBox />
          </div>

          <div className="hidden text-right text-sm md:block">
            <div className="text-[11px] text-zinc-400">
              Giờ làm việc {gioLamViec}
            </div>
            {hotline && (
              <div className="font-bold text-teal-700">Hotline: {hotline}</div>
            )}
          </div>

          <Link
            href="/thanh-toan"
            className="hidden shrink-0 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 sm:block"
          >
            HƯỚNG DẪN THANH TOÁN
          </Link>
        </div>
      </div>

      {/* Tầng 2: nav chính nền teal */}
      <div className="bg-teal-700 text-white">
        <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-4">
          {/* Nút "Danh mục sản phẩm" + mega-menu (chỉ desktop) */}
          <CategoryNav categories={categories} />

          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link href="/" className="rounded px-3 py-2.5 hover:bg-teal-800">
              Trang chủ
            </Link>
            <Link href="/" className="rounded px-3 py-2.5 hover:bg-teal-800">
              Khuyến mãi
            </Link>
            <Link
              href="/dang-nhap"
              className="hidden rounded px-3 py-2.5 hover:bg-teal-800 sm:block"
            >
              Kiểm tra đơn
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 py-1.5">
            <Link
              href="/dang-nhap"
              className="hidden rounded px-3 py-2 text-sm font-medium hover:bg-teal-800 sm:block"
            >
              Đăng nhập
            </Link>
            <CartLink />
          </div>
        </div>
      </div>

      {/* Tầng 3: hàng danh mục cuộn ngang (chỉ mobile) */}
      <CategoryNavMobile categories={categories} />
    </header>
  );
}
