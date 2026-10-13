// Nội dung "ruột" của JWT sau khi giải mã.
export interface JwtPayload {
  sub: string; // id khách hàng
  name: string; // tên hiển thị
}
