// Lưu token đăng nhập phía client (localStorage). Demo — production nên dùng
// httpOnly cookie để an toàn hơn.

export const TOKEN_KEY = 'ketnoi_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
