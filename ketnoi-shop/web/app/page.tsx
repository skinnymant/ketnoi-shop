import Link from 'next/link';
import { getCategoriesSafe, getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ApiError from '@/components/ApiError';
import type { ProductCard as ProductCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let products: ProductCardType[] = [];
  let error = false;
  try {
    const res = await getProducts({ sort: 'best_selling', limit: 10 });
    products = res.data;
  } catch {
    error = true;
  }
  const categories = await getCategoriesSafe();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-500 p-8 text-white sm:p-12">
        <h1 className="text-2xl font-bold sm:text-4xl">SWE Phú Thọ Việt Nam</h1>
        <p className="mt-3 max-w-2xl text-white/90">
          Máy móc, thiết bị công nghiệp chính hãng — đi đầu về chất lượng,
          giá cả và dịch vụ. Bảo hành 12 tháng, giao hàng toàn quốc.
        </p>
      </section>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/danh-muc/${c.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 hover:border-red-300 hover:text-red-600"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-zinc-800">Sản phẩm bán chạy</h2>

      {error ? (
        <ApiError />
      ) : products.length === 0 ? (
        <p className="text-sm text-zinc-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
