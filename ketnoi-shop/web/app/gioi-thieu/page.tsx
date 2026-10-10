import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref, zaloHref } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description:
    'Công ty TNHH Thương mại và Dịch vụ SWE Việt Nam — dụng cụ & thiết bị công nghiệp chính hãng.',
  alternates: { canonical: '/gioi-thieu' },
};

// Thông tin công ty — đồng bộ với Footer. Bổ sung câu chuyện thương hiệu,
// hình ảnh kho/cửa hàng tại đây khi có nội dung chính thức.
export default async function AboutPage() {
  const s = await getSettingsSafe();
  const hotline = hotlineOf(s);
  const zalo = zaloHref(s);

  const rows: [string, React.ReactNode][] = [
    ['Tên doanh nghiệp', 'Công ty TNHH Thương mại và Dịch vụ SWE Việt Nam'],
    ['Mã số doanh nghiệp', '2601 114 735'],
    ['Trụ sở', 'Tổ 38, Khu 5, Phường Vân Phú, Tỉnh Phú Thọ, Việt Nam'],
    [
      'Hotline',
      hotline ? (
        <a href={telHref(hotline)} className="font-semibold text-teal-700 underline">
          {hotline}
        </a>
      ) : (
        '—'
      ),
    ],
    ['Email', 'swephuthovietnam@gmail.com'],
    ['Giờ làm việc', s.gio_lam_viec ?? '8H - 21H (T2 - CN)'],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700">
          Trang chủ
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-700">Giới thiệu</span>
      </nav>

      <h1 className="text-2xl font-bold text-zinc-900">Giới thiệu SWE Việt Nam</h1>
      <p className="mt-2 italic text-zinc-600">
        &ldquo;Đi đầu về chất lượng, giá cả và dịch vụ&rdquo;
      </p>
      <p className="mt-4 leading-relaxed text-zinc-700">
        SWE Việt Nam cung cấp dụng cụ cầm tay, máy móc và thiết bị công nghiệp
        chính hãng từ các thương hiệu như Makita, Bosch, Milwaukee, Dewalt, Jasic —
        bảo hành chính hãng, giao hàng toàn quốc.
      </p>

      <dl className="mt-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="text-zinc-800">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {hotline && (
          <a
            href={telHref(hotline)}
            className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Gọi tư vấn
          </a>
        )}
        {zalo && (
          <a
            href={zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-teal-700 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            Chat Zalo
          </a>
        )}
      </div>
    </div>
  );
}
