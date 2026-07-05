'use client';

import { useState } from 'react';
import { useCart, type CartLine } from './CartContext';

export default function AddToCartButton({
  product,
}: {
  product: Omit<CartLine, 'quantity'>;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md ring-1 ring-zinc-300">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-lg text-zinc-500 hover:text-red-600"
          aria-label="Giảm"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="px-3 py-2 text-lg text-zinc-500 hover:text-red-600"
          aria-label="Tăng"
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
        className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        {added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
      </button>
    </div>
  );
}
