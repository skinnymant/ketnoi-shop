'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import ProductForm from '@/components/admin/ProductForm';
import { getProduct } from '@/lib/api';
import { getAdminToken } from '@/lib/admin-client';
import type { ProductDetail } from '@/lib/types';

export default function EditProductPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setOk(!!getAdminToken());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!slug) return;
    getProduct(slug)
      .then(setProduct)
      .catch(() => setErr('Không tải được sản phẩm.'));
  }, [slug]);

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
      <h1 className="mb-4 text-xl font-bold text-zinc-800">Sửa sản phẩm</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {product ? (
        <ProductForm mode="edit" initial={product} productId={product.id} />
      ) : (
        !err && <p className="text-sm text-zinc-500">Đang tải sản phẩm…</p>
      )}
    </div>
  );
}
