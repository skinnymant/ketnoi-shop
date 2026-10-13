import Link from 'next/link';
import type { Metadata } from 'next';
import { API_BASE, getBrandsSafe, getCategoriesSafe, getProducts, getSettingsSafe } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import ListingPagination from '@/components/ListingPagination';
import SortSelect from '@/components/SortSelect';
import ApiError from '@/components/ApiError';
import PriceFilterNotice from '@/components/PriceFilterNotice';
import { firstParam, listingHref, parseListingFilters, toSearchParams, type ListingSearchParams } from '@/lib/listing-filters';
import { getStoreContact } from '@/lib/store-info';
import { probeStoreStatus } from '@/lib/store-status';

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const keyword = firstParam(params.q).trim();
  return {
    title: keyword ? `Tìm “${keyword}”` : 'Tìm kiếm',
    description: 'Tìm dụng cụ và thiết bị công nghiệp theo tên, thương hiệu hoặc mã sản phẩm tại SWE Việt Nam.',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const params = await searchParams;
  const keyword = firstParam(params.q).trim();
  const filters = parseListingFilters(params);
  const values = { ...params, q: keyword || undefined };
  const priceRequested = !!keyword && !filters.priceError &&
    (filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.sort.startsWith('price_'));
  const statusPromise = priceRequested ? probeStoreStatus(API_BASE) : Promise.resolve(null);
  const resultPromise = (async () => {
    if (!keyword || filters.priceError) return { result: null, error: false, priceUnavailable: false };
    const status = await statusPromise;
    if (status && !status.available) return { result: null, error: true, priceUnavailable: false };
    if (status && !status.capabilities.effectivePriceFilters) return { result: null, error: false, priceUnavailable: true };
    return getProducts({ search: keyword, sort: filters.sort, brand: filters.brand, minPrice: filters.minPrice, maxPrice: filters.maxPrice, page: filters.page, limit: 24 })
      .then((result) => ({ result, error: false, priceUnavailable: false }))
      .catch(() => ({ result: null, error: true, priceUnavailable: false }));
  })();
  const [loaded, allBrands] = await Promise.all([resultPromise, keyword ? getBrandsSafe() : Promise.resolve([])]);
  const { result, error, priceUnavailable } = loaded;
  const brands = allBrands.map(({ slug, name }) => ({ slug, name }))
    .sort((first, second) => first.name.localeCompare(second.name, 'vi'));
  const clearHref = listingHref('/tim-kiem', values, { brand: undefined, minPrice: undefined, maxPrice: undefined, page: undefined });
  const preserved = Array.from(toSearchParams(values).entries())
    .filter(([name]) => !['brand', 'minPrice', 'maxPrice', 'page'].includes(name));
  const hasFilters = Boolean(filters.brand || filters.minPrice !== undefined || filters.maxPrice !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-bold text-zinc-900">Tìm sản phẩm</h1>
        <form role="search" method="get" action="/tim-kiem" className="mt-3 flex gap-2">
          <label htmlFor="search-keyword" className="sr-only">Tên, thương hiệu hoặc mã sản phẩm</label>
          <input id="search-keyword" name="q" type="search" defaultValue={keyword} key={keyword} placeholder="Tên, thương hiệu hoặc mã sản phẩm" className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700" />
          <button className="min-h-11 shrink-0 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Tìm kiếm</button>
        </form>
        {keyword ? (
          <p className="mt-3 text-sm text-zinc-600">
            {result ? <><strong className="text-zinc-800">{result.meta.total}</strong> kết quả cho </> : 'Tìm kiếm cho '}
            “<span className="break-words font-semibold text-teal-800">{keyword}</span>”
          </p>
        ) : <p className="mt-3 text-sm text-zinc-600">Nhập tên, thương hiệu hoặc mã model để tìm sản phẩm.</p>}
      </div>

      {keyword && (
        <>
          <ProductFilters key={clearHref + JSON.stringify(filters)} action="/tim-kiem" clearHref={clearHref} values={filters} brands={brands} preserved={preserved} />
          <div className="mb-4 flex justify-end"><SortSelect current={filters.sort} /></div>
        </>
      )}

      {error ? <ApiError /> : priceUnavailable ? (
        <PriceFilterNotice continueHref={listingHref('/tim-kiem', values, { minPrice: undefined, maxPrice: undefined, sort: filters.sort.startsWith('price_') ? 'newest' : filters.sort, page: undefined })} />
      ) : filters.priceError ? (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Chỉnh lại khoảng giá rồi áp dụng bộ lọc để xem sản phẩm.</p>
      ) : keyword && result?.data.length === 0 ? (
        <NoResult keyword={keyword} hasFilters={hasFilters} clearHref={clearHref} page={filters.page} firstPageHref={listingHref('/tim-kiem', values, { page: 1 })} />
      ) : result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {result.data.map((product, index) => <ProductCard key={product.id} product={product} eager={index < 2} />)}
        </div>
      ) : null}

      {result && <ListingPagination path="/tim-kiem" values={values} page={result.meta.page} totalPages={result.meta.totalPages} />}
    </div>
  );
}

async function NoResult({ keyword, hasFilters, clearHref, page, firstPageHref }: {
  keyword: string;
  hasFilters: boolean;
  clearHref: string;
  page: number;
  firstPageHref: string;
}) {
  const [categories, settings] = await Promise.all([getCategoriesSafe(), getSettingsSafe()]);
  const contact = getStoreContact(settings);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
      <p className="font-semibold text-zinc-900">{page > 1 ? 'Trang này chưa có sản phẩm.' : `Chưa tìm thấy sản phẩm phù hợp với “${keyword}”.`}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {hasFilters && <Link href={clearHref} className="font-semibold text-teal-800 underline underline-offset-2">Xóa bộ lọc để xem thêm</Link>}
        {page > 1 && <Link href={firstPageHref} className="font-semibold text-teal-800 underline underline-offset-2">Về trang kết quả đầu tiên</Link>}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Thử từ khóa ngắn hơn, ví dụ “máy khoan” hoặc “Makita”.</li>
        <li>Tìm theo mã model in trên máy hoặc hộp.</li>
      </ul>
      {categories.length > 0 && (
        <>
          <h2 className="mt-5 font-semibold text-zinc-900">Xem theo danh mục</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => <li key={category.id}><Link href={`/danh-muc/${category.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-zinc-200 px-4 py-2 text-zinc-700 hover:border-teal-700 hover:text-teal-800">{category.name}</Link></li>)}
          </ul>
        </>
      )}
      <p className="mt-5 rounded-md bg-teal-50 p-3 text-zinc-700">Không thấy sản phẩm bạn cần? Gọi <a href={contact.tel} className="font-bold text-teal-800 underline underline-offset-2">{contact.hotline}</a> để được tư vấn.</p>
    </div>
  );
}
