'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useStoreAvailability } from '@/components/StoreAvailability';

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
  const [pending, startTransition] = useTransition();
  const { status, capabilities } = useStoreAvailability();
  const priceUnavailable = status === 'available' && !capabilities.effectivePriceFilters;

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      Sắp xếp:
      <select
        value={current}
        disabled={pending}
        aria-busy={pending}
        onChange={(e) => {
          const params = new URLSearchParams(Array.from(sp.entries()));
          params.set('sort', e.target.value);
          params.delete('page');
          if (priceUnavailable) {
            params.delete('minPrice');
            params.delete('maxPrice');
          }
          startTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
        className="min-h-11 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} disabled={priceUnavailable && o.value.startsWith('price_')}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
