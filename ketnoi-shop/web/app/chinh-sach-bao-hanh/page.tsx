import Link from 'next/link';
import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Chính sách bảo hành',
  description: 'Bảo hành theo từng sản phẩm tại SWE Việt Nam. Kiểm tra thời hạn trên trang sản phẩm và liên hệ SWE để được hướng dẫn tiếp nhận bảo hành.',
  alternates: { canonical: '/chinh-sach-bao-hanh' },
};

export default function WarrantyPolicyPage() {
  return (
    <PolicyPage title="Chính sách bảo hành" path="/chinh-sach-bao-hanh" lead="Thời hạn bảo hành được áp dụng theo từng sản phẩm và thông tin của hãng. Bạn có thể xem thời hạn tại trang chi tiết sản phẩm hoặc liên hệ SWE trước khi mua.">
      <PolicySection id="warranty-period" title="Kiểm tra thời hạn của sản phẩm">
        <p>Thông tin bảo hành nằm trong phần thông số và cam kết trên trang sản phẩm. Thời hạn có thể khác nhau giữa các model; SWE không áp dụng một số tháng chung cho toàn bộ danh mục.</p>
        <p>Nếu trang ghi “Liên hệ để xác nhận thời hạn”, hãy cung cấp mã sản phẩm để SWE kiểm tra. Sản phẩm ghi “Không bảo hành” được thể hiện rõ tại trang chi tiết.</p>
        <p>Giữ mã đơn, hóa đơn hoặc phiếu bảo hành nếu có. SWE hỗ trợ đối chiếu thời hạn và hướng dẫn đầu mối tiếp nhận phù hợp với sản phẩm bạn đã mua.</p>
      </PolicySection>
      <PolicySection id="warranty-process" title="Yêu cầu hỗ trợ bảo hành">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Liên hệ SWE qua hotline, Zalo hoặc email với mã đơn, model và mô tả lỗi. Ảnh, video hoặc số sê-ri nếu có giúp kiểm tra đúng sản phẩm.</li>
          <li>SWE đối chiếu thông tin, hướng dẫn nơi tiếp nhận và cách gửi sản phẩm. Chi phí hoặc hạng mục cần xử lý được trao đổi trước khi bạn chấp thuận.</li>
          <li>Sản phẩm được kiểm tra để xác định cách xử lý theo thông tin bảo hành áp dụng. SWE thông báo kết quả và cập nhật tiến độ cho bạn.</li>
        </ol>
        <p>Thời gian xử lý phụ thuộc model, tình trạng sản phẩm, linh kiện và đơn vị tiếp nhận; SWE xác nhận khi tiếp nhận thay vì áp dụng một thời hạn chung.</p>
      </PolicySection>
      <PolicySection id="warranty-versus-return" title="Sản phẩm vừa nhận có vấn đề">
        <p>Nếu bạn nhận sai sản phẩm hoặc hàng hỏng, liên hệ SWE để áp dụng <Link href="/chinh-sach-doi-tra" className="text-teal-800 underline underline-offset-2">chính sách đổi trả trong 7 ngày</Link>. SWE chịu chi phí đổi trả cho các trường hợp này.</p>
      </PolicySection>
    </PolicyPage>
  );
}
