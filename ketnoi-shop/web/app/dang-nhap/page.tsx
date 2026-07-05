'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { setToken } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const url =
        mode === 'login'
          ? `${API_BASE}/auth/login`
          : `${API_BASE}/auth/register`;
      const body =
        mode === 'login'
          ? { emailOrPhone: identifier, password }
          : {
              fullName,
              password,
              ...(isEmail ? { email: identifier } : { phone: identifier }),
            };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : (data.message ?? 'Có lỗi xảy ra'),
        );
        return;
      }
      setToken(data.accessToken);
      router.push('/thanh-toan');
    } catch {
      setErr('Không kết nối được máy chủ. API đã chạy chưa?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl bg-white p-6 ring-1 ring-zinc-200">
        <div className="mb-5 flex gap-2 rounded-md bg-zinc-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded py-1.5 ${
              mode === 'login' ? 'bg-white text-red-600 shadow' : 'text-zinc-500'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded py-1.5 ${
              mode === 'register'
                ? 'bg-white text-red-600 shadow'
                : 'text-zinc-500'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          )}
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email hoặc số điện thoại"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            required
            minLength={6}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading
              ? 'Đang xử lý…'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
