export type ListingSearchParams = Record<string, string | string[] | undefined>;

export const LISTING_SORTS = ['newest', 'best_selling', 'price_asc', 'price_desc'] as const;

export interface ListingFilters {
  page: number;
  sort: (typeof LISTING_SORTS)[number];
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  priceError?: string;
}

export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export function toSearchParams(values: ListingSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(name, item));
    else if (value !== undefined) params.set(name, value);
  }
  return params;
}

export function parseListingFilters(values: ListingSearchParams): ListingFilters {
  const rawPage = firstParam(values.page);
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage))
    ? Math.max(1, Math.min(Number(rawPage), 10000)) : 1;
  const rawSort = firstParam(values.sort);
  const sort = LISTING_SORTS.find((value) => value === rawSort) ?? 'newest';
  const rawBrand = firstParam(values.brand).trim();
  const brand = /^[a-z0-9][a-z0-9-]{0,79}$/.test(rawBrand) ? rawBrand : undefined;

  const price = (value: string) => value === '' ? undefined
    : /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  const minPrice = price(firstParam(values.minPrice).trim());
  const maxPrice = price(firstParam(values.maxPrice).trim());
  const priceError = minPrice === null || maxPrice === null
    ? 'Khoảng giá cần là số tiền nguyên từ 0 đồng trở lên.'
    : minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
      ? 'Giá từ cần nhỏ hơn hoặc bằng giá đến.' : undefined;

  return {
    page, sort, brand,
    ...(minPrice !== null && { minPrice }),
    ...(maxPrice !== null && { maxPrice }),
    ...(priceError && { priceError }),
  };
}

export function listingHref(path: string, values: ListingSearchParams, changes: Record<string, string | number | undefined> = {}): string {
  const params = toSearchParams(values);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '' || (key === 'page' && value === 1)) params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

// Names verified against the seeded catalog; never display an opaque URL slug
// as a category heading when the category API is unavailable.
const CATEGORY_NAMES: Record<string, string> = {
  'cong-cu-dung-cu': 'Công Cụ, Dụng Cụ',
  'thiet-bi-dung-pin': 'Thiết Bị Dùng Pin',
  'dung-cu-dien': 'Dụng Cụ Điện',
  'thiet-bi-nang-do': 'Thiết Bị Nâng Đỡ',
  'thang-nhom': 'Thang Nhôm',
  'may-han-phu-kien': 'Máy Hàn & Phụ Kiện',
  'dung-cu-khi-nen': 'Dụng Cụ Khí Nén',
  'thiet-bi-dung-nuoc': 'Thiết Bị Dùng Nước',
  'phu-tung-linh-kien': 'Phụ Tùng, Linh Kiện',
  'thang-nhom-chu-a': 'Thang Nhôm Chữ A',
  'thang-nhom-rut': 'Thang Nhôm Rút',
  'thang-nhom-ghe': 'Thang Nhôm Ghế',
};

export function categoryDisplayName(slug: string): string {
  return CATEGORY_NAMES[slug] ?? 'Danh mục sản phẩm';
}
