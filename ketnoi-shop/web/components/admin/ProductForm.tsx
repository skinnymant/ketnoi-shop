'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getCategoriesSafe } from '@/lib/api';
import { getAdminToken } from '@/lib/admin-client';
import type { CategoryNode, ProductDetail } from '@/lib/types';
import { isWarrantySpec } from '@/lib/warranty';

interface ImageInput {
  url: string;
  alt?: string;
}
interface SpecInput {
  specName: string;
  specValue: string;
}
interface BrandOption {
  id: string;
  name: string;
}

// Bỏ dấu tiếng Việt -> slug
function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function flattenCategories(cats: CategoryNode[]): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const c1 of cats) {
    out.push({ id: c1.id, label: c1.name });
    for (const c2 of c1.children ?? []) {
      out.push({ id: c2.id, label: '— ' + c2.name });
      for (const c3 of c2.children ?? []) {
        out.push({ id: c3.id, label: '—— ' + c3.name });
      }
    }
  }
  return out;
}

export default function ProductForm({
  mode,
  initial,
  productId,
}: {
  mode: 'create' | 'edit';
  initial?: ProductDetail;
  productId?: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [price, setPrice] = useState(initial ? Number(initial.price) : 0);
  const [salePrice, setSalePrice] = useState(
    initial?.salePrice ? Number(initial.salePrice) : 0,
  );
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '');
  const [brandId, setBrandId] = useState(initial?.brand?.slug ? '' : '');
  const [shortDesc, setShortDesc] = useState(initial?.shortDesc ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [freeShip, setFreeShip] = useState(initial?.freeShip ?? false);
  const [warrantyMonths, setWarrantyMonths] = useState(
    initial?.warrantyMonths?.toString() ?? '',
  );
  const [images, setImages] = useState<ImageInput[]>(
    initial?.images?.map((i) => ({ url: i.url, alt: i.alt ?? undefined })) ?? [],
  );
  const [specs, setSpecs] = useState<SpecInput[]>(
    initial?.specs?.filter((s) => !isWarrantySpec(s.specName))
      .map((s) => ({ specName: s.specName, specValue: s.specValue })) ??
      [],
  );

  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getCategoriesSafe().then((c) => setCategories(flattenCategories(c)));
    fetch(`${API_BASE}/brands`)
      .then((r) => r.json())
      .then((b: BrandOption[]) => {
        setBrands(b);
        // gán brand hiện tại nếu đang sửa
        if (initial?.brand) {
          const found = b.find((x) => x.name === initial.brand?.name);
          if (found) setBrandId(found.id);
        }
      })
      .catch(() => {});
  }, [initial]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message ?? 'Tải ảnh thất bại');
        return;
      }
      setImages((prev) => [...prev, { url: data.url }]);
    } catch {
      setErr('Không tải được ảnh (MinIO đã chạy chưa?).');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const token = getAdminToken();
    if (!token) {
      setErr('Bạn cần đăng nhập quản trị.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        sku,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        categoryId,
        brandId: brandId || undefined,
        shortDesc: shortDesc || undefined,
        description: description || undefined,
        freeShip,
        warrantyMonths: warrantyMonths === '' ? null : Number(warrantyMonths),
        images: images.map((im, i) => ({
          url: im.url,
          alt: im.alt ?? name,
          position: i,
        })),
        specs: specs
          .filter((s) => s.specName && s.specValue && !isWarrantySpec(s.specName))
          .map((s, i) => ({ ...s, position: i })),
      };
      const url =
        mode === 'create'
          ? `${API_BASE}/products`
          : `${API_BASE}/products/${productId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : (data.message ?? 'Lưu thất bại'),
        );
        return;
      }
      router.push('/admin/san-pham');
    } catch {
      setErr('Không kết nối được máy chủ.');
    } finally {
      setSaving(false);
    }
  }

  const input =
    'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500';

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Tên sản phẩm *</span>
          <input
            className={input}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (mode === 'create' && !slug) setSlug('');
            }}
            required
            minLength={2}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Slug (URL) *</span>
          <div className="flex gap-2">
            <input
              className={input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tu-dong-tao-tu-ten"
              required
            />
            <button
              type="button"
              onClick={() => setSlug(slugify(name))}
              className="shrink-0 rounded-md bg-zinc-100 px-3 text-xs text-zinc-600 hover:bg-zinc-200"
            >
              Tạo
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">SKU *</span>
          <input
            className={input}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Giá gốc (VND) *</span>
            <input
              type="number"
              className={input}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              min={0}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Giá bán (VND)</span>
            <input
              type="number"
              className={input}
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              min={0}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Danh mục *</span>
            <select
              className={input}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">-- Chọn --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Thương hiệu</span>
            <select
              className={input}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">-- Không --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Bảo hành (tháng)</span>
            <input
              type="number"
              className={input}
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
              min={0}
              step={1}
              placeholder="Chưa xác nhận"
              aria-describedby="warranty-help"
            />
            <span id="warranty-help" className="mt-1 block text-xs text-zinc-500">
              Để trống nếu chưa xác nhận; nhập 0 nếu không bảo hành.
            </span>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={freeShip}
              onChange={(e) => setFreeShip(e.target.checked)}
            />
            Miễn phí vận chuyển
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Mô tả ngắn</span>
          <input
            className={input}
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Mô tả (HTML)</span>
          <textarea
            className={input}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-zinc-600">Ảnh sản phẩm</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((im, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.url}
                  alt=""
                  className="h-16 w-16 rounded object-contain ring-1 ring-zinc-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" onChange={onUpload} className="text-xs" />
          {uploading && <span className="ml-2 text-xs text-zinc-400">Đang tải…</span>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-zinc-600">Thông số kỹ thuật</span>
            <button
              type="button"
              onClick={() => setSpecs((p) => [...p, { specName: '', specValue: '' }])}
              className="text-xs text-red-600"
            >
              + Thêm dòng
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Thời hạn bảo hành được lấy từ ô Bảo hành (tháng).
            </p>
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={input}
                  placeholder="Tên (VD: Điện áp)"
                  value={s.specName}
                  onChange={(e) =>
                    setSpecs((p) =>
                      p.map((x, idx) =>
                        idx === i ? { ...x, specName: e.target.value } : x,
                      ),
                    )
                  }
                />
                <input
                  className={input}
                  placeholder="Giá trị (VD: 18V)"
                  value={s.specValue}
                  onChange={(e) =>
                    setSpecs((p) =>
                      p.map((x, idx) =>
                        idx === i ? { ...x, specValue: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setSpecs((p) => p.filter((_, idx) => idx !== i))}
                  className="shrink-0 px-2 text-zinc-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? 'Đang lưu…' : mode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/san-pham')}
            className="rounded-md px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-800"
          >
            Hủy
          </button>
        </div>
      </div>
    </form>
  );
}
