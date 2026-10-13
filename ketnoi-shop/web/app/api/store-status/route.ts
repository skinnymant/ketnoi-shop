import { API_BASE } from '@/lib/api';
import { probeStoreStatus } from '@/lib/store-status';

export async function GET() {
  const status = await probeStoreStatus(API_BASE);
  return Response.json(status, {
    status: status.available ? 200 : 503,
    headers: { 'Cache-Control': 'no-store', ...(status.available ? {} : { 'Retry-After': '60' }) },
  });
}
