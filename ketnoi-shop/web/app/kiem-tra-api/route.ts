// Trang chẩn đoán: từ chính server đang chạy web (Vercel), gọi thử backend
// và báo lại kết quả dạng JSON. Mở https://<domain>/kiem-tra-api để biết
// web có tới được API không, và nếu không thì lỗi ở mắt xích nào.
// Chỉ trả về thông tin công khai (địa chỉ API vốn đã lộ ra trình duyệt).

import { API_BASE } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Check = {
  url: string;
  ok: boolean;
  status?: number;
  ms: number;
  body?: string;
  error?: string;
};

async function probe(path: string): Promise<Check> {
  const url = `${API_BASE}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    return {
      url,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - start,
      body: text.slice(0, 300),
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; message?: string } };
    return {
      url,
      ok: false,
      ms: Date.now() - start,
      error: [err.name, err.message, err.cause?.code, err.cause?.message]
        .filter(Boolean)
        .join(' | '),
    };
  }
}

function diagnose(apiBaseSet: boolean, health: Check, products: Check): string {
  if (health.ok && products.ok) {
    return 'API hoạt động bình thường. Nếu trang vẫn lỗi, hãy Redeploy trên Vercel.';
  }
  if (!apiBaseSet || /localhost|127\.0\.0\.1/.test(API_BASE)) {
    return 'Chưa cấu hình NEXT_PUBLIC_API_URL trên Vercel (đang dùng localhost). Vào Vercel → Settings → Environment Variables, đặt NEXT_PUBLIC_API_URL=https://api.swevietnam.com cho Production rồi Redeploy.';
  }
  const s = health.status;
  const body = health.body ?? '';
  if (s === 530 || /1033|Argo Tunnel/i.test(body)) {
    return 'Cloudflare Tunnel mất kết nối (Error 1033): laptop tắt/sleep, Docker chưa chạy hoặc container cloudflared bị dừng. Chạy scripts/kiem-tra-laptop.sh trên laptop.';
  }
  if (s === 502 || s === 504) {
    return 'Tunnel chạy nhưng không tới được container api: container api đang dừng/khởi động lại, hoặc Public Hostname ‘api’ không trỏ tới http://api:4000.';
  }
  if (s === 403 || s === 503 || /challenge|cf-chl|Just a moment/i.test(body)) {
    return 'Cloudflare đang chặn request từ server Vercel (Bot Fight Mode / WAF). Vào Cloudflare → Security → Bots, tắt Bot Fight Mode hoặc tạo WAF rule bỏ qua cho api.swevietnam.com.';
  }
  if (s === 500 && /database|prisma/i.test(body)) {
    return 'API chạy nhưng không kết nối được PostgreSQL. Kiểm tra container postgres trên laptop.';
  }
  if (health.ok && !products.ok) {
    return 'API sống nhưng /products lỗi — xem log container api (có thể DB chưa migrate/seed).';
  }
  if (health.error) {
    return 'Không mở được kết nối tới API (DNS/mạng/timeout). Kiểm tra bản ghi DNS ‘api’ trong Cloudflare và tunnel.';
  }
  return 'API trả lỗi không xác định — xem trường ‘health’ bên dưới và log container api.';
}

export async function GET() {
  const apiBaseSet = Boolean(process.env.NEXT_PUBLIC_API_URL);
  const [health, products] = await Promise.all([
    probe('/health'),
    probe('/products?limit=1'),
  ]);

  return Response.json(
    {
      ketLuan: diagnose(apiBaseSet, health, products),
      apiBase: API_BASE,
      apiBaseFromEnv: apiBaseSet,
      region: process.env.VERCEL_REGION ?? null,
      checkedAt: new Date().toISOString(),
      health,
      products,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
