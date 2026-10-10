'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin-client';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const item = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        pathname.startsWith(href)
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-600 hover:text-red-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mb-5 flex items-center justify-between border-b border-zinc-200 pb-3">
      <div className="flex items-center gap-1">
        <span className="mr-2 font-bold text-zinc-800">Quản trị</span>
        {item('/admin/don-hang', 'Đơn hàng')}
        {item('/admin/san-pham', 'Sản phẩm')}
      </div>
      <button
        onClick={() => {
          clearAdminToken();
          router.push('/admin/dang-nhap');
        }}
        className="text-sm text-zinc-500 hover:text-red-600"
      >
        Đăng xuất
      </button>
    </div>
  );
}
