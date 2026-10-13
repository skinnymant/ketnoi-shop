'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { setToken } from '@/lib/auth-client';

// Sau đăng nhập quay về trang khách đang ở (?next=/thanh-toan).
// Chỉ nhận đường dẫn nội bộ để tránh bị lợi dụng chuyển hướng sang web lạ.
function nextPath(): string {
  const n = new URLSearchParams(window.location.search).get('next') ?? '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/';
}

const inputCls =
  'w-full rounded-md border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:text-sm';

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
      router.push(nextPath());
    } catch {
      setErr('Không kết nối được máy chủ, vui lòng thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl bg-white p-6 ring-1 ring-zinc-200">
        <h1 className="mb-4 text-xl font-bold text-zinc-900">
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h1>
        <div className="mb-5 flex gap-2 rounded-md bg-zinc-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded py-2.5 ${
              mode === 'login' ? 'bg-white text-red-600 shadow' : 'text-zinc-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded py-2.5 ${
              mode === 'register'
                ? 'bg-white text-red-600 shadow'
                : 'text-zinc-600'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label htmlFor="li-name" className="mb-1 block text-sm font-medium text-zinc-700">
                Họ và tên
              </label>
              <input
                id="li-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className={inputCls}
              />
            </div>
          )}
          <div>
            <label htmlFor="li-id" className="mb-1 block text-sm font-medium text-zinc-700">
              Email hoặc số điện thoại
            </label>
            <input
              id="li-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="li-pw" className="mb-1 block text-sm font-medium text-zinc-700">
              Mật khẩu <span className="font-normal text-zinc-500">(tối thiểu 6 ký tự)</span>
            </label>
            <input
              id="li-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={inputCls}
            />
          </div>

          {err && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-md bg-red-600 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
