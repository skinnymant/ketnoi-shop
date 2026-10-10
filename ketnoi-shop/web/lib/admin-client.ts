// Token đăng nhập quản trị (tách riêng với token khách hàng).
export const ADMIN_TOKEN_KEY = 'ketnoi_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Nhãn tiếng Việt cho trạng thái đơn hàng
export const ORDER_STATUS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export function statusLabel(value: string): string {
  return ORDER_STATUS.find((s) => s.value === value)?.label ?? value;
}
