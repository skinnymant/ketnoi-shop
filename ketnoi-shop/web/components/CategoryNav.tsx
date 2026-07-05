import Link from 'next/link';
import type { CategoryNode } from '@/lib/types';

export default function CategoryNav({ categories }: { categories: CategoryNode[] }) {
  if (!categories.length) return null;

  return (
    <nav className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex flex-wrap">
          {categories.map((cat) => (
            <li key={cat.id} className="group relative">
              <Link
                href={`/danh-muc/${cat.slug}`}
                className="block px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-red-600"
              >
                {cat.name}
              </Link>
              {!!cat.children?.length && (
                <div className="invisible absolute left-0 top-full z-20 min-w-56 rounded-b-md border border-zinc-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <ul className="grid gap-0.5">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/danh-muc/${child.slug}`}
                          className="block rounded px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-red-600"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
