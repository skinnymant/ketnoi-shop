import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFab from "@/components/ContactFab";
import { SITE_URL } from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Mọi trang render theo từng request, nhưng dữ liệu API lấy từ cache (TTL trong
// lib/api.ts). Nhờ vậy trang luôn nhanh và vẫn hiện sản phẩm khi API tạm tắt.
// Không dựng trang tĩnh (ISR): khi làm mới đúng lúc API lỗi, trang tĩnh sẽ bị
// dựng lại với 0 sản phẩm và giữ nguyên như vậy tới lần làm mới sau.
export const revalidate = 0;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "SWE Việt Nam — Dụng cụ & thiết bị công nghiệp chính hãng, giá tốt",
    template: "%s | SWE Việt Nam",
  },
  description:
    "Mua máy khoan, máy hàn, thang nhôm, xe đẩy hàng, dụng cụ cầm tay chính hãng Makita, Bosch, Milwaukee, Jasic — bảo hành đầy đủ, giao toàn quốc. Hotline 0865 457 498.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ContactFab />
        </CartProvider>
      </body>
    </html>
  );
}
