// Kênh liên hệ lấy từ cấu hình hệ thống (Admin → Cài đặt).
import type { Settings } from './types';

export function hotlineOf(s: Settings): string | undefined {
  return s.hotline_hcm || s.hotline_hn || undefined;
}

// "0865 457 498" → "tel:0865457498" (bấm là gọi trên điện thoại)
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// Zalo: dùng khóa cài đặt "zalo" nếu có, không thì dùng số hotline
export function zaloHref(s: Settings): string | undefined {
  const z = s.zalo || hotlineOf(s);
  return z ? `https://zalo.me/${z.replace(/\D/g, '')}` : undefined;
}
