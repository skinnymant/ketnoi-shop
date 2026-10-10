import {
  VI_FROM,
  VI_TO,
  escapeLike,
  fuzzyTokenMatch,
  normalizeVi,
  searchTokens,
} from './search-normalize';

// Mô phỏng translate() của PostgreSQL để kiểm tra bảng VI_FROM/VI_TO
function pgTranslate(s: string): string {
  const from = Array.from(VI_FROM);
  const to = Array.from(VI_TO);
  return Array.from(s.toLowerCase(), (ch) => {
    const i = from.indexOf(ch);
    return i >= 0 ? to[i] : ch;
  }).join('');
}

describe('search-normalize', () => {
  it('bỏ dấu tiếng Việt, kể cả đ/Đ', () => {
    expect(normalizeVi('Máy Khoan Động Lực')).toBe('may khoan dong luc');
    expect(normalizeVi('THANG NHÔM RÚT  Đa năng')).toBe(
      'thang nhom rut da nang',
    );
  });

  it('bảng translate() cho SQL khớp với normalizeVi()', () => {
    expect(Array.from(VI_FROM)).toHaveLength(Array.from(VI_TO).length);
    for (const s of [
      'Máy hàn que điện tử Hồng Ký',
      'Xe đẩy hàng Phong Thạnh',
      'ƯỚC LƯỢNG Ỹ',
    ]) {
      expect(pgTranslate(s)).toBe(normalizeVi(s));
    }
  });

  it('tách từ khóa, giữ mã hàng có gạch và gạch chéo', () => {
    expect(searchTokens('  Máy   khoan pin ')).toEqual(['may', 'khoan', 'pin']);
    expect(searchTokens('Milwaukee 48-22-8420')).toEqual([
      'milwaukee',
      '48-22-8420',
    ]);
    expect(searchTokens('tuýp 1/2"')).toEqual(['tuyp', '1/2']);
  });

  it('thoát ký tự đặc biệt của LIKE', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('khớp gần đúng khi gõ sai hoặc thiếu chữ', () => {
    expect(fuzzyTokenMatch('bosh', ['may', 'khoan', 'bosch'])).toBe(true);
    expect(fuzzyTokenMatch('makit', ['makita'])).toBe(true);
    expect(fuzzyTokenMatch('milwaukie', ['milwaukee'])).toBe(true);
    expect(fuzzyTokenMatch('dewalt', ['makita', 'bosch'])).toBe(false);
    // từ ngắn phải khớp đầu từ, không đoán bừa
    expect(fuzzyTokenMatch('pim', ['pin'])).toBe(false);
  });
});
