'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

// Nút giỏ hàng. Mặc định: chữ trên thanh nav teal (desktop).
// compact: icon có badge số lượng (header mobile).
export default function CartLink({ compact = false }: { compact?: boolean }) {
  const { count, ready } = useCart();
  const badge = ready && count > 0 && (
    <span
      className={
        compact
          ? 'absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[11px] font-semibold leading-5 text-white'
          : 'ml-1 rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white'
      }
    >
      {count}
    </span>
  );

  if (compact) {
    return (
      <Link
        href="/gio-hang"
        aria-label={ready && count > 0 ? `Giỏ hàng, ${count} sản phẩm` : 'Giỏ hàng'}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2.5 3h2.6l2.4 12.2a1 1 0 0 0 1 .8h9.3a1 1 0 0 0 1-.8L20.5 7H6" />
        </svg>
        {badge}
      </Link>
    );
  }

  return (
    <Link
      href="/gio-hang"
      className="shrink-0 rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
    >
      Giỏ hàng
      {badge}
    </Link>
  );
}
