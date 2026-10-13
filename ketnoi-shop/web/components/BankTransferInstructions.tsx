'use client';

import { useState } from 'react';
import type { BankTransferDetails } from '@/lib/bank-transfer';
import { formatVND } from '@/lib/format';
import { SWE_BANK_BRANCH, SWE_BANK_LABEL } from '@/lib/merchant-bank';

export default function BankTransferInstructions({
  bank,
  total,
  orderCode,
}: {
  bank: BankTransferDetails;
  total: string;
  orderCode: string;
}) {
  const [qrFailed, setQrFailed] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  // VietQR normalizes punctuation: show/copy exactly the content encoded by QR.
  const transferContent = orderCode.replace(/-/g, '');
  const qrUrl = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-compact2.png?${new URLSearchParams({
    amount: total,
    addInfo: transferContent,
    accountName: bank.accountName,
  })}`;
  const rows = [
    { label: 'Ngân hàng', value: SWE_BANK_LABEL },
    { label: 'Chi nhánh', value: SWE_BANK_BRANCH },
    { label: 'Số tài khoản', value: bank.accountNumber },
    { label: 'Chủ tài khoản', value: bank.accountName },
    { label: 'Số tiền', value: formatVND(total), copyValue: total },
    { label: 'Nội dung chuyển khoản', value: transferContent },
  ];

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`Đã sao chép ${label.toLocaleLowerCase('vi')}.`);
    } catch {
      setCopyMessage('Không thể sao chép tự động. Bạn có thể chọn và sao chép thông tin bên dưới.');
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-left sm:p-5">
      <h2 className="text-center text-lg font-semibold text-zinc-900">
        Thanh toán bằng chuyển khoản VietQR
      </h2>
      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800">
        Chờ xác nhận chuyển khoản
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
        Quét mã bằng ứng dụng ngân hàng, kiểm tra người nhận và chuyển đúng số tiền,
        nội dung của đơn hàng.
      </p>
      {qrFailed ? (
        <p role="status" className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
          Chưa tải được mã QR. Bạn vẫn có thể chuyển khoản bằng thông tin bên dưới.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt={`Mã VietQR chuyển khoản cho đơn ${orderCode}`}
          width={540}
          height={640}
          className="mx-auto mt-4 h-auto w-72 max-w-full"
          onError={() => setQrFailed(true)}
        />
      )}
      <dl className="mt-4 divide-y divide-zinc-100 text-sm">
        {rows.map(({ label, value, copyValue }) => (
          <div key={label} className="py-2">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="mt-0.5 flex items-center gap-3">
              <span className="min-w-0 flex-1 select-text break-words font-semibold text-zinc-900">{value}</span>
              <button
                type="button"
                onClick={() => copy(label, copyValue ?? value)}
                aria-label={`Sao chép ${label.toLocaleLowerCase('vi')}`}
                className="min-h-11 shrink-0 rounded-md border border-zinc-200 px-2 text-xs font-medium text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Sao chép
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-teal-800">
        {copyMessage}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
        SWE kiểm tra giao dịch và xác nhận sau khi nhận được tiền. Màn hình này
        chưa xác nhận thanh toán thành công. Nếu đã chuyển khoản, vui lòng không
        chuyển lần nữa và giữ lại biên lai cùng mã đơn hàng.
      </p>
    </section>
  );
}
