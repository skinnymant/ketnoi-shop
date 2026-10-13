'use client';

import { usePathname } from 'next/navigation';

// Trang có form (thanh toán, đăng nhập): ẩn nút nổi trên mobile để không đè
// lên ô nhập — header vẫn còn icon gọi điện.
const FORM_PAGES = ['/thanh-toan', '/dang-nhap'];

export default function ContactFabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onForm = FORM_PAGES.some((p) => pathname.startsWith(p));
  return (
    <aside
      aria-label="Liên hệ nhanh"
      className={`fixed bottom-24 right-3 z-40 flex-col gap-2 lg:bottom-6 lg:right-6 lg:flex ${
        onForm ? 'hidden' : 'flex'
      }`}
    >
      {children}
    </aside>
  );
}
