// Tầng truy cập dữ liệu — MỌI lời gọi tới backend đều đi qua đây.
// Đổi backend chỉ cần sửa file này, UI giữ nguyên.

import { withProductImages } from './product-images';

import type {
  CategoryNode,
  ProductCard,
  ProductDetail,
  ProductListResponse,
  ProductQuery,
  Settings,
} from './types';

// trim(): bỏ khoảng trắng/tab lỡ dán thừa khi nhập biến môi trường trên Vercel
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:4000';

// URL công khai của website (dùng cho SEO: metadata, sitemap, robots)
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'http://localhost:3000';

// Thời gian (giây) dữ liệu được dùng lại trước khi hỏi lại API.
// Hết hạn thì Next trả bản cũ ngay và cập nhật ngầm; nếu API đang tắt
// (laptop/tunnel lỗi) thì tiếp tục phục vụ bản cũ thay vì báo lỗi.
// Chỉ phản hồi HTTP 200 mới được lưu, nên lỗi không ghi đè dữ liệu tốt.
const TTL = { products: 60, catalog: 300 } as const;

async function getJSON<T>(path: string, revalidate: number = TTL.products): Promise<T> {
  const res = await fetch(
    `${API_BASE}${path}`,
    typeof window === 'undefined'
      ? { next: { revalidate } }
      : { cache: 'no-store' }, // trình duyệt (trang admin): luôn lấy dữ liệu mới
  );
  if (!res.ok) {
    throw new Error(`API ${path} lỗi ${res.status}`);
  }
  return (await res.json()) as T;
}

// Bọc an toàn: dùng cho Header/Footer để layout không sập khi API tắt.
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

function buildQuery(q: ProductQuery): string {
  const sp = new URLSearchParams();
  if (q.category) sp.set('category', q.category);
  if (q.brand) sp.set('brand', q.brand);
  if (q.minPrice !== undefined) sp.set('minPrice', String(q.minPrice));
  if (q.maxPrice !== undefined) sp.set('maxPrice', String(q.maxPrice));
  if (q.search) sp.set('search', q.search);
  if (q.spec) sp.set('spec', q.spec);
  if (q.sort) sp.set('sort', q.sort);
  if (q.page) sp.set('page', String(q.page));
  if (q.limit) sp.set('limit', String(q.limit));
  if (q.onSale) sp.set('onSale', 'true');
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ----- Danh mục -----
export const getCategories = () =>
  getJSON<CategoryNode[]>('/categories', TTL.catalog);
export const getCategoriesSafe = () => safe(getCategories(), []);
export const getCategory = (slug: string) =>
  getJSON<CategoryNode>(`/categories/${encodeURIComponent(slug)}`, TTL.catalog);

// ----- Sản phẩm -----
export const getProducts = async (q: ProductQuery = {}) => {
  const result = await getJSON<ProductListResponse>(`/products${buildQuery(q)}`);
  return { ...result, data: result.data.map(withProductImages) };
};
export const getProduct = async (slug: string) =>
  withProductImages(
    await getJSON<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  );

// Sản phẩm theo danh mục — bọc an toàn, API lỗi trả mảng rỗng
// (dùng cho các khu vực danh mục ở trang chủ, không làm sập trang).
export const getProductsByCategory = (slug: string, limit = 5) =>
  safe(
    getProducts({ category: slug, limit }).then((res) => res.data),
    [] as ProductCard[],
  );

// ----- Thương hiệu -----
// Kiểu dữ liệu Brand khai báo tại đây (GET /brands trả về danh sách này).
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
}

export const getBrands = () => getJSON<Brand[]>('/brands', TTL.catalog);
export const getBrandsSafe = () => safe(getBrands(), [] as Brand[]);

// ----- Cấu hình hệ thống -----
export const getSettings = () => getJSON<Settings>('/settings', TTL.catalog);
export const getSettingsSafe = () => safe(getSettings(), {} as Settings);

export { API_BASE };
