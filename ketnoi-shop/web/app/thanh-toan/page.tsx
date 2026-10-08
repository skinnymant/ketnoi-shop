'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { formatVND } from '@/lib/format';
import { API_BASE } from '@/lib/api';
import { getToken } from '@/lib/auth-client';

// Mặc định khi chưa tải được cài đặt; giá trị thật lấy từ settings.nguong_freeship
// (giống cách API tính phí ship trong orders.service.ts).
const FREESHIP_DEFAULT = 2000000;
const SHIPPING_FLAT = 30000;

// SĐT Việt Nam: 0xxxxxxxxx (10 số) hoặc +84/84 + 9 số; cho phép gõ kèm dấu cách/chấm
function normalizePhone(raw: string): string | null {
  const d = raw.replace(/[\s.\-()]/g, '');
  if (/^0\d{9,10}$/.test(d)) return d;
  if (/^\+?84\d{9}$/.test(d)) return '0' + d.replace(/^\+?84/, '');
  return null;
}

const inputCls =
  'w-full rounded-md border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:text-sm';

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {optional && <span className="font-normal text-zinc-500"> (không bắt buộc)</span>}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clear, ready } = useCart();
  const [token, setTokenState] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>(
    'COD',
  );
  const [placing, setPlacing] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderTotal, setOrderTotal] = useState('0');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');

  useEffect(() => {
    setTokenState(getToken());
    fetch(`${API_BASE}/settings`)
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const freeshipThreshold = Number(settings.nguong_freeship) || FREESHIP_DEFAULT;
  const shippingFee =
    subtotal === 0 || subtotal >= freeshipThreshold ? 0 : SHIPPING_FLAT;
  const total = subtotal + shippingFee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    if (items.length === 0) {
      setErr('Giỏ hàng trống.');
      return;
    }
    const phone = normalizePhone(receiverPhone);
    if (!phone) {
      setErr('Số điện thoại chưa đúng — vui lòng nhập 10 số, ví dụ 0912 345 678.');
      document.getElementById('co-phone')?.focus();
      return;
    }
    setPlacing(true);
    try {
      const body = {
        receiverName: receiverName.trim(),
        receiverPhone: phone,
        receiverEmail: receiverEmail || undefined,
        shippingAddress,
        note: note || undefined,
        paymentMethod,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      };
      // Đăng nhập là tùy chọn: có token thì đơn gắn vào tài khoản,
      // không có thì đặt hàng như khách vãng lai.
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : (data.message ?? 'Đặt hàng thất bại'),
        );
        return;
      }
      setOrderCode(data.orderCode);
      setOrderTotal(String(data.total));
      clear();
    } catch {
      setErr('Không kết nối được máy chủ.');
    } finally {
      setPlacing(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-500">
        Đang tải…
      </div>
    );
  }

  if (orderCode) {
    const isBank = paymentMethod === 'BANK_TRANSFER';
    const bankCode = settings.bank_code;
    const bankAccount = settings.bank_account;
    const bankName = settings.bank_name;
    const qrUrl =
      isBank && bankCode && bankAccount
        ? `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${Math.round(
            Number(orderTotal),
          )}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(
            bankName ?? '',
          )}`
        : '';
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="text-3xl">✓</div>
        <h1 className="mt-2 text-xl font-bold text-zinc-800">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Mã đơn hàng:{' '}
          <span className="font-semibold text-red-600">{orderCode}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Tổng tiền: <span className="font-semibold">{formatVND(orderTotal)}</span>
        </p>

        {isBank ? (
          <div className="mt-5 rounded-lg bg-white p-4 text-left ring-1 ring-zinc-200">
            <h2 className="mb-2 text-center font-semibold text-zinc-800">
              Chuyển khoản ngân hàng
            </h2>
            {qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="VietQR" className="mx-auto h-56 w-56" />
            )}
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              <li>
                Chủ tài khoản: <b>{bankName}</b>
              </li>
              <li>
                Số tài khoản: <b>{bankAccount}</b>
              </li>
              <li>
                Số tiền: <b>{formatVND(orderTotal)}</b>
              </li>
              <li>
                Nội dung: <b>{orderCode}</b>
              </li>
            </ul>
            <p className="mt-2 text-xs text-zinc-400">
              Quét mã QR bằng app ngân hàng để thanh toán. Đơn sẽ được xác nhận
              sau khi nhận được tiền.
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Thanh toán khi nhận hàng (COD) — shipper thu tiền khi giao.
          </p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-xl font-bold text-zinc-800">Thanh toán</h1>

      {!token && (
        <div className="mb-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Bạn có thể đặt hàng không cần tài khoản.{' '}
          <Link href="/dang-nhap?next=/thanh-toan" className="font-semibold underline">
            Đăng nhập / Đăng ký
          </Link>{' '}
          nếu muốn theo dõi lịch sử đơn hàng.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-lg bg-white p-4 ring-1 ring-zinc-200 lg:col-span-2"
        >
          <h2 className="text-base font-semibold text-zinc-800">Thông tin nhận hàng</h2>
          <Field id="co-name" label="Họ tên người nhận">
            <input
              id="co-name"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
              className={inputCls}
            />
          </Field>
          <Field id="co-phone" label="Số điện thoại">
            <input
              id="co-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="VD: 0912 345 678"
              required
              className={inputCls}
            />
          </Field>
          <Field id="co-email" label="Email" optional>
            <input
              id="co-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field id="co-address" label="Địa chỉ nhận hàng">
            <textarea
              id="co-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              required
              minLength={5}
              rows={3}
              autoComplete="street-address"
              className={inputCls}
            />
          </Field>
          <Field id="co-note" label="Ghi chú" optional>
            <textarea
              id="co-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: giao giờ hành chính, gọi trước khi giao"
              rows={2}
              className={inputCls}
            />
          </Field>

          <fieldset className="rounded-md border border-zinc-200 p-3">
            <legend className="px-1 text-sm font-medium text-zinc-700">
              Phương thức thanh toán
            </legend>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-700">
              <input
                type="radio"
                name="pm"
                className="h-4 w-4 accent-teal-700"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              Thanh toán khi nhận hàng (COD)
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-700">
              <input
                type="radio"
                name="pm"
                className="h-4 w-4 accent-teal-700"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={() => setPaymentMethod('BANK_TRANSFER')}
              />
              Chuyển khoản ngân hàng (quét mã VietQR sau khi đặt)
            </label>
          </fieldset>

          {err && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {err}
            </p>
          )}

          {/* Tổng tiền nhắc lại ngay trên nút đặt hàng */}
          <div className="flex items-baseline justify-between border-t border-zinc-200 pt-3">
            <span className="text-sm text-zinc-600">Tổng thanh toán</span>
            <span className="text-lg font-bold text-red-600">{formatVND(total)}</span>
          </div>
          <button
            type="submit"
            disabled={placing || items.length === 0}
            className="h-12 w-full rounded-md bg-red-600 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {placing ? 'Đang đặt hàng…' : 'Đặt hàng'}
          </button>
        </form>

        {/* Mobile: tóm tắt đơn hiện TRƯỚC form để khách thấy mình đang mua gì */}
        <aside className="order-first h-fit rounded-lg bg-white p-4 ring-1 ring-zinc-200 lg:order-none">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800">Đơn hàng</h2>
            <Link href="/gio-hang" className="text-sm text-teal-700 underline underline-offset-2">
              Sửa giỏ hàng
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">Giỏ hàng trống.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-zinc-600">
                    {i.name} ×{i.quantity}
                  </span>
                  <span className="shrink-0 text-zinc-800">
                    {formatVND(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-1 border-t border-zinc-100 pt-3 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}</span>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-teal-700">
                Mua thêm {formatVND(freeshipThreshold - subtotal)} để được miễn phí vận chuyển.
              </p>
            )}
            <div className="flex justify-between text-base font-bold text-zinc-900">
              <span>Tổng cộng</span>
              <span className="text-red-600">{formatVND(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
