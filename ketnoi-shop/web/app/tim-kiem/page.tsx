import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ApiError from '@/components/ApiError';
import type { ProductCard as ProductCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold text-zinc-800">
        Kết quả tìm kiếm
      </h1>
      {keyword ? (
        <p className="mb-5 text-sm text-zinc-500">
          {total} kết quả cho “<span className="font-medium">{keyword}</span>”
        </p>
      ) : (
        <p className="mb-5 text-sm text-zinc-500">Nhập từ khóa để tìm sản phẩm.</p>
      )}

      {error ? (
        <ApiError />
      ) : keyword && results.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Không tìm thấy sản phẩm phù hợp. Thử từ khóa khác nhé.
        </p>
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
