import Link from 'next/link';
import { listingHref, type ListingSearchParams } from '@/lib/listing-filters';

export default function ListingPagination({ path, values, page, totalPages }: {
  path: string;
  values: ListingSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((first, second) => first - second);
  const linkClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-teal-700 hover:text-teal-800';

  return (
    <nav aria-label="Phân trang sản phẩm" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={listingHref(path, values, { page: Math.min(page - 1, totalPages) })} prefetch={false} className={linkClass}>← Trang trước</Link>}
      {pages.map((number, index) => (
        <span key={number} className="flex items-center gap-2">
          {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-zinc-500">…</span>}
          <Link href={listingHref(path, values, { page: number })} prefetch={false} aria-label={`Trang ${number}`} aria-current={number === page ? 'page' : undefined} className={number === page ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white' : linkClass}>{number}</Link>
        </span>
      ))}
      {page < totalPages && <Link href={listingHref(path, values, { page: page + 1 })} prefetch={false} className={linkClass}>Trang sau →</Link>}
    </nav>
  );
}
