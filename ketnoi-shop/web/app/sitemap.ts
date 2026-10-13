import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import type { CategoryNode, ProductCard } from '@/lib/types';

// Render theo từng request nhưng dữ liệu lấy từ cache (xem TTL trong lib/api.ts)
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    ...[
      '/gioi-thieu',
      '/huong-dan-thanh-toan',
      '/khuyen-mai',
      '/chinh-sach-doi-tra',
      '/chinh-sach-bao-hanh',
      '/chinh-sach-giao-hang',
      '/chinh-sach-bao-mat',
    ].map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];

  // Fail the request when the API cannot supply a complete catalog. Returning
  // an empty array after a backend error would publish a misleading HTTP 200.
  const [cats, firstPage] = await Promise.all([
    getCategories(),
    getProducts({ page: 1, limit: 50 }),
  ]);
  const catSlugs = new Set<string>();
  function collectCategories(nodes: CategoryNode[]) {
    for (const node of nodes) {
      catSlugs.add(node.slug);
      collectCategories(node.children ?? []);
    }
  }
  collectCategories(cats);
  const categoryPages: MetadataRoute.Sitemap = [...catSlugs].map((slug) => ({
    url: absoluteUrl(`/danh-muc/${encodeURIComponent(slug)}`),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const { total, totalPages } = firstPage.meta;
  if (!Number.isInteger(total) || total < 0 ||
      !Number.isInteger(totalPages) || totalPages < 0 || totalPages > 1000) {
    throw new Error('Invalid catalog pagination for sitemap');
  }
  const products: ProductCard[] = [...firstPage.data];
  // API validation allows at most 50 products per page. Fetch every page,
  // including the final partial page, rather than silently dropping products.
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await getProducts({ page, limit: 50 });
    if (result.meta.total !== total || result.meta.totalPages !== totalPages) {
      throw new Error('Catalog changed while generating sitemap; retry later');
    }
    products.push(...result.data);
  }
  const productSlugs = new Set(products.map((product) => product.slug));
  if (products.length !== total || productSlugs.size !== total) {
    throw new Error('Incomplete catalog for sitemap');
  }
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/san-pham/${encodeURIComponent(product.slug)}`),
    changeFrequency: 'weekly',
    priority: 0.8,
    images: product.images.map((image) => absoluteUrl(image.url)),
  }));

  // No artificial lastModified: the API list does not expose updatedAt.
  // Search, cart, checkout and account pages intentionally remain absent.
  return [...staticPages, ...categoryPages, ...productPages];
}
