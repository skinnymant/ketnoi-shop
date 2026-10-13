import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Không cho index các trang riêng tư / tác vụ
        disallow: ['/admin', '/gio-hang', '/thanh-toan', '/dang-nhap', '/dang-ky', '/tai-khoan', '/kiem-tra-api', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
