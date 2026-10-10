import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategoriesSafe, getProducts, getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';
import ProductCard from '@/components/ProductCard';
import ApiError from '@/components/ApiError';
import type { ProductCard as ProductCardType } from '@/lib/types';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const keyword = (q ?? '').trim();
  return {
    title: keyword ? `Tìm “${keyword}”` : 'Tìm kiếm',
    robots: { index: false }, // trang kết quả tìm kiếm không cần Google index
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = (q ?? '').trim();

  let results: ProductCardType[] = [];
  let total = 0;
  let error = false;
  if (keyword) {
    try {
      const res = await getProducts({ search: keyword, limit: 24 });
      results = res.data;
      total = res.meta.total;
    } catch {
      error = true;
    }
  }
  const noResult = !!keyword && !error && results.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Thanh tiêu đề trắng đồng bộ với trang danh mục */}
      <div className="mb-5 rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-zinc-800">Kết quả tìm kiếm</h1>
        {keyword ? (
          <p className="mt-0.5 text-sm text-zinc-500">
            {total} kết quả cho “
            <span className="font-semibold text-teal-700">{keyword}</span>”
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-zinc-500">
            Nhập từ khóa để tìm sản phẩm.
          </p>
        )}
      </div>

      {error ? (
        <ApiError />
      ) : noResult ? (
        <NoResult keyword={keyword} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// Không có kết quả: gợi ý cách tìm khác, danh mục và hotline — không để ngõ cụt.
async function NoResult({ keyword }: { keyword: string }) {
  const [categories, s] = await Promise.all([getCategoriesSafe(), getSettingsSafe()]);
  const hotline = hotlineOf(s);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
      <p className="font-semibold text-zinc-800">
        Chưa tìm thấy sản phẩm cho “{keyword}”.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Thử từ khóa ngắn hơn hoặc chung hơn, ví dụ “máy khoan”, “Makita”.</li>
        <li>Tìm theo mã sản phẩm (model) in trên máy hoặc hộp.</li>
      </ul>

      {categories.length > 0 && (
        <>
          <h2 className="mt-5 font-semibold text-zinc-800">Hoặc xem theo danh mục</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/danh-muc/${c.slug}`}
                  className="inline-block rounded-full border border-zinc-200 px-4 py-2 text-zinc-700 hover:border-teal-700 hover:text-teal-700"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {hotline && (
        <p className="mt-5 rounded-md bg-teal-50 p-3 text-zinc-700">
          Không thấy sản phẩm bạn cần? Gọi{' '}
          <a
            href={telHref(hotline)}
            className="font-bold text-teal-700 underline underline-offset-2"
          >
            {hotline}
          </a>{' '}
          để được tư vấn.
        </p>
      )}
    </div>
  );
}
