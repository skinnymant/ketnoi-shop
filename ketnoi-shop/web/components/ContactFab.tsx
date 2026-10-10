import { getSettingsSafe } from '@/lib/api';
import { hotlineOf, telHref, zaloHref } from '@/lib/contact';
import ContactFabShell from './ContactFabShell';

// Nút liên hệ nổi góc phải: Zalo + Gọi điện. Trên mobile đặt cao hơn để không
// che thanh "Thêm vào giỏ" dính đáy ở trang sản phẩm.
export default async function ContactFab() {
  const s = await getSettingsSafe();
  const hotline = hotlineOf(s);
  const zalo = zaloHref(s);
  if (!hotline && !zalo) return null;

  return (
    <ContactFabShell>
      {zalo && (
        <a
          href={zalo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat Zalo với SWE Việt Nam"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0068FF] text-[11px] font-bold text-white shadow-lg ring-2 ring-white hover:brightness-110"
        >
          Zalo
        </a>
      )}
      {hotline && (
        <a
          href={telHref(hotline)}
          aria-label={`Gọi hotline ${hotline}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg ring-2 ring-white hover:bg-teal-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
          </svg>
        </a>
      )}
    </ContactFabShell>
  );
}
