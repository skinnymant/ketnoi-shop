// warrantyMonths là nguồn thời hạn duy nhất: null = chưa xác nhận, 0 = không bảo hành.
export function isWarrantySpec(specName: string): boolean {
  return specName.trim().normalize('NFC').toLocaleLowerCase('vi-VN') === 'bảo hành';
}

export function formatWarranty(months: number | null | undefined): string {
  if (months == null || !Number.isInteger(months) || months < 0) {
    return 'Liên hệ để xác nhận thời hạn';
  }
  return months === 0 ? 'Không bảo hành' : `${months} tháng`;
}
