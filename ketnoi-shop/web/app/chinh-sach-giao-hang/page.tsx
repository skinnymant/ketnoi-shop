import Link from 'next/link';
import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';
import { API_BASE, getSettingsSafe } from '@/lib/api';
import { formatVND } from '@/lib/format';
import { getFreeShippingThreshold, STORE_SHIPPING } from '@/lib/store-info';
import { probeStoreStatus } from '@/lib/store-status';

export const metadata: Metadata = {
  title: 'Chính sách giao hàng',
  description: 'SWE giao hàng toàn quốc. Xem phí vận chuyển, ngưỡng miễn phí và cách xác nhận thời gian giao dự kiến theo địa chỉ, tình trạng hàng.',
  alternates: { canonical: '/chinh-sach-giao-hang' },
};

export default async function ShippingPolicyPage() {
  const [settings, status] = await Promise.all([getSettingsSafe(), probeStoreStatus(API_BASE)]);
  const threshold = getFreeShippingThreshold(settings);
  return (
    <PolicyPage title="Chính sách giao hàng" path="/chinh-sach-giao-hang" settings={settings} lead="SWE giao hàng toàn quốc. Phí vận chuyển và tổng tiền được hiển thị ở bước thanh toán để bạn kiểm tra trước khi đặt hàng.">
      <PolicySection id="shipping-cost" title="Phí vận chuyển">
        <ul className="list-disc space-y-2 pl-5">
          <li>Đơn từ <strong>{formatVND(threshold)}</strong>: miễn phí vận chuyển.</li>
          <li>Đơn dưới {formatVND(threshold)}: phí vận chuyển <strong>{formatVND(STORE_SHIPPING.flatFee)}</strong>.</li>
        </ul>
        {status.available && status.capabilities.productFreeShipping && <p>Đơn chỉ gồm các sản phẩm có nhãn miễn phí vận chuyển được miễn phí giao hàng. Với đơn có cả sản phẩm được miễn phí và sản phẩm khác, phí vẫn là {formatVND(STORE_SHIPPING.flatFee)} nếu chưa đạt ngưỡng {formatVND(threshold)}.</p>}
        <p>Hãy kiểm tra phí vận chuyển và tổng tiền tại thanh toán trước khi bấm “Đặt hàng”.</p>
      </PolicySection>
      <PolicySection id="shipping-time" title="Thời gian giao dự kiến">
        <p>SWE xác nhận thời gian giao dự kiến theo địa chỉ nhận hàng, tình trạng hàng và đơn vị vận chuyển khi tiếp nhận đơn. Nếu bạn cần hàng cho một công việc có ngày cụ thể, hãy liên hệ trước để SWE kiểm tra khả năng đáp ứng.</p>
        <p>Khi cần cập nhật hoặc sửa thông tin giao nhận, cung cấp mã đơn và thông tin cần điều chỉnh qua hotline, Zalo hoặc email. SWE kiểm tra khả năng thay đổi theo tiến độ của đơn.</p>
      </PolicySection>
      <PolicySection id="shipping-receipt" title="Nhận hàng và thanh toán">
        <p>Kiểm tra thông tin người nhận, địa chỉ và số điện thoại trước khi đặt hàng. Khi nhận kiện hàng, đối chiếu model, số lượng và tình trạng sản phẩm; báo SWE nếu có dấu hiệu giao sai hoặc hư hỏng.</p>
        <p>Bạn có thể chọn thanh toán khi nhận hàng (COD) hoặc chuyển khoản VietQR. Với chuyển khoản, SWE xác nhận sau khi kiểm tra giao dịch; xem <Link href="/huong-dan-thanh-toan" className="text-teal-800 underline underline-offset-2">hướng dẫn thanh toán</Link>.</p>
        <p>Giao sai hoặc hàng hỏng được hỗ trợ theo <Link href="/chinh-sach-doi-tra" className="text-teal-800 underline underline-offset-2">chính sách đổi trả 7 ngày</Link>; SWE chịu chi phí đổi trả cho các trường hợp này.</p>
      </PolicySection>
    </PolicyPage>
  );
}
