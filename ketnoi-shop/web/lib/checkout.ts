import { getBankTransferDetails, type BankTransferDetails } from './bank-transfer';
import { SWE_BANK } from './merchant-bank';

type PaymentMethod = 'COD' | 'BANK_TRANSFER';
type RecordValue = Record<string, unknown>;

export interface CheckoutInput {
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  shippingAddress: string;
  note?: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
}

export interface CheckoutReceipt {
  orderCode: string;
  total: string;
  paymentMethod: PaymentMethod;
  bankTransfer: BankTransferDetails | null;
  paymentReviewRequired: boolean;
}

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as RecordValue
    : null;
}

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

// Whitelist order inputs: prices, bank recipients and payment status never come
// from the browser. The existing order API still validates and calculates them.
export function parseCheckoutInput(raw: unknown): CheckoutInput | null {
  const value = record(raw);
  if (!value) return null;
  const receiverName = text(value.receiverName, 2, 160);
  const receiverPhone = text(value.receiverPhone, 8, 30);
  const shippingAddress = text(value.shippingAddress, 5, 1000);
  const method = value.paymentMethod ?? 'COD';
  if (!receiverName || !receiverPhone || !shippingAddress ||
      (method !== 'COD' && method !== 'BANK_TRANSFER') ||
      !Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100) return null;

  const items: CheckoutInput['items'] = [];
  const ids = new Set<string>();
  for (const rawItem of value.items) {
    const item = record(rawItem);
    const productId = text(item?.productId, 1, 100);
    const quantity = item?.quantity;
    if (!productId || ids.has(productId) || typeof quantity !== 'number' ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 999) return null;
    items.push({ productId, quantity });
    ids.add(productId);
  }

  const receiverEmail = value.receiverEmail == null || value.receiverEmail === ''
    ? undefined : text(value.receiverEmail, 3, 254);
  const note = value.note == null || value.note === ''
    ? undefined : text(value.note, 0, 2000);
  if (receiverEmail === null || (receiverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) || note === null) return null;
  return { receiverName, receiverPhone, shippingAddress, paymentMethod: method, items,
    ...(receiverEmail && { receiverEmail }), ...(note && { note }) };
}

function amount(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const encoded = String(value);
  if (!/^\d{1,14}$/.test(encoded)) return null;
  const numeric = Number(encoded);
  return Number.isSafeInteger(numeric) && numeric > 0 ? String(numeric) : null;
}

export function knownOrderCode(raw: unknown): string | null {
  const code = record(raw)?.orderCode;
  return typeof code === 'string' && /^[A-Za-z0-9][A-Za-z0-9-]{1,49}$/.test(code) ? code : null;
}

export function createCheckoutReceipt(raw: unknown, method: PaymentMethod): CheckoutReceipt | null {
  const order = record(raw);
  const orderCode = knownOrderCode(raw);
  const total = amount(order?.total);
  if (!order || !text(order.id, 1, 100) || !orderCode || !total) return null;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const payment = payments.length === 1 ? record(payments[0]) : null;
  const paymentMatches = payment?.orderId === order.id && payment?.method === method &&
    payment?.status === 'PENDING' && amount(payment?.amount) === total;
  const receipt: CheckoutReceipt = { orderCode, total, paymentMethod: method,
    bankTransfer: null, paymentReviewRequired: !paymentMatches };
  if (method === 'COD' || !paymentMatches) return receipt;

  // VietQR Quick Link supports positive VND amounts of at most 13 digits.
  if (total.length > 13) return { ...receipt, paymentReviewRequired: true };

  // Older API versions save a pending bank payment without returning recipient
  // details. Only that legacy response uses the owner-approved recipient here.
  // An explicit null/invalid/conflicting snapshot must never be overwritten.
  if (!Object.hasOwn(order, 'bankTransfer')) {
    return { ...receipt, bankTransfer: { ...SWE_BANK } };
  }
  const snapshot = record(order.bankTransfer);
  const bank = getBankTransferDetails({ bank_transfer_enabled: 'true',
    bank_code: snapshot?.bankCode, bank_account: snapshot?.accountNumber,
    bank_name: snapshot?.accountName });
  if (bank?.bankCode === SWE_BANK.bankCode && bank?.accountNumber === SWE_BANK.accountNumber &&
      bank?.accountName.replace(/\s+/g, ' ').toUpperCase() === SWE_BANK.accountName) {
    return { ...receipt, bankTransfer: { ...SWE_BANK } };
  }
  return { ...receipt, paymentReviewRequired: true };
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Exported separately for tests with an isolated upstream. Production always
// supplies the configured API URL; clients cannot choose a forwarding target.
export async function handleCheckout(request: Request, apiBase: string, fetcher: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin) {
    // Next can construct request.url using its internal listener hostname.
    // Host is the browser's request target (and cannot be changed by JS).
    const publicUrl = new URL(request.url);
    publicUrl.host = request.headers.get('host') || publicUrl.host;
    if (origin !== publicUrl.origin) {
      return json({ message: 'Yêu cầu thanh toán không hợp lệ.' }, 403);
    }
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ message: 'Dữ liệu thanh toán phải là JSON.' }, 415);
  }
  let input: CheckoutInput | null;
  try {
    const body = await request.text();
    if (body.length > 32768) return json({ message: 'Dữ liệu đơn hàng quá lớn.' }, 413);
    input = parseCheckoutInput(JSON.parse(body));
  } catch {
    return json({ message: 'Thông tin đơn hàng không hợp lệ.' }, 400);
  }
  if (!input) return json({ message: 'Vui lòng kiểm tra thông tin nhận hàng và giỏ hàng.' }, 400);

  const uncertain = (raw?: unknown) => {
    const code = knownOrderCode(raw);
    return json({ orderUncertain: true, ...(code && { orderCode: code }), message: code
      ? `Đã nhận phản hồi cho đơn ${code}, nhưng chưa xác nhận được thông tin thanh toán. Vui lòng liên hệ SWE trước khi chuyển tiền hoặc đặt lại.`
      : 'Chưa xác định được đơn hàng đã được ghi nhận hay chưa. Vui lòng liên hệ SWE trước khi đặt lại.' }, 502);
  };
  try {
    const authorization = request.headers.get('authorization');
    const upstream = await fetcher(`${apiBase.replace(/\/$/, '')}/orders`, {
      method: 'POST', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', ...(authorization && { Authorization: authorization }) },
      body: JSON.stringify(input), signal: AbortSignal.timeout(25000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // A timeout/server error may follow a successful database write. Never
      // retry POST or silently switch a bank order to COD.
      if (upstream.status >= 500 || upstream.status === 408) return uncertain(data);
      return json({ message: upstream.status === 401
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại hoặc đặt hàng không đăng nhập.'
        : 'Máy chủ chưa chấp nhận đơn hàng. Vui lòng kiểm tra giỏ hàng hoặc liên hệ SWE.' }, upstream.status);
    }
    const receipt = createCheckoutReceipt(data, input.paymentMethod);
    return receipt ? json(receipt, 201) : uncertain(data);
  } catch {
    return uncertain();
  }
}
