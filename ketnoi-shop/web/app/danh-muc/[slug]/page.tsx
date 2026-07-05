import Link from 'next/link';
import { getCategory, getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';
import ApiError from '@/components/ApiError';
import type { CategoryNode, ProductListResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(
    1,
    Number(typeof sp.page === 'string' ? sp.page : 1) || 1,
  );
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest';

  let category: CategoryNode | null = null;
  try {
    category = await getCategory(slug);
  } catch {
    category = null;
  }

  let res: ProductListResponse | null = null;
  let error = false;
  try {
    res = await getProducts({ category: slug, sort, page, limit: 12 });
  } catch {
    error = true;
  }

  const title = category?.name ?? slug;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-3 text-sm text-zinc-500">
        <Link href="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        {category?.parent && (
          <>
            <span className="mx-1">/</span>
            <Link
              href={`/danh-muc/${category.parent.slug}`}
              className="hover:text-red-600"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{title}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-800">{title}</h1>
        <SortSelect current={sort} />
      </div>

      {category?.children && category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link
              key={c.id}
              href={`/danh-muc/${c.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 hover:border-red-300 hover:text-red-600"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {error ? (
        <ApiError />
      ) : !res || res.data.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Chưa có sản phẩm trong danh mục này.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-500">{res.meta.total} sản phẩm</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {res.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {res.meta.totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center gap-1">
              {Array.from({ length: res.meta.totalPages }, (_, i) => i + 1).map(
                (n) => {
                  const params = new URLSearchParams();
                  if (sort !== 'newest') params.set('sort', sort);
                  if (n > 1) params.set('page', String(n));
                  const qs = params.toString();
                  const href = `/danh-muc/${slug}${qs ? `?${qs}` : ''}`;
                  const active = n === res!.meta.page;
                  return (
                    <Link
                      key={n}
                      href={href}
                      className={`rounded-md px-3 py-1.5 text-sm ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:text-red-600'
                      }`}
                    >
                      {n}
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
