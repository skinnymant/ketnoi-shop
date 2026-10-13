'use client';

import { useTransition } from 'react';
import { getStoreContact } from '@/lib/store-info';

export default function ProductError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const [pending, startTransition] = useTransition();
  const contact = getStoreContact();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-zinc-900">Thông tin sản phẩm tạm gián đoạn</h1>
      <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <p>Vui lòng thử lại sau ít phút hoặc liên hệ SWE để xác nhận model, giá và tồn kho.</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="button" disabled={pending} onClick={() => startTransition(() => unstable_retry())}
            className="min-h-11 rounded-md bg-teal-700 px-4 font-semibold text-white disabled:opacity-60">{pending ? 'Đang tải…' : 'Thử tải lại'}</button>
          <a href={contact.tel} className="font-semibold underline">Gọi {contact.hotline}</a>
          <a href={contact.zalo} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Tư vấn qua Zalo</a>
        </div>
      </div>
    </div>
  );
}
