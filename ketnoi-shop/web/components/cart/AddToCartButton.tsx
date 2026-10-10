'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartLine } from './CartContext';

export default function AddToCartButton({
  product,
}: {
  product: Omit<CartLine, 'quantity'>;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md ring-1 ring-zinc-300">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-11 w-11 text-lg text-zinc-600 hover:text-red-600"
          aria-label="Giảm số lượng"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="h-11 w-11 text-lg text-zinc-600 hover:text-red-600"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          add(product, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="h-11 rounded-md border-2 border-red-600 px-5 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        <span aria-live="polite">{added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          add(product, qty);
          router.push('/thanh-toan');
        }}
        className="h-11 rounded-md bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700"
      >
        Mua ngay
      </button>
    </div>
  );
}
