import type { MetadataRoute } from 'next';
import { SITE_URL, getCategoriesSafe, getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${SITE_URL}/tim-kiem`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ];

  // Danh mục (3 cấp)
  const cats = await getCategoriesSafe();
  const catSlugs: string[] = [];
  for (const c1 of cats) {
    catSlugs.push(c1.slug);
    for (const c2 of c1.children ?? []) {
      catSlugs.push(c2.slug);
      for (const c3 of c2.children ?? []) catSlugs.push(c3.slug);
    }
  }
  const categoryPages: MetadataRoute.Sitemap = catSlugs.map((slug) => ({
    url: `${SITE_URL}/danh-muc/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Sản phẩm (demo lấy tối đa 50; production nên phân trang lấy toàn bộ)
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await getProducts({ limit: 50 });
    productPages = res.data.map((p) => ({
      url: `${SITE_URL}/san-pham/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    productPages = [];
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
