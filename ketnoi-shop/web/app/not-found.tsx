import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategoriesSafe, getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';
import SearchBox from '@/components/SearchBox';

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false },
};

// Trang 404 tiếng Việt: gợi ý tìm kiếm, danh mục và hotline thay vì ngõ cụt.
export default async function NotFound() {
  const [categories, s] = await Promise.all([getCategoriesSafe(), getSettingsSafe()]);
  const hotline = hotlineOf(s);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-5xl font-extrabold text-teal-700">404</p>
      <h1 className="mt-3 text-xl font-bold text-zinc-900">
        Không tìm thấy trang bạn cần
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sản phẩm có thể đã ngừng bán hoặc đường dẫn bị sai. Thử tìm lại nhé:
      </p>
      <div className="mx-auto mt-5 max-w-lg">
        <SearchBox label="Tìm lại sản phẩm" />
      </div>

      {categories.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-700">Danh mục sản phẩm</h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/danh-muc/${c.slug}`}
                  className="inline-block rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:border-teal-700 hover:text-teal-700"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800"
        >
          Về trang chủ
        </Link>
        {hotline && (
          <a
            href={telHref(hotline)}
            className="rounded-md border border-teal-700 px-5 py-2.5 font-semibold text-teal-700 hover:bg-teal-50"
          >
            Gọi {hotline}
          </a>
        )}
      </div>
    </div>
  );
}
