import Link from 'next/link';
import { getSettingsSafe } from '@/lib/api';
import { formatVND } from '@/lib/format';
import { getFreeShippingThreshold, getStoreContact, STORE_INFO } from '@/lib/store-info';

// Footer đậm 4 cột — nền zinc-800 chữ zinc-300, dòng copyright nền zinc-900.
export default async function Footer() {
  const s = await getSettingsSafe();
  const contact = getStoreContact(s);
  const freeThreshold = getFreeShippingThreshold(s);

  return (
    <footer className="mt-12 bg-zinc-800 text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cột 1: thông tin công ty */}
        <div>
          <div className="text-lg font-extrabold text-white">
            SWE VIỆT NAM
          </div>
          <p className="mt-2 text-sm">
            {STORE_INFO.companyName}
          </p>
          <p className="mt-1 text-sm italic">
            &ldquo;Đi đầu về chất lượng, giá cả và dịch vụ&rdquo;
          </p>
          <p className="mt-2 text-sm">
            Trụ sở: {STORE_INFO.address}
          </p>
          <p className="mt-1 text-sm">MSDN: {STORE_INFO.businessRegistration}</p>
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
            <li>
              <Link href="/chinh-sach-doi-tra" className="hover:text-white hover:underline">
                Đổi trả trong 7 ngày
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-bao-hanh" className="hover:text-white hover:underline">
                Bảo hành theo từng sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-giao-hang" className="hover:text-white hover:underline">
                Giao hàng toàn quốc
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-bao-mat" className="hover:text-white hover:underline">
                Bảo mật thông tin
              </Link>
            </li>
            <li className="text-zinc-400">Miễn phí vận chuyển từ {formatVND(freeThreshold)}</li>
          </ul>
        </div>

        {/* Cột 4: tổng đài hỗ trợ */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-white">
            Tổng đài hỗ trợ
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              Hotline:{' '}
              <a href={contact.tel} className="text-lg font-bold text-white hover:underline">
                {contact.hotline}
              </a>
            </li>
            <li className="break-words">
              Email:{' '}
              <a href={`mailto:${contact.email}`} className="hover:text-white hover:underline">
                {contact.email}
              </a>
            </li>
            <li>Giờ làm việc: {contact.workingHours}</li>
          </ul>
        </div>
      </div>

      <div className="bg-zinc-900 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} {STORE_INFO.companyName}
      </div>
    </footer>
  );
}
