'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import { API_BASE } from '@/lib/api';
import { formatVND } from '@/lib/format';
import {
  getAdminToken,
  clearAdminToken,
  ORDER_STATUS,
} from '@/lib/admin-client';

interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}
interface AdminOrder {
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  total: string;
  status: string;
  createdAt: string;
  items: AdminOrderItem[];
  payments?: { method: string; status: string }[];
  customer: { fullName: string; phone: string | null; email: string | null } | null;
}
interface Stats {
  totalOrders: number;
  pending: number;
  revenue: string;
}

export default function AdminOrdersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAdminToken());
    setReady(true);
  }, []);

  const load = useCallback(async (tk: string) => {
    setErr('');
    try {
      const headers = { Authorization: `Bearer ${tk}` };
      const [oRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/admin/orders`, { headers }),
        fetch(`${API_BASE}/admin/stats`, { headers }),
      ]);
      if (oRes.status === 401 || sRes.status === 401) {
        clearAdminToken();
        setToken(null);
        return;
      }
      setOrders(await oRes.json());
      setStats(await sRes.json());
    } catch {
      setErr('Không kết nối được máy chủ.');
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  async function changeStatus(code: string, status: string) {
    if (!token) return;
    const prev = orders;
    setOrders((os) =>
      os.map((o) => (o.orderCode === code ? { ...o, status } : o)),
    );
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${code}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setOrders(prev); // hoàn tác nếu lỗi
        setErr('Cập nhật trạng thái thất bại.');
      } else if (stats) {
        // làm mới thống kê
        load(token);
      }
    } catch {
      setOrders(prev);
      setErr('Không kết nối được máy chủ.');
    }
  }

  async function markPaid(code: string) {
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/orders/${code}/payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'PAID' }),
    });
    if (res.ok) load(token);
    else setErr('Cập nhật thanh toán thất bại.');
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-500">
        Đang tải…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-zinc-600">Bạn cần đăng nhập quản trị.</p>
        <Link
          href="/admin/dang-nhap"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Đăng nhập quản trị
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <AdminNav />
      <h1 className="mb-5 text-xl font-bold text-zinc-800">Quản lý đơn hàng</h1>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white p-4 ring-1 ring-zinc-200">
            <div className="text-xs text-zinc-400">Tổng đơn</div>
            <div className="text-2xl font-bold text-zinc-800">
              {stats.totalOrders}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 ring-1 ring-zinc-200">
            <div className="text-xs text-zinc-400">Chờ xác nhận</div>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 ring-1 ring-zinc-200">
            <div className="text-xs text-zinc-400">Doanh thu (đã xác nhận+)</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatVND(stats.revenue)}
            </div>
          </div>
        </div>
      )}

      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-500">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-zinc-200">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-400">
              <tr>
                <th className="px-3 py-2">Mã đơn</th>
                <th className="px-3 py-2">Người nhận</th>
                <th className="px-3 py-2">Tổng</th>
                <th className="px-3 py-2">Ngày</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.orderCode}>
                  <tr
                    className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                    onClick={() =>
                      setOpenCode(openCode === o.orderCode ? null : o.orderCode)
                    }
                  >
                    <td className="px-3 py-2 font-medium text-zinc-800">
                      {o.orderCode}
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {o.receiverName}
                      <div className="text-xs text-zinc-400">
                        {o.receiverPhone}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-red-600">
                      {formatVND(o.total)}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {new Date(o.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.orderCode, e.target.value)}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs outline-none focus:border-red-500"
                      >
                        {ORDER_STATUS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const pay = o.payments?.[0];
                        const method =
                          pay?.method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'COD';
                        const paid = pay?.status === 'PAID';
                        return (
                          <div className="flex flex-col items-start gap-1">
                            <span className={paid ? 'text-emerald-600' : 'text-zinc-500'}>
                              {method} · {paid ? 'Đã TT' : 'Chưa TT'}
                            </span>
                            {!paid && (
                              <button
                                onClick={() => markPaid(o.orderCode)}
                                className="rounded bg-emerald-600 px-2 py-0.5 text-white hover:bg-emerald-700"
                              >
                                Đánh dấu đã TT
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                  {openCode === o.orderCode && (
                    <tr className="bg-zinc-50/50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="mb-2 text-xs text-zinc-500">
                          Giao đến: {o.shippingAddress}
                        </div>
                        <ul className="space-y-1 text-sm">
                          {o.items.map((it) => (
                            <li
                              key={it.id}
                              className="flex justify-between gap-2 text-zinc-600"
                            >
                              <span>
                                {it.productName} ×{it.quantity}
                              </span>
                              <span>
                                {formatVND(Number(it.unitPrice) * it.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
