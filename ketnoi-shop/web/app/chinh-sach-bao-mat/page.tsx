import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật thông tin',
  description: 'Thông tin SWE sử dụng để xử lý đơn hàng, tài khoản và hỗ trợ khách hàng; lưu trữ trên trình duyệt, dịch vụ liên quan và cách yêu cầu chỉnh sửa thông tin.',
  alternates: { canonical: '/chinh-sach-bao-mat' },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Chính sách bảo mật thông tin" path="/chinh-sach-bao-mat" lead="Trang này giải thích dữ liệu được dùng khi bạn mua hàng, đăng nhập hoặc liên hệ SWE, cùng cách yêu cầu hỗ trợ về thông tin của mình.">
      <PolicySection id="privacy-information" title="Thông tin được sử dụng">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Đơn hàng:</strong> họ tên người nhận, số điện thoại, địa chỉ giao hàng, sản phẩm, số lượng, cách thanh toán, email và ghi chú nếu bạn cung cấp.</li>
          <li><strong>Tài khoản:</strong> họ tên, email hoặc số điện thoại, thông tin xác thực và lịch sử đơn gắn với tài khoản.</li>
          <li><strong>Hỗ trợ:</strong> nội dung trao đổi, mã đơn và hình ảnh hoặc chứng từ bạn gửi để SWE kiểm tra yêu cầu.</li>
          <li><strong>Thông tin kỹ thuật:</strong> địa chỉ IP, trình duyệt và thông tin yêu cầu có thể được các dịch vụ vận hành website xử lý để cung cấp trang, bảo vệ hệ thống và chẩn đoán lỗi.</li>
        </ul>
        <p>Bạn có thể đặt hàng không cần tạo tài khoản. Email và ghi chú tại thanh toán là tùy chọn; thông tin nhận hàng được dùng để xử lý và giao đơn.</p>
      </PolicySection>
      <PolicySection id="privacy-purpose" title="Mục đích và dịch vụ liên quan">
        <p>SWE dùng thông tin để tiếp nhận đơn, liên hệ xác nhận, giao hàng, đối chiếu thanh toán, quản lý tài khoản và xử lý yêu cầu đổi trả hoặc bảo hành. Thông tin cần cho việc giao hàng được dùng cùng đơn vị vận chuyển khi thực hiện đơn.</p>
        <p>Website dùng Vercel để vận hành giao diện và Cloudflare để kết nối, bảo vệ truy cập. Các dịch vụ này xử lý dữ liệu kỹ thuật cần thiết để website hoạt động. Khi bạn mở Zalo hoặc ứng dụng ngân hàng, việc xử lý thông tin tại ứng dụng đó tuân theo chính sách của nhà cung cấp tương ứng.</p>
        <p>Để tạo ảnh VietQR, website gửi thông tin tài khoản nhận tiền của SWE, số tiền và nội dung mã đơn tới dịch vụ VietQR. Yêu cầu tạo mã này không kèm họ tên, điện thoại, email hoặc địa chỉ người mua. SWE đối chiếu chuyển khoản thủ công; website không yêu cầu mật khẩu ngân hàng hay mã OTP.</p>
      </PolicySection>
      <PolicySection id="privacy-browser" title="Lưu trữ trong trình duyệt">
        <p>Website lưu giỏ hàng và trạng thái đăng nhập trên trình duyệt để duy trì phiên sử dụng. Thông tin kết quả đặt hàng và trạng thái gửi đơn được lưu trong phiên tab để bạn có thể xem lại khi tải lại trang.</p>
        <p>Bạn có thể xóa giỏ hàng, đăng xuất hoặc xóa dữ liệu website trong cài đặt trình duyệt. Việc xóa dữ liệu trình duyệt không tự xóa đơn đã được SWE tiếp nhận. Khi dùng máy chung, nên đăng xuất và xóa dữ liệu phiên sau khi sử dụng.</p>
      </PolicySection>
      <PolicySection id="privacy-measurement" title="Đo hiệu năng và thao tác mua hàng">
        <p>Website gửi các mẫu đo về cùng hệ thống SWE để cải thiện tốc độ và trải nghiệm mua hàng. Mẫu chỉ gồm nhóm trang chung (ví dụ trang chủ, sản phẩm, giỏ hàng), chỉ số hiệu năng hoặc tên thao tác với bộ đếm; không kèm đường dẫn sản phẩm, từ khóa tìm kiếm, mã đơn, mã khách hoặc thông tin người nhận hàng.</p>
        <p>Cơ chế đo này không tạo mã theo dõi khách hoặc phiên, không lưu cookie và gửi yêu cầu không kèm cookie, token hay địa chỉ trang đang mở. Website tôn trọng tùy chọn Do Not Track và Global Privacy Control trong trình duyệt; không đo tại trang quản trị, đăng nhập, đăng ký hoặc tài khoản. Bộ đếm tạo đơn không xác nhận việc SWE đã nhận tiền. Các dịch vụ vận hành vẫn có thể xử lý log kỹ thuật theo cơ chế đã mô tả ở trên.</p>
      </PolicySection>
      <PolicySection id="privacy-request" title="Yêu cầu xem, chỉnh sửa hoặc xóa thông tin">
        <p>Liên hệ SWE qua hotline hoặc email ở cuối trang với mã đơn hoặc thông tin tài khoản liên quan để yêu cầu xem, sửa hoặc xóa thông tin. SWE kiểm tra yêu cầu và quyền truy cập trước khi thông báo cách xử lý; không cần gửi mật khẩu hoặc mã OTP.</p>
        <p>Khả năng xóa một số dữ liệu phụ thuộc đơn đang xử lý, đối chiếu thanh toán và hồ sơ cần lưu. SWE sẽ trao đổi phạm vi có thể xử lý theo yêu cầu của bạn.</p>
      </PolicySection>
    </PolicyPage>
  );
}
