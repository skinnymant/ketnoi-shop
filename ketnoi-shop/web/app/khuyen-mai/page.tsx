import Link from 'next/link';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import { discountPercent } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';
import ApiError from '@/components/ApiError';
import type { ProductListResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Khuyến mãi',
  description:
    'Dụng cụ, thiết bị công nghiệp chính hãng đang giảm giá — cập nhật liên tục.',
  alternates: { canonical: '/khuyen-mai' },
};

type SP = Record<string, string | string[] | undefined>;

// Trang Khuyến mãi: chỉ sản phẩm đang giảm giá (API lọc onSale=true).
export default async function PromotionPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const sort = typeof sp.sort === 'string' ? sp.sort : 'best_selling';

  let res: ProductListResponse | null = null;
  try {
    res = await getProducts({ onSale: true, sort, page, limit: 24 });
  } catch {
    res = null;
  }
  // Lọc thêm phía web để chắc chỉ hiện sản phẩm thật sự đang giảm
  const products = (res?.data ?? []).filter(
    (p) => discountPercent(p.price, p.salePrice) !== null,
  );
  const totalPages = res?.meta.totalPages ?? 1;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (sort !== 'best_selling') qs.set('sort', sort);
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return `/khuyen-mai${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700">
          Trang chủ
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-700">Khuyến mãi</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-zinc-800">Khuyến mãi</h1>
          {res && (
            <p className="text-sm text-zinc-500">
              {totalPages === 1 ? products.length : res.meta.total} sản phẩm đang
              giảm giá
            </p>
          )}
        </div>
        <SortSelect current={sort} />
      </div>

      {!res ? (
        <ApiError />
      ) : products.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          Hiện chưa có chương trình khuyến mãi. Mời bạn quay lại sau nhé.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              {page > 1 && (
                <Link
                  href={href(page - 1)}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 hover:border-teal-700"
                >
                  ← Trang trước
                </Link>
              )}
              <span className="text-zinc-600">
                Trang {page}/{totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={href(page + 1)}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 hover:border-teal-700"
                >
                  Trang sau →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
