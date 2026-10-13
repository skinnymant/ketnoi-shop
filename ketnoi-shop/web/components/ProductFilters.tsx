'use client';

import Link from 'next/link';
import { useId, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ListingFilters } from '@/lib/listing-filters';
import { useStoreAvailability } from '@/components/StoreAvailability';

export default function ProductFilters({
  action,
  clearHref,
  values,
  brands,
  preserved,
}: {
  action: string;
  clearHref: string;
  values: ListingFilters;
  brands: { slug: string; name: string }[];
  preserved: [string, string][];
}) {
  const router = useRouter();
  const { status, capabilities } = useStoreAvailability();
  const priceUnavailable = status === 'available' && !capabilities.effectivePriceFilters;
  const priceHelpId = useId();
  const [error, setError] = useState(values.priceError ?? '');
  const [open, setOpen] = useState(Boolean(values.priceError));
  const [pending, startTransition] = useTransition();
  const selectedBrandKnown = brands.some((brand) => brand.slug === values.brand);
  const hasFilters = Boolean(values.brand || values.minPrice !== undefined || values.maxPrice !== undefined);
  const activeCount = [Boolean(values.brand), values.minPrice !== undefined, values.maxPrice !== undefined].filter(Boolean).length;
  const inputClass = 'min-h-11 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lower = String(form.get('minPrice') ?? '').trim();
    const upper = String(form.get('maxPrice') ?? '').trim();
    if (!priceUnavailable && lower && upper && Number(lower) > Number(upper)) {
      setError('Giá từ cần nhỏ hơn hoặc bằng giá đến.');
      setOpen(true);
      return;
    }
    setError('');
    const params = new URLSearchParams();
    form.forEach((value, key) => {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
    });
    params.delete('page');
    if (priceUnavailable) {
      params.delete('minPrice');
      params.delete('maxPrice');
      if (params.get('sort')?.startsWith('price_')) params.set('sort', 'newest');
    }
    const query = params.toString();
    startTransition(() => router.push(`${action}${query ? `?${query}` : ''}`));
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mb-4 rounded-lg border border-zinc-200 bg-white">
      <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-900">
        Lọc thương hiệu và giá
        {hasFilters && <span className="ml-2 text-xs font-medium text-teal-800">({activeCount} đang chọn)</span>}
      </summary>
      <form method="get" action={action} onSubmit={submit} aria-label="Lọc sản phẩm" aria-busy={pending} className="border-t border-zinc-200 p-4">
      {preserved.map(([name, value], index) => <input key={`${name}-${index}`} type="hidden" name={name} value={value} />)}
      <fieldset disabled={pending}>
        <legend className="mb-3 text-sm font-bold text-zinc-900">Lọc sản phẩm</legend>
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <label className="block min-w-0 text-sm font-medium text-zinc-700">
            Thương hiệu
            <select name="brand" defaultValue={values.brand ?? ''} className={`mt-1 ${inputClass}`}>
              <option value="">Tất cả thương hiệu</option>
              {values.brand && !selectedBrandKnown && <option value={values.brand}>Thương hiệu đã chọn</option>}
              {brands.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}
            </select>
          </label>
          <label className="block min-w-0 text-sm font-medium text-zinc-700">
            Giá từ (₫)
            <input name="minPrice" type="number" inputMode="numeric" min="0" max={Number.MAX_SAFE_INTEGER} step="1" defaultValue={values.minPrice ?? ''} disabled={priceUnavailable} placeholder="Ví dụ: 100000" onChange={() => setError('')} aria-describedby={priceHelpId} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block min-w-0 text-sm font-medium text-zinc-700">
            Giá đến (₫)
            <input name="maxPrice" type="number" inputMode="numeric" min="0" max={Number.MAX_SAFE_INTEGER} step="1" defaultValue={values.maxPrice ?? ''} disabled={priceUnavailable} placeholder="Ví dụ: 2000000" onChange={() => setError('')} aria-describedby={priceHelpId} className={`mt-1 ${inputClass}`} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{pending ? 'Đang áp dụng…' : 'Áp dụng bộ lọc'}</button>
          {hasFilters && <Link href={clearHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 underline underline-offset-2">Xóa bộ lọc</Link>}
          <p id={priceHelpId} className={`text-xs ${priceUnavailable ? 'text-amber-800' : 'text-zinc-500'}`}>
            {priceUnavailable ? 'Bộ lọc giá đang được cập nhật; bạn có thể lọc thương hiệu.' : 'Có thể để trống một đầu khoảng giá.'}
          </p>
        </div>
      </fieldset>
      {error && !priceUnavailable && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      </form>
    </details>
  );
}
