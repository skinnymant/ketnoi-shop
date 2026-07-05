import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { formatVND, discountPercent, effectivePrice } from '@/lib/format';
import type { ProductDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  const off = discountPercent(product.price, product.salePrice);
  const priceNow = effectivePrice(product.price, product.salePrice);
  const mainImg = product.images?.[0]?.url;
  const totalStock =
    product.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        {product.category && (
          <>
            <span className="mx-1">/</span>
            <Link
              href={`/danh-muc/${product.category.slug}`}
              className="hover:text-red-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-lg bg-white ring-1 ring-zinc-200">
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
              <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-sm font-semibold text-white">
                -{off}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.slice(0, 5).map((im, i) => (
                <div
                  key={i}
                  className="relative h-16 w-16 rounded bg-white ring-1 ring-zinc-200"
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

        {/* Info */}
        <div>
          {product.brand && (
            <span className="text-sm text-zinc-400">{product.brand.name}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span>SKU: {product.sku}</span>
            <span>·</span>
            <span>Đã bán {product.soldCount}</span>
            {product.ratingCount > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-500">
                  ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                </span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-red-600">
              {formatVND(priceNow)}
            </span>
            {off !== null && (
              <span className="text-lg text-zinc-400 line-through">
                {formatVND(product.price)}
              </span>
            )}
          </div>

          {product.freeShip && (
            <p className="mt-2 text-sm font-medium text-emerald-600">
              ✓ Miễn phí vận chuyển
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-500">
            {totalStock > 0 ? `Còn hàng (${totalStock})` : 'Tạm hết hàng'}
            {product.warrantyMonths
              ? ` · Bảo hành ${product.warrantyMonths} tháng`
              : ''}
          </p>

          <div className="mt-6">
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: priceNow,
                image: mainImg,
              }}
            />
          </div>

          {product.specs.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-2 font-semibold text-zinc-800">
                Thông số kỹ thuật
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {product.specs.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="w-40 py-2 text-zinc-500">{s.specName}</td>
                      <td className="py-2 text-zinc-800">{s.specValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-zinc-800">
            Mô tả sản phẩm
          </h2>
          <div
            className="max-w-none text-sm leading-relaxed text-zinc-700 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {product.reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-zinc-800">
            Đánh giá ({product.ratingCount})
          </h2>
          <ul className="space-y-3">
            {product.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-lg bg-white p-4 ring-1 ring-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-800">
                    {r.customer.fullName}
                  </span>
                  <span className="text-amber-500">
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
    </div>
  );
}
