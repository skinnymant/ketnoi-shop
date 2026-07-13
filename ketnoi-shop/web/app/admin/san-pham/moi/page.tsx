'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import ProductForm from '@/components/admin/ProductForm';
import { getAdminToken } from '@/lib/admin-client';

export default function NewProductPage() {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setOk(!!getAdminToken());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-zinc-500">
        Đang tải…
      </div>
    );
  }
  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-zinc-600">Bạn cần đăng nhập quản trị.</p>
        <Link
          href="/admin/dang-nhap"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AdminNav />
      <h1 className="mb-4 text-xl font-bold text-zinc-800">Thêm sản phẩm</h1>
      <ProductForm mode="create" />
    </div>
  );
}
