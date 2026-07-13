import Link from 'next/link';
import SearchBox from './SearchBox';
import CategoryNav from './CategoryNav';
import CartLink from './cart/CartLink';
import { getCategoriesSafe, getSettingsSafe } from '@/lib/api';

export default async function Header() {
  const [categories, settings] = await Promise.all([
    getCategoriesSafe(),
    getSettingsSafe(),
  ]);
  const hotline = settings.hotline_hcm ?? settings.hotline_hn;

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-xl font-extrabold text-red-600">
          SWE<span className="text-zinc-800"> Phú Thọ</span>
        </Link>

        <div className="flex-1">
          <SearchBox />
        </div>

        {hotline && (
          <div className="hidden text-right text-sm sm:block">
            <div className="text-[11px] text-zinc-400">Hotline</div>
            <div className="font-semibold text-red-600">{hotline}</div>
          </div>
        )}

        <Link
          href="/dang-nhap"
          className="hidden shrink-0 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:text-red-600 sm:block"
        >
          Đăng nhập
        </Link>

        <CartLink />
      </div>

      <CategoryNav categories={categories} />
    </header>
  );
}
