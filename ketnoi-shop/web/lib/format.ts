// Tiện ích định dạng cho thị trường Việt Nam.

// "2150000" | 2150000 → "2.150.000 ₫"
export function formatVND(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('vi-VN') + ' ₫';
}

// Phần trăm giảm giá (làm tròn), trả về null nếu không giảm
export function discountPercent(
  price: string | number,
  salePrice: string | number | null,
): number | null {
  const p = Number(price);
  const s = salePrice === null ? p : Number(salePrice);
  if (!p || Number.isNaN(p) || Number.isNaN(s) || s >= p) return null;
  return Math.round(((p - s) / p) * 100);
}

// Giá bán thực tế (ưu tiên salePrice)
export function effectivePrice(
  price: string | number,
  salePrice: string | number | null,
): number {
  const s = salePrice === null || salePrice === '' ? null : Number(salePrice);
  return s !== null && !Number.isNaN(s) ? s : Number(price);
}
