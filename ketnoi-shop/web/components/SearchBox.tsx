'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        if (t) router.push(`/tim-kiem?q=${encodeURIComponent(t)}`);
      }}
      className="flex w-full items-stretch overflow-hidden rounded-md bg-white ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-red-500"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm máy khoan, thang nhôm, thương hiệu..."
        className="min-w-0 flex-1 px-3 py-2 text-sm text-zinc-800 outline-none"
        aria-label="Tìm kiếm sản phẩm"
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
