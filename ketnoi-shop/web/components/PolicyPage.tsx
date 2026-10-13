import Link from 'next/link';
import type { ReactNode } from 'react';
import { getSettingsSafe } from '@/lib/api';
import { getStoreContact, STORE_INFO } from '@/lib/store-info';
import type { Settings } from '@/lib/types';

const policyLinks = [
  { href: '/chinh-sach-doi-tra', label: 'Đổi trả' },
  { href: '/chinh-sach-bao-hanh', label: 'Bảo hành' },
  { href: '/chinh-sach-giao-hang', label: 'Giao hàng' },
  { href: '/chinh-sach-bao-mat', label: 'Bảo mật thông tin' },
];

export default async function PolicyPage({
  title,
  lead,
  path,
  children,
  settings,
}: {
  title: string;
  lead: string;
  path: string;
  children: ReactNode;
  settings?: Settings;
}) {
  const contact = getStoreContact(settings ?? await getSettingsSafe());

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700 hover:underline">
          Trang chủ
        </Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span aria-current="page" className="text-zinc-800">{title}</span>
      </nav>
      <article>
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 leading-relaxed text-zinc-700">{lead}</p>
        </header>
        <div className="mt-7 space-y-7 text-sm leading-7 text-zinc-700 sm:text-base">
          {children}
        </div>
      </article>
      <section aria-labelledby="policy-support" className="mt-8 rounded-xl border border-teal-100 bg-teal-50 p-5">
        <h2 id="policy-support" className="text-lg font-bold text-teal-900">SWE hỗ trợ bạn</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Liên hệ SWE và cung cấp mã đơn để được hướng dẫn đúng trường hợp của bạn.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={contact.tel} className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
            Gọi {contact.hotline}
          </a>
          <a href={contact.zalo} target="_blank" rel="noopener noreferrer" className="rounded-md border border-teal-700 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-100">
            Chat Zalo
          </a>
        </div>
        <p className="mt-3 break-words text-sm text-zinc-700">
          Email:{' '}
          <a href={`mailto:${contact.email}`} className="text-teal-800 underline underline-offset-2">{contact.email}</a>
          <br />Giờ làm việc: {contact.workingHours}
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-600">{STORE_INFO.companyName} · MSDN: {STORE_INFO.businessRegistration}<br />{STORE_INFO.address}</p>
      </section>
      <nav aria-label="Các chính sách mua hàng" className="mt-6 flex flex-wrap gap-2">
        {policyLinks.map((link) => (
          <Link key={link.href} href={link.href} aria-current={link.href === path ? 'page' : undefined} className={`rounded-full border px-3 py-2 text-sm ${link.href === path ? 'border-teal-700 bg-teal-700 text-white' : 'border-zinc-300 text-zinc-700 hover:border-teal-700 hover:text-teal-800'}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg font-bold text-zinc-900">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
