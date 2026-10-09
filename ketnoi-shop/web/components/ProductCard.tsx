import Link from 'next/link';
import Image from 'next/image';
import type { ProductCard as ProductCardType } from '@/lib/types';
import { formatVND, discountPercent, effectivePrice } from '@/lib/format';
import RatingStars from './RatingStars';

// Thẻ sản phẩm dùng chung: badge giảm giá, sao đánh giá + đã bán, giá đỏ nổi bật
export default function ProductCard({ product }: { product: ProductCardType }) {
  const img = product.images?.[0]?.url;
  const off = discountPercent(product.price, product.salePrice);

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-white">
        {img ? (
          <Image
            src={img}
            alt={product.images[0]?.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-300">
            Không có ảnh
          </div>
        )}
        {/* Badge giảm giá góc trên trái */}
        {off !== null && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
            -{off}%
          </span>
        )}
        {product.freeShip && (
          <span className="absolute right-2 top-2 rounded bg-emerald-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Freeship
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">
            {product.brand.name}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-zinc-800 group-hover:text-teal-700">
          {product.name}
        </h3>

        {/* Sao thật (nếu có đánh giá) + số đã bán (nếu > 0) */}
        {(!!product.ratingCount || product.soldCount > 0) && (
          <div className="flex items-center gap-2 text-xs">
            <RatingStars avg={product.ratingAvg} count={product.ratingCount} />
            {product.soldCount > 0 && (
              <span className="text-zinc-500">Đã bán {product.soldCount}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-red-600">
            {formatVND(effectivePrice(product.price, product.salePrice))}
          </span>
          {off !== null && (
            <span className="text-xs text-zinc-500 line-through">
              {formatVND(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
