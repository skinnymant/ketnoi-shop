import Link from 'next/link';
import type { CategoryNode } from '@/lib/types';

// Mega-menu danh mục (desktop): nút "Danh mục sản phẩm" trên thanh nav teal,
// hover/focus mở danh sách dọc danh mục gốc; hover từng mục hiện danh mục con.
// CSS thuần với group-hover / group-focus-within — không cần JS.
export default function CategoryNav({
  categories,
}: {
  categories: CategoryNode[];
}) {
  if (!categories.length) return null;

  return (
    <div className="group relative hidden lg:block">
      <button
        type="button"
        className="flex h-full items-center gap-2 bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900"
      >
        <span aria-hidden>☰</span>
        Danh mục sản phẩm
      </button>

      {/* Bảng danh mục gốc (dọc), mở ngay dưới nút */}
      <div className="invisible absolute left-0 top-full z-40 w-72 rounded-b-md border border-zinc-200 bg-white opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <ul className="py-1">
          {categories.map((cat) => (
            <li key={cat.id} className="group/muc relative">
              <Link
                href={`/danh-muc/${cat.slug}`}
                className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-teal-50 hover:text-teal-700"
              >
                <span>{cat.name}</span>
                {!!cat.children?.length && (
                  <span className="text-zinc-400" aria-hidden>
                    ›
                  </span>
                )}
              </Link>

              {/* Danh mục con: trượt ra bên phải khi hover mục cha */}
              {!!cat.children?.length && (
                <div className="invisible absolute left-full top-0 z-40 min-w-64 rounded-md border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition group-hover/muc:visible group-hover/muc:opacity-100">
                  <ul className="grid gap-0.5">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/danh-muc/${child.slug}`}
                          className="block rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-teal-50 hover:text-teal-700"
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
    </div>
  );
}

// Hàng danh mục cuộn ngang cho mobile — giữ hành vi cũ, đổi màu nhấn sang teal.
export function CategoryNavMobile({
  categories,
}: {
  categories: CategoryNode[];
}) {
  if (!categories.length) return null;

  return (
    <nav className="border-t border-zinc-200 bg-white lg:hidden">
      <ul className="mx-auto flex max-w-7xl overflow-x-auto whitespace-nowrap px-4">
        {categories.map((cat) => (
          <li key={cat.id} className="shrink-0">
            <Link
              href={`/danh-muc/${cat.slug}`}
              className="block px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-teal-700"
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
