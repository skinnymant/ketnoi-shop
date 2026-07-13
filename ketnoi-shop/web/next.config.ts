import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cho phép next/image tải ảnh mẫu (placehold.co) và ảnh MinIO (localhost:9000)
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
    // Next 16 mặc định chặn ảnh từ localhost/IP nội bộ; chỉ nới khi dev
    // để hiển thị ảnh MinIO (localhost:9000). Khi chạy thật ảnh nằm ở
    // https://media.<domain> nên không cần cờ này.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
