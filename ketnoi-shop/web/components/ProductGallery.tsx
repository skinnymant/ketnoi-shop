'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { ProductImage } from '@/lib/types';

export default function ProductGallery({ images, name, discount }: {
  images: ProductImage[]; name: string; discount: number | null;
}) {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = images[selected] ?? images[0];
  return (
    <div>
      <button type="button" disabled={!current} aria-label={`Phóng to ảnh ${name}`}
        onClick={() => dialog.current?.showModal()}
        className="relative block aspect-square w-full rounded-lg border border-zinc-200 bg-white focus-visible:outline-2 focus-visible:outline-teal-700">
        {current ? <Image src={current.url} alt={current.alt || name} fill loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain p-4" />
          : <span className="text-sm text-zinc-500">Chưa có ảnh</span>}
        {discount !== null && <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-sm font-bold text-white">-{discount}%</span>}
      </button>
      {current && <p className="mt-2 text-center text-xs text-zinc-500">Chạm vào ảnh để xem lớn</p>}
      {images.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Ảnh sản phẩm">
        {images.map((im, i) => <button type="button" key={`${im.url}-${i}`} aria-label={`Xem ảnh ${i + 1} của ${name}`} aria-pressed={selected === i}
          onClick={() => setSelected(i)} className={`relative h-16 w-16 rounded border-2 bg-white ${selected === i ? 'border-teal-700' : 'border-zinc-200'}`}>
          <Image src={im.url} alt={im.alt || `Ảnh ${i + 1}`} fill sizes="64px" className="object-contain p-1" />
        </button>)}
      </div>}
      <dialog ref={dialog} aria-label={`Ảnh lớn ${name}`} onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}
        className="fixed inset-0 m-auto w-[min(90vw,800px)] max-w-none rounded-xl border border-zinc-200 bg-white p-4 backdrop:bg-black/60">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-800">{name}</p>
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded border px-4 text-sm">Đóng ảnh</button>
        </div>
        {current && <div className="relative mt-3 aspect-square max-h-[75vh]">
          <Image src={current.url} alt={current.alt || name} fill sizes="(max-width: 800px) 90vw, 800px" className="object-contain" />
        </div>}
      </dialog>
    </div>
  );
}
