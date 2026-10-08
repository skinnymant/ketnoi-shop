'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBox({
  defaultValue = '',
  label = 'Tìm kiếm sản phẩm',
}: {
  defaultValue?: string;
  label?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        if (t) router.push(`/tim-kiem?q=${encodeURIComponent(t)}`);
      }}
      className="flex w-full items-stretch overflow-hidden rounded-md bg-white ring-1 ring-zinc-300 focus-within:ring-2 focus-within:ring-teal-600"
    >
      <input
        type="search"
        enterKeyHint="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm máy khoan, thang nhôm, thương hiệu..."
        className="min-w-0 flex-1 px-3 py-2.5 text-sm text-zinc-800 outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label={label}
      />
      <button
        type="submit"
        className="shrink-0 bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
      >
        Tìm
      </button>
    </form>
  );
}

// Ô tìm kiếm trên header: đang ở trang kết quả thì giữ nguyên từ khóa đã gõ.
export function HeaderSearch() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const q = pathname === '/tim-kiem' ? (sp.get('q') ?? '') : '';
  return <SearchBox key={q} defaultValue={q} />;
}
