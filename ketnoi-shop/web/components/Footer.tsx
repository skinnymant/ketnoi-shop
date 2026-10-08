import Link from 'next/link';
import { getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref } from '@/lib/contact';

// Footer đậm 4 cột — nền zinc-800 chữ zinc-300, dòng copyright nền zinc-900.
export default async function Footer() {
  const s = await getSettingsSafe();
  const hotline = hotlineOf(s);

  return (
    <footer className="mt-12 bg-zinc-800 text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cột 1: thông tin công ty */}
        <div>
          <div className="text-lg font-extrabold text-white">
            SWE VIỆT NAM
          </div>
          <p className="mt-2 text-sm">
            Công ty TNHH Thương mại và Dịch vụ SWE Việt Nam
          </p>
          <p className="mt-1 text-sm italic">
            &ldquo;Đi đầu về chất lượng, giá cả và dịch vụ&rdquo;
          </p>
          <p className="mt-2 text-sm">
            Trụ sở: Tổ 38, Khu 5, Phường Vân Phú, Tỉnh Phú Thọ, Việt Nam
          </p>
          <p className="mt-1 text-sm">MSDN: 2601 114 735</p>
        </div>

        {/* Cột 2: chăm sóc khách hàng */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-white">
            Chăm sóc khách hàng
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/gioi-thieu"
                className="hover:text-white hover:underline"
              >
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link
                href="/dang-nhap"
                className="hover:text-white hover:underline"
              >
                Kiểm tra đơn hàng
              </Link>
            </li>
            <li>
              <Link
                href="/gio-hang"
                className="hover:text-white hover:underline"
              >
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link
                href="/huong-dan-thanh-toan"
                className="hover:text-white hover:underline"
              >
                Hướng dẫn thanh toán
              </Link>
            </li>
            <li>
              <Link
                href="/khuyen-mai"
                className="hover:text-white hover:underline"
              >
                Khuyến mãi
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: chính sách */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-white">
            Chính sách
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Giao hàng toàn quốc</li>
            <li>Đổi trả trong 7 ngày</li>
            <li>Bảo hành chính hãng</li>
            {s.nguong_freeship && (
              <li>
                Freeship từ{' '}
                {Number(s.nguong_freeship).toLocaleString('vi-VN')} ₫
              </li>
            )}
          </ul>
        </div>

        {/* Cột 4: tổng đài hỗ trợ */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-white">
            Tổng đài hỗ trợ
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {hotline && (
              <li>
                Hotline:{' '}
                <a
                  href={telHref(hotline)}
                  className="text-lg font-bold text-white hover:underline"
                >
                  {hotline}
                </a>
              </li>
            )}
            <li>Email: swephuthovietnam@gmail.com</li>
            {s.gio_lam_viec && <li>Giờ làm việc: {s.gio_lam_viec}</li>}
          </ul>
        </div>
      </div>

      <div className="bg-zinc-900 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Công ty TNHH Thương mại và Dịch vụ SWE
        Việt Nam
      </div>
    </footer>
  );
}
