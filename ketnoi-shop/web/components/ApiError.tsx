import { API_BASE } from '@/lib/api';

// Hộp báo lỗi khi server không lấy được dữ liệu từ backend.
// Hiện đúng địa chỉ API đang gọi (lấy từ NEXT_PUBLIC_API_URL) để dễ dò lỗi;
// nguyên nhân cụ thể xem tại /kiem-tra-api.
export default function ApiError() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm leading-relaxed text-amber-800">
      <p className="font-semibold">
        Hệ thống đang tạm gián đoạn, vui lòng tải lại trang sau ít phút.
      </p>
      <p className="mt-2 text-xs text-amber-700">
        Không kết nối được tới API (
        <code className="rounded bg-amber-100 px-1">{API_BASE}</code>). Quản trị
        viên xem chi tiết tại{' '}
        <a href="/kiem-tra-api" className="underline">
          /kiem-tra-api
        </a>
        .
      </p>
    </div>
  );
}
