'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartLine } from './CartContext';
import { formatVND } from '@/lib/format';

// Thanh mua dính đáy màn hình trên mobile (trang sản phẩm).
// Hiện khi khối mua chính (#buy-box) không nằm trên màn hình — để không lặp nút.
// Lớp `has-buybar` trên body thêm khoảng đệm cuối trang (globals.css) để thanh
// không che nội dung footer.
export default function StickyBuyBar({
  product,
}: {
  product: Omit<CartLine, 'quantity'>;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const box = document.getElementById('buy-box');
    if (!box) return;
    document.body.classList.add('has-buybar');
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(box);
    return () => {
      io.disconnect();
      document.body.classList.remove('has-buybar');
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform lg:hidden ${
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-zinc-500">{product.name}</div>
          <div className="text-base font-bold text-red-600">{formatVND(product.price)}</div>
        </div>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => {
            add(product, 1);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="h-11 shrink-0 rounded-md border-2 border-red-600 px-3 text-sm font-semibold text-red-600"
        >
          {added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
        </button>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => {
            add(product, 1);
            router.push('/thanh-toan');
          }}
          className="h-11 shrink-0 rounded-md bg-red-600 px-4 text-sm font-semibold text-white"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}
