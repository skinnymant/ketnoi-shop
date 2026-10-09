import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';
import { formatVND } from '@/lib/format';
import { getBankTransferDetails } from '@/lib/bank-transfer';

export const metadata: Metadata = {
  title: 'Hướng dẫn mua hàng & thanh toán',
  description:
    'Cách đặt hàng, thanh toán khi nhận hàng (COD) hoặc chuyển khoản VietQR, phí vận chuyển.',
  alternates: { canonical: '/huong-dan-thanh-toan' },
};

// Phí ship khi chưa đạt ngưỡng miễn phí — khớp SHIPPING_FLAT trong
// api/src/orders/orders.service.ts.
const SHIPPING_FLAT = 30000;

export default async function PaymentGuidePage() {
  const s = await getSettingsSafe();
  const hotline = hotlineOf(s);
  const nguong = Number(s.nguong_freeship) || 2000000;
  const bankAvailable = Boolean(getBankTransferDetails(s));

  const steps = [
    {
      title: 'Chọn sản phẩm',
      body: 'Tìm sản phẩm bằng ô tìm kiếm hoặc menu danh mục, chọn số lượng rồi bấm “Thêm vào giỏ” hoặc “Mua ngay”.',
    },
    {
      title: 'Kiểm tra giỏ hàng',
      body: 'Vào Giỏ hàng để chỉnh số lượng, xóa sản phẩm không cần, rồi bấm “Thanh toán”.',
    },
    {
      title: 'Điền thông tin nhận hàng',
      body: 'Nhập họ tên, số điện thoại và địa chỉ nhận hàng. Không cần tạo tài khoản — đăng nhập chỉ để lưu lịch sử đơn.',
    },
    {
      title: 'Chọn cách thanh toán và đặt hàng',
      body: bankAvailable
        ? 'Chọn COD hoặc chuyển khoản, kiểm tra tổng tiền rồi bấm “Đặt hàng”. Bạn sẽ nhận được mã đơn hàng ngay trên màn hình.'
        : 'Chọn thanh toán khi nhận hàng (COD), kiểm tra tổng tiền rồi bấm “Đặt hàng”. Bạn sẽ nhận được mã đơn hàng ngay trên màn hình.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <Link href="/" className="hover:text-teal-700">
          Trang chủ
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-700">Hướng dẫn thanh toán</span>
      </nav>

      <h1 className="text-2xl font-bold text-zinc-900">
        Hướng dẫn mua hàng &amp; thanh toán
      </h1>

      <ol className="mt-6 space-y-3">
        {steps.map((st, i) => (
          <li
            key={st.title}
            className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold text-zinc-800">{st.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{st.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 text-lg font-bold text-zinc-900">Hình thức thanh toán</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-zinc-800">
            Thanh toán khi nhận hàng (COD)
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Bạn trả tiền mặt cho nhân viên giao hàng khi nhận được sản phẩm. Được
            kiểm tra hàng trước khi thanh toán.
          </p>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-zinc-800">
            Chuyển khoản ngân hàng (VietQR)
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            {bankAvailable
              ? 'Sau khi đặt hàng bằng chuyển khoản, màn hình hiện mã QR kèm thông tin thanh toán đã được xác nhận cho đơn hàng. Kiểm tra người nhận, số tiền và nội dung chuyển khoản trước khi thanh toán. Đơn được xác nhận khi chúng tôi nhận được tiền.'
              : 'Chuyển khoản hiện chưa khả dụng. Bạn có thể thanh toán khi nhận hàng (COD).'}
          </p>
        </section>
      </div>

      <h2 className="mt-8 text-lg font-bold text-zinc-900">Phí vận chuyển</h2>
      <ul className="mt-3 space-y-1.5 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        <li>
          Đơn từ <b>{formatVND(nguong)}</b>: <b>miễn phí</b> vận chuyển.
        </li>
        <li>
          Đơn dưới {formatVND(nguong)}: phí vận chuyển {formatVND(SHIPPING_FLAT)}.
        </li>
        <li>Phí vận chuyển và tổng tiền luôn hiện rõ trước khi bạn bấm đặt hàng.</li>
      </ul>

      {hotline && (
        <p className="mt-8 rounded-lg bg-teal-50 p-4 text-sm text-zinc-700">
          Cần hỗ trợ đặt hàng? Gọi{' '}
          <a
            href={telHref(hotline)}
            className="font-bold text-teal-700 underline underline-offset-2"
          >
            {hotline}
          </a>
          {s.gio_lam_viec && <> ({s.gio_lam_viec})</>}.
        </p>
      )}
    </div>
  );
}
