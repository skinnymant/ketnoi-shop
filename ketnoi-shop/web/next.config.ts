import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            // Limit embedding and form destinations without blocking Next.js
            // hydration, the API, product images or the external VietQR image.
            // A full script policy needs per-request nonces and separate testing.
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
  images: {
    // Cho phép next/image tải ảnh mẫu (placehold.co) và ảnh MinIO (localhost:9000)
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "localhost", port: "9000" },
      // Ảnh sản phẩm khi chạy thật (MinIO qua Cloudflare Tunnel)
      { protocol: "https", hostname: "media.swevietnam.com" },
    ],
    // Next 16 mặc định chặn ảnh từ localhost/IP nội bộ; chỉ nới khi dev
    // để hiển thị ảnh MinIO (localhost:9000). Khi chạy thật ảnh nằm ở
    // https://media.<domain> nên không cần cờ này.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
