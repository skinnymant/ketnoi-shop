import type { Settings } from './types';

// Public business details already published by SWE. Keep a usable contact when
// the settings service is unavailable; these values contain no credentials.
export const STORE_INFO = Object.freeze({
  companyName: 'Công ty TNHH Thương mại và Dịch vụ SWE Việt Nam',
  businessRegistration: '2601114735',
  address: 'Tổ 38, Khu 5, Phường Vân Phú, Tỉnh Phú Thọ, Việt Nam',
  hotline: '0865 457 498',
  email: 'swephuthovietnam@gmail.com',
  workingHours: '8H - 21H (T2 - CN)',
});

export const STORE_SHIPPING = Object.freeze({
  flatFee: 30000,
  freeThreshold: 2000000,
});

export function getFreeShippingThreshold(settings?: Settings | null): number {
  const amount = Number(settings?.nguong_freeship);
  return Number.isSafeInteger(amount) && amount > 0
    ? amount
    : STORE_SHIPPING.freeThreshold;
}

export function getStoreContact(settings?: Settings | null) {
  const hotline = settings?.hotline_hcm?.trim() ||
    settings?.hotline_hn?.trim() || STORE_INFO.hotline;
  const zaloNumber = settings?.zalo?.replace(/\D/g, '') ||
    hotline.replace(/\D/g, '');
  return {
    hotline,
    email: STORE_INFO.email,
    workingHours: settings?.gio_lam_viec?.trim() || STORE_INFO.workingHours,
    tel: `tel:${hotline.replace(/[^\d+]/g, '')}`,
    zalo: `https://zalo.me/${zaloNumber}`,
  };
}
