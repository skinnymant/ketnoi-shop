'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

// Nút giỏ hàng đặt trên thanh nav nền teal — nền teal đậm, badge số lượng đỏ.
export default function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/gio-hang"
      className="shrink-0 rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
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
