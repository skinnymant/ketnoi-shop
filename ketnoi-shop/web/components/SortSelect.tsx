'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best_selling', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
];

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      Sắp xếp:
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(Array.from(sp.entries()));
          params.set('sort', e.target.value);
          params.delete('page');
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
