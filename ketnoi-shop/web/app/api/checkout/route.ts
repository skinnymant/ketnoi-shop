import { handleCheckout } from '../../../lib/checkout';
import { SWE_BANK } from '../../../lib/merchant-bank';

export const runtime = 'nodejs';

export function GET() {
  return Response.json({ bankTransfer: SWE_BANK }, { headers: { 'Cache-Control': 'no-store' } });
}

export function POST(request: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:4000';
  return handleCheckout(request, apiBase);
}
