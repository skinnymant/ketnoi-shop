'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { formatVND } from '@/lib/format';
import { API_BASE } from '@/lib/api';
import { getToken } from '@/lib/auth-client';

const FREESHIP_THRESHOLD = 2000000;
const SHIPPING_FLAT = 30000;

export default function CheckoutPage() {
  const { items, subtotal, clear, ready } = useCart();
  const [token, setTokenState] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  const shippingFee =
    subtotal === 0 || subtotal >= FREESHIP_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shippingFee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    if (!token) {
      setErr('Bạn cần đăng nhập trước khi đặt hàng.');
      return;
    }
    if (items.length === 0) {
      setErr('Giỏ hàng trống.');
      return;
    }
    setPlacing(true);
    try {
      const body = {
        receiverName,
        receiverPhone,
        receiverEmail: receiverEmail || undefined,
        shippingAddress,
        note: note || undefined,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      };
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-3xl">✓</div>
        <h1 className="mt-2 text-xl font-bold text-zinc-800">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Mã đơn hàng của bạn:{' '}
          <span className="font-semibold text-red-600">{orderCode}</span>
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Bạn chưa đăng nhập.{' '}
          <Link href="/dang-nhap" className="font-semibold underline">
            Đăng nhập / Đăng ký
          </Link>{' '}
          để đặt hàng.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-3 lg:col-span-2">
          <input
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            placeholder="Họ tên người nhận"
            required
            minLength={2}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <input
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            placeholder="Số điện thoại"
            required
            minLength={8}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <input
            type="email"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            placeholder="Email (không bắt buộc)"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Địa chỉ nhận hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/TP)"
            required
            minLength={5}
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (không bắt buộc)"
            rows={2}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={placing || items.length === 0}
            className="w-full rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {placing ? 'Đang đặt hàng…' : 'Đặt hàng'}
          </button>
        </form>

        <aside className="h-fit rounded-lg bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="mb-3 font-semibold text-zinc-800">Đơn hàng</h2>
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
