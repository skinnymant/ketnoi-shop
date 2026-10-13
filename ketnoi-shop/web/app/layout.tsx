import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFab from "@/components/ContactFab";
import { StoreAvailabilityProvider } from "@/components/StoreAvailability";
import WebMetrics from "@/components/WebMetrics";
import { absoluteUrl, serializeJsonLd, SITE_URL } from "@/lib/seo";

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
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "SWE Việt Nam",
    title: "SWE Việt Nam — Dụng cụ & thiết bị công nghiệp",
    description:
      "Dụng cụ cầm tay, máy khoan, máy hàn và thiết bị công nghiệp. Tư vấn đúng model, bảo hành theo sản phẩm, giao hàng toàn quốc.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SWE Việt Nam — Dụng cụ & thiết bị công nghiệp",
    description:
      "Tư vấn dụng cụ và thiết bị công nghiệp, bảo hành theo sản phẩm, giao hàng toàn quốc.",
    images: [absoluteUrl("/opengraph-image")],
  },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: "SWE Việt Nam",
  legalName: "Công ty TNHH Thương mại và Dịch vụ SWE Việt Nam",
  url: SITE_URL,
  logo: absoluteUrl("/brand/swe-logo.png"),
  taxID: "2601114735",
  email: "swephuthovietnam@gmail.com",
  telephone: "+84865457498",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Tổ 38, Khu 5, Phường Vân Phú",
    addressRegion: "Phú Thọ",
    addressCountry: "VN",
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }}
        />
        <CartProvider>
          <WebMetrics />
          <Header />
          <StoreAvailabilityProvider>
          <main className="flex-1">{children}</main>
          <Footer />
          <ContactFab />
          </StoreAvailabilityProvider>
        </CartProvider>
      </body>
    </html>
  );
}
