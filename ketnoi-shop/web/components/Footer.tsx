import { getSettingsSafe } from '@/lib/api';

export default async function Footer() {
  const s = await getSettingsSafe();

  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="text-lg font-extrabold text-red-600">Kết Nối Shop</div>
          <p className="mt-2 text-sm text-zinc-500">
            Máy móc, thiết bị công nghiệp chính hãng — bảo hành toàn quốc.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-800">Liên hệ</h4>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            {s.hotline_hcm && <li>Hotline HCM: {s.hotline_hcm}</li>}
            {s.hotline_hn && <li>Hotline HN: {s.hotline_hn}</li>}
            {s.gio_lam_viec && <li>Giờ làm việc: {s.gio_lam_viec}</li>}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-800">Chính sách</h4>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            <li>Giao hàng toàn quốc</li>
            <li>Đổi trả trong 7 ngày</li>
            {s.nguong_freeship && (
              <li>Freeship từ {Number(s.nguong_freeship).toLocaleString('vi-VN')} ₫</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Kết Nối Shop. Demo thương mại điện tử.
      </div>
    </footer>
  );
}
