import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { API_BASE, ApiRequestError, getBrandsSafe, getCategory, getProducts, getCategoriesSafe } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import ListingPagination from '@/components/ListingPagination';
import SortSelect from '@/components/SortSelect';
import ApiError from '@/components/ApiError';
import PriceFilterNotice from '@/components/PriceFilterNotice';
import { categoryDisplayName, listingHref, parseListingFilters, toSearchParams, type ListingSearchParams } from '@/lib/listing-filters';
import type { CategoryNode } from '@/lib/types';
import { probeStoreStatus } from '@/lib/store-status';

export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug).catch(() => null);
  const name = category?.name || categoryDisplayName(slug);
  return {
    title: category?.seoTitle || name,
    description: category?.seoDesc || `${name} tại SWE Việt Nam. Xem sản phẩm, lọc thương hiệu và khoảng giá; giao hàng toàn quốc.`,
    alternates: { canonical: `/danh-muc/${encodeURIComponent(slug)}` },
  };
}

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children ? findNode(node.children, id) : null;
    if (found) return found;
  }
  return null;
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingSearchParams>;
}) {
  const [{ slug }, values] = await Promise.all([params, searchParams]);
  const filters = parseListingFilters(values);
  const path = `/danh-muc/${encodeURIComponent(slug)}`;
  const priceRequested = !filters.priceError &&
    (filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.sort.startsWith('price_'));
  const statusPromise = priceRequested ? probeStoreStatus(API_BASE) : Promise.resolve(null);
  const resultPromise = (async () => {
    if (filters.priceError) return { result: null, priceUnavailable: false };
    const status = await statusPromise;
    if (status && !status.available) return { result: null, priceUnavailable: false };
    if (status && !status.capabilities.effectivePriceFilters) return { result: null, priceUnavailable: true };
    return getProducts({ category: slug, brand: filters.brand, sort: filters.sort, page: filters.page, minPrice: filters.minPrice, maxPrice: filters.maxPrice, limit: 12 })
      .then((result) => ({ result, priceUnavailable: false }))
      .catch(() => ({ result: null, priceUnavailable: false }));
  })();
  // Brand choices come from the category before filters and pagination are
  // applied. Large categories use the public brand list as a safe fallback.
  const [category, loaded, tree, facet, allBrands] = await Promise.all([
    getCategory(slug).catch((error) => {
      if (error instanceof ApiRequestError && error.status === 404) notFound();
      return null;
    }),
    resultPromise,
    getCategoriesSafe(),
    getProducts({ category: slug, limit: 50 }).catch(() => null),
    getBrandsSafe(),
  ]);
  const { result, priceUnavailable } = loaded;
  const title = category?.name || categoryDisplayName(slug);
  let sideCategories: CategoryNode[] = tree;
  let sideTitle = 'Danh mục';
  if (category?.children?.length) {
    sideCategories = category.children;
    sideTitle = category.name;
  } else if (category?.parentId) {
    const parent = findNode(tree, category.parentId);
    sideCategories = parent?.children ?? [];
    sideTitle = category.parent?.name || parent?.name || sideTitle;
  }
  const brandMap = new Map<string, string>();
  for (const product of facet?.data ?? result?.data ?? []) {
    if (product.brand) brandMap.set(product.brand.slug, product.brand.name);
  }
  const brands = facet && facet.meta.totalPages <= 1
    ? Array.from(brandMap, ([slug, name]) => ({ slug, name }))
    : allBrands.map(({ slug, name }) => ({ slug, name }));
  brands.sort((first, second) => first.name.localeCompare(second.name, 'vi'));
  const preserved = Array.from(toSearchParams(values).entries())
    .filter(([name]) => !['brand', 'minPrice', 'maxPrice', 'page'].includes(name));
  const clearHref = listingHref(path, values, { brand: undefined, minPrice: undefined, maxPrice: undefined, page: undefined });
  const hasFilters = Boolean(filters.brand || filters.minPrice !== undefined || filters.maxPrice !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-800 hover:underline">Trang chủ</Link>
        {category?.parent && <><span aria-hidden="true" className="mx-2">/</span><Link href={`/danh-muc/${category.parent.slug}`} className="hover:text-teal-800 hover:underline">{category.parent.name}</Link></>}
        <span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="text-zinc-800">{title}</span>
      </nav>
      <div className="flex items-start gap-5">
        <aside aria-label="Danh mục sản phẩm" className="hidden w-56 shrink-0 lg:block">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <h2 className="bg-teal-700 px-4 py-3 text-sm font-bold text-white">{sideTitle}</h2>
            {sideCategories.length > 0 ? (
              <ul className="divide-y divide-zinc-100 p-2 text-sm">
                {sideCategories.map((item) => <li key={item.id}><Link href={`/danh-muc/${item.slug}`} aria-current={item.slug === slug ? 'page' : undefined} className={`block min-h-11 px-2 py-3 ${item.slug === slug ? 'font-semibold text-teal-800' : 'text-zinc-700 hover:text-teal-800'}`}>{item.name}</Link></li>)}
              </ul>
            ) : <p className="p-4 text-sm text-zinc-500">Danh mục đang được cập nhật.</p>}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
              {result && <span className="text-sm text-zinc-500">({result.meta.total} sản phẩm)</span>}
            </div>
            <SortSelect current={filters.sort} />
          </div>
          {sideCategories.length > 0 && (
            <details className="mb-4 rounded-lg border border-zinc-200 bg-white p-3 lg:hidden">
              <summary className="cursor-pointer py-1 text-sm font-semibold text-zinc-800">Xem danh mục</summary>
              <nav aria-label="Danh mục trên điện thoại" className="mt-3 flex flex-wrap gap-2">
                {sideCategories.map((item) => <Link key={item.id} href={`/danh-muc/${item.slug}`} aria-current={item.slug === slug ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-sm ${item.slug === slug ? 'border-teal-700 bg-teal-50 font-semibold text-teal-800' : 'border-zinc-200 text-zinc-700 hover:border-teal-700'}`}>{item.name}</Link>)}
              </nav>
            </details>
          )}
          <ProductFilters key={clearHref + JSON.stringify(filters)} action={path} clearHref={clearHref} values={filters} brands={brands} preserved={preserved} />
          {priceUnavailable ? (
            <PriceFilterNotice continueHref={listingHref(path, values, { minPrice: undefined, maxPrice: undefined, sort: filters.sort.startsWith('price_') ? 'newest' : filters.sort, page: undefined })} />
          ) : filters.priceError ? (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Chỉnh lại khoảng giá rồi áp dụng bộ lọc để xem sản phẩm.</p>
          ) : !result ? <ApiError /> : result.data.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              <p>{filters.page > 1 ? 'Trang này chưa có sản phẩm.' : hasFilters ? 'Chưa có sản phẩm phù hợp với bộ lọc đã chọn.' : 'Hiện chưa có sản phẩm trong danh mục này.'}</p>
              {hasFilters && <Link href={clearHref} className="mt-3 inline-block font-semibold text-teal-800 underline underline-offset-2">Xóa bộ lọc để xem thêm</Link>}
              {filters.page > 1 && <Link href={listingHref(path, values, { page: 1 })} className="mt-3 block font-semibold text-teal-800 underline underline-offset-2">Về trang đầu tiên</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {result.data.map((product, index) => <ProductCard key={product.id} product={product} eager={index < 2} />)}
            </div>
          )}
          {result && <ListingPagination path={path} values={values} page={result.meta.page} totalPages={result.meta.totalPages} />}
        </div>
      </div>
    </div>
  );
}
