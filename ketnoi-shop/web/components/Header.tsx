import Link from 'next/link';
import { Suspense } from 'react';
import SearchBox, { HeaderSearch } from './SearchBox';
import CategoryNav, { CategoryNavMobile } from './CategoryNav';
import CartLink from './cart/CartLink';
import { getCategoriesSafe, getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';

// Header:
// - Mobile (< sm): 3 tầng gọn — logo + icon (gọi, tài khoản, giỏ), ô tìm kiếm,
//   hàng danh mục cuộn ngang. Không có thanh teal để header không chiếm 1/4 màn hình.
// - Từ sm: tầng thông tin trắng + thanh nav teal; từ lg có mega-menu danh mục.
export default async function Header() {
  const [categories, settings] = await Promise.all([
    getCategoriesSafe(),
    getSettingsSafe(),
  ]);
  const hotline = hotlineOf(settings);
  const gioLamViec = settings.gio_lam_viec ?? '8H - 21H (T2 - CN)';

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      {/* Tầng 1: logo + (mobile: icon) + tìm kiếm + hotline + hướng dẫn thanh toán */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:flex-nowrap sm:py-3">
        <Link href="/" className="shrink-0 leading-tight">
          <span className="text-xl font-extrabold text-teal-700">SWE</span>
          <span className="text-xl font-extrabold text-zinc-800"> Việt Nam</span>
          <span className="hidden text-[10px] font-medium tracking-wide text-zinc-500 sm:block">
            DỤNG CỤ &amp; THIẾT BỊ CÔNG NGHIỆP CHÍNH HÃNG
          </span>
        </Link>

        {/* Icon nhanh trên mobile */}
        <div className="ml-auto flex items-center sm:hidden">
          {hotline && (
            <a
              href={telHref(hotline)}
              aria-label={`Gọi hotline ${hotline}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
              </svg>
            </a>
          )}
          <Link
            href="/dang-nhap"
            aria-label="Tài khoản"
            className="flex h-11 w-11 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </Link>
          <CartLink compact />
        </div>

        <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
          <Suspense fallback={<SearchBox />}>
            <HeaderSearch />
          </Suspense>
        </div>

        <div className="hidden text-right text-sm md:block">
          <div className="text-[11px] text-zinc-500">Giờ làm việc {gioLamViec}</div>
          {hotline && (
            <a href={telHref(hotline)} className="font-bold text-teal-700 hover:underline">
              Hotline: {hotline}
            </a>
          )}
        </div>

        <Link
          href="/huong-dan-thanh-toan"
          className="hidden shrink-0 rounded-md border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 sm:block"
        >
          HƯỚNG DẪN THANH TOÁN
        </Link>
      </div>

      {/* Tầng 2: nav chính nền teal (từ sm trở lên) */}
      <div className="hidden bg-teal-700 text-white sm:block">
        <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-4">
          {/* Nút "Danh mục sản phẩm" + mega-menu (chỉ desktop) */}
          <CategoryNav categories={categories} />

          <nav aria-label="Điều hướng chính" className="flex items-center gap-1 text-sm font-medium">
            <Link href="/" className="rounded px-3 py-2.5 hover:bg-teal-800">
              Trang chủ
            </Link>
            <Link href="/khuyen-mai" className="rounded px-3 py-2.5 hover:bg-teal-800">
              Khuyến mãi
            </Link>
            <Link href="/dang-nhap" className="rounded px-3 py-2.5 hover:bg-teal-800">
              Kiểm tra đơn
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 py-1.5">
            <Link
              href="/dang-nhap"
              className="rounded px-3 py-2 text-sm font-medium hover:bg-teal-800"
            >
              Đăng nhập
            </Link>
            <CartLink />
          </div>
        </div>
      </div>

      {/* Tầng 3: hàng danh mục cuộn ngang (dưới lg) */}
      <CategoryNavMobile categories={categories} />
    </header>
  );
}
