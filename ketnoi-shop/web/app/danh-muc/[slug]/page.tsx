import Link from 'next/link';
import { getCategory, getProducts, getCategoriesSafe } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';
import ApiError from '@/components/ApiError';
import type { CategoryNode, ProductListResponse } from '@/lib/types';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const c = await getCategory(slug);
    const title = c.seoTitle || c.name;
    const description =
      c.seoDesc || `Danh mục ${c.name} — sản phẩm chính hãng, giá tốt, giao nhanh.`;
    return {
      title,
      description,
      alternates: { canonical: `/danh-muc/${c.slug}` },
    };
  } catch {
    return { title: 'Danh mục' };
  }
}

type SP = Record<string, string | string[] | undefined>;

// Tìm 1 nút danh mục theo id trong cây (đệ quy) — dùng để lấy danh mục cùng cấp
function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = n.children ? findNode(n.children, id) : null;
    if (found) return found;
  }
  return null;
}

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
  // Lọc theo thương hiệu (chip ở sidebar) — không truyền thì giữ nguyên hành vi cũ
  const brand = typeof sp.brand === 'string' ? sp.brand : undefined;

  let category: CategoryNode | null = null;
  try {
    category = await getCategory(slug);
  } catch {
    category = null;
  }

  let res: ProductListResponse | null = null;
  let error = false;
  try {
    res = await getProducts({ category: slug, brand, sort, page, limit: 12 });
  } catch {
    error = true;
  }

  const title = category?.name ?? slug;

  // Sidebar "Danh mục": ưu tiên danh mục con; không có con thì danh mục cùng cấp
  let sideCats: CategoryNode[] = [];
  let sideTitle = 'Danh mục';
  if (category?.children && category.children.length > 0) {
    sideCats = category.children;
    sideTitle = category.name;
  } else {
    const tree = await getCategoriesSafe();
    if (category?.parentId) {
      const parentNode = findNode(tree, category.parentId);
      sideCats = parentNode?.children ?? [];
      sideTitle = category.parent?.name ?? 'Danh mục';
    } else {
      sideCats = tree;
    }
  }

  // Sidebar "Thương hiệu": gom thương hiệu từ sản phẩm đang hiển thị
  const brandMap = new Map<string, string>();
  for (const p of res?.data ?? []) {
    if (p.brand) brandMap.set(p.brand.slug, p.brand.name);
  }
  const brands = Array.from(brandMap, ([bSlug, bName]) => ({
    slug: bSlug,
    name: bName,
  }));

  // Ghép link giữ nguyên các tham số đang chọn
  const buildHref = (opts: { page?: number; brand?: string }) => {
    const qs = new URLSearchParams();
    if (sort !== 'newest') qs.set('sort', sort);
    if (opts.brand) qs.set('brand', opts.brand);
    if (opts.page && opts.page > 1) qs.set('page', String(opts.page));
    const s = qs.toString();
    return `/danh-muc/${slug}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700">
          Trang chủ
        </Link>
        {category?.parent && (
          <>
            <span className="mx-1">/</span>
            <Link
              href={`/danh-muc/${category.parent.slug}`}
              className="hover:text-teal-700"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{title}</span>
      </nav>

      <div className="flex items-start gap-5">
        {/* Sidebar trái — ẩn trên mobile */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <h2 className="bg-teal-700 px-4 py-2.5 text-sm font-bold uppercase text-white">
              {sideTitle}
            </h2>
            {sideCats.length > 0 ? (
              <ul className="divide-y divide-zinc-100 p-2 text-sm">
                {sideCats.map((c) => {
                  const active = c.slug === slug;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/danh-muc/${c.slug}`}
                        className={`block px-2 py-2 ${
                          active
                            ? 'font-semibold text-teal-700'
                            : 'text-zinc-700 hover:text-teal-700'
                        }`}
                      >
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-4 text-xs text-zinc-400">Chưa có danh mục.</p>
            )}
          </div>

          {(brands.length > 0 || brand) && (
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <h2 className="bg-teal-700 px-4 py-2.5 text-sm font-bold uppercase text-white">
                Thương hiệu
              </h2>
              <div className="flex flex-wrap gap-2 p-3">
                {brand && (
                  <Link
                    href={buildHref({})}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:border-teal-700 hover:text-teal-700"
                  >
                    Tất cả ✕
                  </Link>
                )}
                {brands.map((b) => {
                  const active = b.slug === brand;
                  return (
                    <Link
                      key={b.slug}
                      href={buildHref({ brand: b.slug })}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-zinc-200 text-zinc-600 hover:border-teal-700 hover:text-teal-700'
                      }`}
                    >
                      {b.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Cột phải: thanh công cụ + lưới sản phẩm + phân trang */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-lg font-bold text-zinc-800">{title}</h1>
              {res && (
                <span className="text-sm text-zinc-500">
                  ({res.meta.total} sản phẩm)
                </span>
              )}
            </div>
            <SortSelect current={sort} />
          </div>

          {/* Chip danh mục con cho mobile (sidebar bị ẩn) */}
          {category?.children && category.children.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
              {category.children.map((c) => (
                <Link
                  key={c.id}
                  href={`/danh-muc/${c.slug}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 hover:border-teal-700 hover:text-teal-700"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {error ? (
            <ApiError />
          ) : !res || res.data.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              Chưa có sản phẩm trong danh mục này.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {res.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {res.meta.totalPages > 1 && (
                <div className="mt-8 flex flex-wrap justify-center gap-1">
                  {Array.from(
                    { length: res.meta.totalPages },
                    (_, i) => i + 1,
                  ).map((n) => {
                    const active = n === res!.meta.page;
                    return (
                      <Link
                        key={n}
                        href={buildHref({ page: n, brand })}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                          active
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:text-teal-700'
                        }`}
                      >
                        {n}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
