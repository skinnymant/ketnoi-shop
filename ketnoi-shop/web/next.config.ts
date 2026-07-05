import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cho phép next/image tải ảnh mẫu (placehold.co) và ảnh MinIO (localhost:9000)
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
};

export default nextConfig;
