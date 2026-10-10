// Hợp đồng dữ liệu giữa frontend và API (NestJS).
// Lưu ý: giá (price/salePrice) là Decimal nên API trả về dạng CHUỖI ("2150000").

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  position: number;
  imageUrl?: string | null;
  parentId?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  children?: CategoryNode[];
  parent?: CategoryNode | null;
}

export interface ProductImage {
  url: string;
  alt?: string | null;
}

export interface ProductSpec {
  specName: string;
  specValue: string;
  position?: number;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  salePrice: string | null;
  soldCount: number;
  freeShip: boolean;
  brand: { name: string; slug: string } | null;
  images: ProductImage[];
  _count?: { reviews: number };
  // Điểm sao thật từ đánh giá đã duyệt (API cũ chưa trả → coi như chưa có)
  ratingAvg?: number;
  ratingCount?: number;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResponse {
  data: ProductCard[];
  meta: ProductListMeta;
}

export interface InventoryRow {
  quantity: number;
  warehouse: { name: string };
}

export interface Review {
  id: string;
  rating: number;
  content?: string | null;
  createdAt: string;
  customer: { fullName: string };
}

export interface ProductDetail extends ProductCard {
  description?: string | null;
  shortDesc?: string | null;
  warrantyMonths?: number | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  category: CategoryNode & { parent?: CategoryNode | null };
  specs: ProductSpec[];
  inventory: InventoryRow[];
  reviews: Review[];
  ratingAvg: number;
  ratingCount: number;
}

export type Settings = Record<string, string>;

export interface ProductQuery {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  spec?: string;
  sort?: string;
  page?: number;
  limit?: number;
  onSale?: boolean; // chỉ sản phẩm đang giảm giá
}
