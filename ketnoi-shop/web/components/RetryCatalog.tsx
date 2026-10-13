'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RetryCatalog() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="min-h-11 rounded-md bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
      {pending ? 'Đang tải…' : 'Thử tải lại'}
    </button>
  );
}
