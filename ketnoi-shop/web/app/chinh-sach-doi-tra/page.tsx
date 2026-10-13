import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Chính sách đổi trả',
  description: 'Yêu cầu đổi trả trong 7 ngày nhận hàng tại SWE Việt Nam. SWE chịu phí khi giao sai hoặc hàng hỏng; hướng dẫn liên hệ và xử lý đổi trả.',
  alternates: { canonical: '/chinh-sach-doi-tra' },
};

export default function ReturnsPolicyPage() {
  return (
    <PolicyPage title="Chính sách đổi trả" path="/chinh-sach-doi-tra" lead="SWE tiếp nhận yêu cầu đổi trả trong 7 ngày kể từ khi bạn nhận hàng. Liên hệ trước khi gửi sản phẩm để được hướng dẫn đúng địa chỉ và cách giao nhận.">
      <PolicySection id="return-situations" title="Trường hợp và chi phí đổi trả">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Giao sai sản phẩm hoặc hàng hỏng:</strong> SWE chịu chi phí đổi trả. Hãy báo cho SWE để cùng kiểm tra và thống nhất phương án xử lý.</li>
          <li><strong>Đổi sản phẩm theo nhu cầu khác:</strong> cần SWE chấp thuận trước. SWE sẽ trao đổi về sản phẩm thay thế, chênh lệch giá và chi phí liên quan trước khi bạn quyết định gửi hàng.</li>
        </ul>
        <p>Cam kết đổi trả 7 ngày được tính từ lúc nhận hàng. Bạn nên giữ mã đơn; nếu còn bao bì, phụ kiện và giấy tờ đi kèm, hãy giữ lại để việc kiểm tra thuận tiện hơn.</p>
      </PolicySection>
      <PolicySection id="return-process" title="Cách yêu cầu đổi trả">
        <ol className="list-decimal space-y-2 pl-5">
          <li><strong>Liên hệ SWE:</strong> gửi mã đơn, tên hoặc mã sản phẩm và mô tả vấn đề qua hotline, Zalo hoặc email. Ảnh hoặc video về sản phẩm và kiện hàng giúp SWE đối chiếu nhanh hơn.</li>
          <li><strong>Xác nhận phương án:</strong> SWE kiểm tra thông tin và trao đổi với bạn về việc đổi hàng hoặc hoàn tiền, cách gửi nhận và chi phí áp dụng.</li>
          <li><strong>Giao nhận sản phẩm:</strong> gửi theo hướng dẫn đã thống nhất; giữ thông tin vận đơn hoặc biên nhận.</li>
          <li><strong>Hoàn tất xử lý:</strong> SWE kiểm tra sản phẩm nhận lại, thông báo kết quả và thực hiện phương án đã xác nhận với bạn.</li>
        </ol>
        <p>Thời gian xử lý phụ thuộc việc kiểm tra sản phẩm và giao nhận. SWE sẽ thông báo khi tiếp nhận yêu cầu; hãy liên hệ với mã đơn nếu cần cập nhật.</p>
      </PolicySection>
      <PolicySection id="return-safe-contact" title="Thông tin cần bảo vệ khi trao đổi">
        <p>Không gửi mật khẩu ngân hàng, mã OTP hoặc thông tin đăng nhập. Nếu cần đối chiếu giao dịch, chỉ cung cấp mã đơn và chứng từ cần thiết; che thông tin không liên quan.</p>
      </PolicySection>
    </PolicyPage>
  );
}
