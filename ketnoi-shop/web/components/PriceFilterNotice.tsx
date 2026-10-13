import Link from 'next/link';

export default function PriceFilterNotice({ continueHref }: { continueHref: string }) {
  return (
    <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
      <p className="font-semibold">Bộ lọc và sắp xếp theo giá đang được cập nhật.</p>
      <p className="mt-1">Bạn có thể tìm theo tên, mã sản phẩm hoặc lọc thương hiệu.</p>
      <Link href={continueHref} className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-2">
        Tiếp tục xem sản phẩm theo thương hiệu
      </Link>
    </div>
  );
}
