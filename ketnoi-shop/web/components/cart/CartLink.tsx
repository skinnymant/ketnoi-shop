'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

export default function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/gio-hang"
      className="shrink-0 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-red-300 hover:text-red-600"
    >
      Giỏ hàng
      {ready && count > 0 && (
        <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
