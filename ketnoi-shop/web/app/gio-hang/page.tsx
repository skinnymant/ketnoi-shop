'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { formatVND } from '@/lib/format';

export default function CartPage() {
  const { items, subtotal, setQty, remove, ready } = useCart();

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-500">
        Đang tải giỏ hàng…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-800">Giỏ hàng</h1>
        <p className="mt-2 text-zinc-600">Giỏ hàng của bạn đang trống.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/khuyen-mai"
            className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Xem sản phẩm khuyến mãi
          </Link>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:border-teal-700 hover:text-teal-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-xl font-bold text-zinc-800">Giỏ hàng</h1>

      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-4 rounded-lg bg-white p-3 ring-1 ring-zinc-200"
          >
            <div className="relative h-16 w-16 shrink-0 rounded bg-zinc-50">
              {i.image && (
                <Image
                  src={i.image}
                  alt={i.name}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/san-pham/${i.slug}`}
                className="line-clamp-2 text-sm font-medium text-zinc-800 hover:text-red-600"
              >
                {i.name}
              </Link>
              <div className="mt-1 text-sm text-red-600">
                {formatVND(i.price)}
              </div>
            </div>
            <div className="flex items-center rounded-md ring-1 ring-zinc-300">
              <button
                onClick={() => setQty(i.id, i.quantity - 1)}
                className="px-2 py-1 text-zinc-500 hover:text-red-600"
                aria-label="Giảm"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{i.quantity}</span>
              <button
                onClick={() => setQty(i.id, i.quantity + 1)}
                className="px-2 py-1 text-zinc-500 hover:text-red-600"
                aria-label="Tăng"
              >
                +
              </button>
            </div>
            <div className="hidden w-24 text-right text-sm font-semibold text-zinc-800 sm:block">
              {formatVND(i.price * i.quantity)}
            </div>
            <button
              onClick={() => remove(i.id)}
              className="text-zinc-400 hover:text-red-600"
              aria-label="Xóa"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-end gap-3">
        <div className="text-lg">
          Tạm tính:{' '}
          <span className="font-bold text-red-600">{formatVND(subtotal)}</span>
        </div>
        <Link
          href="/thanh-toan"
          className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Thanh toán
        </Link>
      </div>
    </div>
  );
}
