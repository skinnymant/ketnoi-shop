import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';
import AddToCartButton from '@/components/cart/AddToCartButton';
import RatingStars from '@/components/RatingStars';
import StickyBuyBar from '@/components/cart/StickyBuyBar';
import { formatVND, discountPercent, effectivePrice } from '@/lib/format';
import type { ProductDetail } from '@/lib/types';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProduct(slug);
    const title = p.seoTitle || p.name;
    const description =
      p.seoDesc ||
      p.shortDesc ||
      `Mua ${p.name} chính hãng, giá tốt, giao nhanh.`;
    const img = p.images?.[0]?.url;
    return {
      title,
      description,
      alternates: { canonical: `/san-pham/${p.slug}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${SITE_URL}/san-pham/${p.slug}`,
        images: img ? [img] : [],
      },
    };
  } catch {
    return { title: 'Sản phẩm' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: ProductDetail | null = null;
  try {
    product = await getProduct(slug);
  } catch {
    product = null;
  }
  if (!product) notFound();
  const hotline = hotlineOf(await getSettingsSafe());

  const off = discountPercent(product.price, product.salePrice);
  const priceNow = effectivePrice(product.price, product.salePrice);
  const mainImg = product.images?.[0]?.url;
  const totalStock =
    product.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: priceNow,
    image: mainImg,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.shortDesc || product.seoDesc || product.name,
    image: product.images?.map((i) => new URL(i.url, SITE_URL).href) ?? [],
    ...(product.brand && {
      brand: { '@type': 'Brand', name: product.brand.name },
    }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: priceNow,
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/san-pham/${product.slug}`,
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.ratingAvg,
        reviewCount: product.ratingCount,
      },
    }),
  };

  // Cam kết bán hàng hiển thị ở cột thông tin
  const camKet = [
    'Hàng chính hãng 100%, đầy đủ hóa đơn',
    'Đổi trả miễn phí trong 7 ngày',
    `Bảo hành chính hãng ${product.warrantyMonths ?? 12} tháng`,
    'Giao hàng toàn quốc, kiểm tra trước khi nhận',
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700">
          Trang chủ
        </Link>
        {product.category && (
          <>
            <span className="mx-1">/</span>
            <Link
              href={`/danh-muc/${product.category.slug}`}
              className="hover:text-teal-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{product.name}</span>
      </nav>

      {/* Khối chính: gallery + thông tin mua hàng */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square rounded-lg border border-zinc-200 bg-white">
              {mainImg ? (
                <Image
                  src={mainImg}
                  alt={product.images[0]?.alt ?? product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300">
                  Không có ảnh
                </div>
              )}
              {off !== null && (
                <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-sm font-bold text-white">
                  -{off}%
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.slice(0, 5).map((im, i) => (
                  <div
                    key={i}
                    className="relative h-16 w-16 rounded border border-zinc-200 bg-white hover:border-teal-700"
                  >
                    <Image
                      src={im.url}
                      alt={im.alt ?? ''}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thông tin mua hàng */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{product.name}</h1>

            {/* Thương hiệu | Mã | Sao | Đã bán */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
              {product.brand && (
                <>
                  <span>
                    Thương hiệu:{' '}
                    <span className="font-semibold text-teal-700">
                      {product.brand.name}
                    </span>
                  </span>
                  <span className="text-zinc-300">|</span>
                </>
              )}
              <span>Mã: {product.sku}</span>
              {product.ratingCount > 0 && (
                <>
                  <span className="text-zinc-300">|</span>
                  <RatingStars
                    avg={product.ratingAvg}
                    count={product.ratingCount}
                    showCount={false}
                  />
                  <span>
                    {product.ratingAvg.toFixed(1)}/5 · {product.ratingCount} đánh
                    giá
                  </span>
                </>
              )}
              {product.soldCount > 0 && (
                <>
                  <span className="text-zinc-300">|</span>
                  <span>Đã bán {product.soldCount}</span>
                </>
              )}
            </div>

            {/* Giá */}
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-zinc-100 px-4 py-3">
              <span className="text-2xl font-bold text-red-600">
                {formatVND(priceNow)}
              </span>
              {off !== null && (
                <>
                  <span className="text-base text-zinc-400 line-through">
                    {formatVND(product.price)}
                  </span>
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    -{off}%
                  </span>
                </>
              )}
            </div>

            {/* Tình trạng kho + freeship */}
            <p className="mt-3 text-sm text-zinc-500">
              {totalStock > 0 ? (
                <span className="font-medium text-teal-700">
                  ✓ Còn hàng ({totalStock})
                </span>
              ) : (
                <span className="font-medium text-zinc-400">Tạm hết hàng</span>
              )}
              {product.freeShip && (
                <span className="ml-3 font-medium text-teal-700">
                  ✓ Miễn phí vận chuyển
                </span>
              )}
            </p>

            {/* Khối cam kết */}
            <ul className="mt-4 space-y-1.5 rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm text-zinc-700">
              {camKet.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="font-bold text-teal-700" aria-hidden>
                    ✓
                  </span>
                  {c}
                </li>
              ))}
            </ul>

            <div id="buy-box" className="mt-6">
              <AddToCartButton product={cartProduct} />
              {hotline && (
                <p className="mt-3 text-sm text-zinc-600">
                  Cần tư vấn chọn máy, báo giá số lượng lớn? Gọi{' '}
                  <a
                    href={telHref(hotline)}
                    className="font-bold text-teal-700 underline underline-offset-2"
                  >
                    {hotline}
                  </a>
                </p>
              )}
            </div>

            {/* Thông số kỹ thuật — bảng kẻ sọc */}
            {product.specs.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-2 border-l-4 border-teal-700 pl-2 font-bold text-zinc-800">
                  Thông số kỹ thuật
                </h2>
                <table className="w-full overflow-hidden rounded-lg text-sm">
                  <tbody>
                    {product.specs.map((s, i) => (
                      <tr key={i} className="odd:bg-zinc-100">
                        <td className="w-40 px-3 py-2 text-zinc-500">
                          {s.specName}
                        </td>
                        <td className="px-3 py-2 text-zinc-800">
                          {s.specValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      {product.description && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="mb-3 border-l-4 border-teal-700 pl-2 text-lg font-bold text-zinc-800">
            Mô tả sản phẩm
          </h2>
          <div
            className="max-w-none text-sm leading-relaxed text-zinc-700 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Đánh giá */}
      {product.reviews.length > 0 && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="mb-3 border-l-4 border-teal-700 pl-2 text-lg font-bold text-zinc-800">
            Đánh giá ({product.ratingCount})
          </h2>
          <ul className="space-y-3">
            {product.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-800">
                    {r.customer.fullName}
                  </span>
                  <span className="text-amber-400">
                    {'★'.repeat(r.rating)}
                  </span>
                </div>
                {r.content && (
                  <p className="mt-1 text-sm text-zinc-600">{r.content}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <StickyBuyBar product={cartProduct} />
    </div>
  );
}
