import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';
import { formatVND } from '@/lib/format';
import { SWE_BANK, SWE_BANK_BRANCH, SWE_BANK_LABEL } from '@/lib/merchant-bank';

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
      body: 'Chọn COD hoặc chuyển khoản VietQR, kiểm tra tổng tiền rồi bấm “Đặt hàng”. Bạn sẽ nhận được mã đơn hàng ngay trên màn hình. Với chuyển khoản, mã QR được tạo theo số tiền và nội dung của đơn đã ghi nhận.',
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
            Sau khi đặt hàng bằng chuyển khoản, quét mã QR trên màn hình bằng ứng
            dụng ngân hàng. Kiểm tra người nhận, số tiền và nội dung trước khi
            chuyển. SWE kiểm tra giao dịch và xác nhận sau khi nhận được tiền.
          </p>
        </section>
      </div>

      <h2 className="mt-8 text-lg font-bold text-zinc-900">Tài khoản nhận thanh toán của SWE</h2>
      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-[9rem_1fr] sm:gap-y-2">
          <dt className="text-zinc-500">Ngân hàng</dt>
          <dd className="-mt-2 break-words font-semibold text-zinc-800 sm:mt-0">{SWE_BANK_LABEL}</dd>
          <dt className="text-zinc-500">Chi nhánh</dt>
          <dd className="-mt-2 break-words text-zinc-800 sm:mt-0">{SWE_BANK_BRANCH}</dd>
          <dt className="text-zinc-500">Số tài khoản</dt>
          <dd className="-mt-2 select-text break-words text-lg font-bold tracking-wide text-teal-800 sm:mt-0">{SWE_BANK.accountNumber}</dd>
          <dt className="text-zinc-500">Chủ tài khoản</dt>
          <dd className="-mt-2 select-text break-words font-semibold text-zinc-800 sm:mt-0">{SWE_BANK.accountName}</dd>
        </dl>
        <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm leading-relaxed text-teal-900">
          Đặt hàng trước khi chuyển khoản để có mã đơn và tổng tiền chính xác.
          Nội dung chuyển khoản là mã đơn hàng viết liền, bỏ dấu gạch nối. Nếu mã QR không tải được, bạn có
          thể sao chép thông tin thanh toán trên màn hình kết quả đặt hàng.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Trạng thái ban đầu là “Chờ xác nhận chuyển khoản”. Nếu đã chuyển tiền,
          giữ lại biên lai và mã đơn để SWE đối chiếu; không chuyển thêm lần nữa.
        </p>
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
