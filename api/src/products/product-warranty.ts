interface WarrantySpec {
  specName: string;
  specValue: string;
  position?: number;
}

export function isWarrantySpec(specName: string): boolean {
  return (
    specName.trim().normalize('NFC').toLocaleLowerCase('vi-VN') === 'bảo hành'
  );
}

// Only explicit durations are accepted; missing or ambiguous text stays unknown.
export function parseWarrantyMonths(value: string | undefined): number | null {
  if (!value) return null;
  const text = value.trim().normalize('NFC');
  if (/^không\s+bảo\s+hành[.!]?$/i.test(text)) return 0;
  const match = /^(\d+)\s*(tháng|năm)(?:\s+chính\s+hãng)?[.!]?$/i.exec(text);
  if (!match) return null;
  const months = Number(match[1]) * (match[2].toLowerCase() === 'năm' ? 12 : 1);
  return Number.isSafeInteger(months) ? months : null;
}

// The structured field is authoritative; free-form specs cannot override it.
export function withWarrantySpec(
  specs: WarrantySpec[],
  warrantyMonths: number | null | undefined,
): WarrantySpec[] {
  const result = specs.filter((spec) => !isWarrantySpec(spec.specName));
  if (warrantyMonths == null) return result;
  result.push({
    specName: 'Bảo hành',
    specValue:
      warrantyMonths === 0 ? 'Không bảo hành' : `${warrantyMonths} tháng`,
    position:
      result.reduce(
        (max, spec, index) => Math.max(max, spec.position ?? index),
        -1,
      ) + 1,
  });
  return result;
}
