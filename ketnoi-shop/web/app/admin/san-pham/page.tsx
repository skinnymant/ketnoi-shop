'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import { formatVND } from '@/lib/format';
import { getAdminToken, clearAdminToken } from '@/lib/admin-client';
import AdminNav from '@/components/admin/AdminNav';
import type { ProductCard } from '@/lib/types';

export default function AdminProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    setToken(getAdminToken());
    setReady(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/products?limit=50`);
      const d = await res.json();
      setProducts(Array.isArray(d.data) ? d.data : []);
    } catch {
      setErr('Không tải được danh sách sản phẩm.');
    }
  }, []);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function del(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return;
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      clearAdminToken();
      setToken(null);
      return;
    }
    if (res.ok) setProducts((p) => p.filter((x) => x.id !== id));
    else setErr('Xóa thất bại.');
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-500">
        Đang tải…
      </div>
    );
  }
  if (!token) {
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <AdminNav />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-800">
          Sản phẩm ({products.length})
        </h1>
        <Link
          href="/admin/san-pham/moi"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          + Thêm sản phẩm
        </Link>
      </div>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-400">
            <tr>
              <th className="px-3 py-2">Ảnh</th>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Giá</th>
              <th className="px-3 py-2">Thương hiệu</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100">
                <td className="px-3 py-2">
                  {p.images?.[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt=""
                      className="h-10 w-10 rounded object-contain"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-800">{p.name}</td>
                <td className="px-3 py-2 text-zinc-500">{p.sku}</td>
                <td className="px-3 py-2 font-medium text-red-600">
                  {formatVND(p.salePrice ?? p.price)}
                </td>
                <td className="px-3 py-2 text-zinc-500">{p.brand?.name ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Link
                    href={`/admin/san-pham/sua/${p.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => del(p.id, p.name)}
                    className="ml-3 text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
