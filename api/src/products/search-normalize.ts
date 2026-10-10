// Chuẩn hoá chuỗi tiếng Việt cho tìm kiếm: "Máy Khoan Đá" → "may khoan da".
// Người dùng thường gõ không dấu trên điện thoại, nên cả từ khóa lẫn dữ liệu
// đều được đưa về cùng dạng không dấu, chữ thường trước khi so khớp.

export function normalizeVi(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh + dấu mũ/móc
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Bảng thay thế cho hàm translate() của PostgreSQL — làm cùng việc như
// normalizeVi() ngay trong SQL mà không cần extension `unaccent`.
const VI_LETTERS =
  'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
export const VI_FROM = VI_LETTERS + VI_LETTERS.toUpperCase();
export const VI_TO = Array.from(VI_FROM, (ch) => normalizeVi(ch)).join('');

/** Tách từ khóa thành các từ đã chuẩn hoá (tối đa 8 từ). */
export function searchTokens(query: string): string[] {
  return normalizeVi(query)
    .replace(/[^\p{L}\p{N}\s.\-/]/gu, ' ') // bỏ ký tự lạ, giữ "48-22", "1/2"
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/** Thoát ký tự đặc biệt của LIKE (\ % _). */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Khoảng cách Levenshtein, dừng sớm khi vượt `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Một từ khóa có khớp gần đúng với một từ trong dữ liệu không.
 * Cho phép sai 1 ký tự với từ 4–6 chữ ("bosh" ~ "bosch"), 2 ký tự với từ dài hơn.
 * Từ khóa ngắn hơn 4 chữ phải khớp chính xác phần đầu từ.
 */
export function fuzzyTokenMatch(token: string, words: string[]): boolean {
  if (token.length < 4) return words.some((w) => w.startsWith(token));
  const max = token.length <= 6 ? 1 : 2;
  return words.some(
    (w) =>
      w.startsWith(token) ||
      editDistance(token, w, max) <= max ||
      // từ khóa gõ thiếu đuôi: "makit" ~ "makita"
      (w.length > token.length &&
        editDistance(token, w.slice(0, token.length), max) <= max),
  );
}
