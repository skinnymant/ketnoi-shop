import { getStoreContact } from '@/lib/store-info';
import RetryCatalog from './RetryCatalog';

export default function ApiError() {
  const contact = getStoreContact();
  return (
    <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
      <p className="font-semibold">
        Chưa tải được danh mục sản phẩm.
      </p>
      <p className="mt-2">Vui lòng thử lại sau ít phút hoặc liên hệ SWE để được tư vấn, xác nhận giá và tồn kho.</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <RetryCatalog />
        <a href={contact.tel} className="font-semibold underline">Gọi {contact.hotline}</a>
        <a href={contact.zalo} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Tư vấn qua Zalo</a>
      </div>
    </div>
  );
}
