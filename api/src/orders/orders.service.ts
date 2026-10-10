import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { getBankTransferDetails } from '../settings/bank-transfer';

const SHIPPING_FLAT = 30000; // phí ship mặc định khi chưa đạt ngưỡng freeship

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // customerId = null → đơn khách vãng lai (không cần đăng nhập)
  async create(customerId: string | null, dto: CreateOrderDto) {
    let bankTransfer: ReturnType<typeof getBankTransferDetails> = null;
    if (dto.paymentMethod === 'BANK_TRANSFER') {
      const settings = await this.prisma.setting.findMany({
        where: {
          key: {
            in: [
              'bank_transfer_enabled',
              'bank_code',
              'bank_account',
              'bank_name',
            ],
          },
        },
      });
      bankTransfer = getBankTransferDetails(
        Object.fromEntries(settings.map(({ key, value }) => [key, value])),
      );
      if (!bankTransfer) {
        throw new BadRequestException(
          'Chuyển khoản hiện chưa khả dụng. Vui lòng chọn thanh toán khi nhận hàng.',
        );
      }
    }
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null, isActive: true },
      select: { id: true, name: true, price: true, salePrice: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    // Đảm bảo mọi sản phẩm trong đơn đều hợp lệ
    for (const item of dto.items) {
      if (!map.has(item.productId)) {
        throw new BadRequestException(
          `Sản phẩm không hợp lệ hoặc đã ngừng bán: ${item.productId}`,
        );
      }
    }

    // Tính tiền — "đóng băng" tên + giá tại thời điểm đặt
    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const p = map.get(item.productId)!;
      const unit = Number(p.salePrice ?? p.price);
      subtotal += unit * item.quantity;
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: unit,
        quantity: item.quantity,
      };
    });

    // Phí ship: miễn nếu đạt ngưỡng freeship (đọc từ Settings)
    const freeshipSetting = await this.prisma.setting.findUnique({
      where: { key: 'nguong_freeship' },
    });
    const nguong = freeshipSetting
      ? Number(freeshipSetting.value)
      : Number.POSITIVE_INFINITY;
    const shippingFee = subtotal >= nguong ? 0 : SHIPPING_FLAT;
    const discount = 0;
    const total = subtotal + shippingFee - discount;

    const order = await this.prisma.order.create({
      data: {
        orderCode: this.genOrderCode(),
        customerId,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        receiverEmail: dto.receiverEmail,
        shippingAddress: dto.shippingAddress,
        note: dto.note,
        subtotal,
        discount,
        shippingFee,
        total,
        items: { create: orderItems },
        payments: {
          create: {
            method: dto.paymentMethod ?? 'COD',
            amount: total,
          },
        },
      },
      include: { items: true, payments: true },
    });
    return { ...order, bankTransfer };
  }

  findMyOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findOne(customerId: string, orderCode: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderCode, customerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  // KN20260705-1234
  private genOrderCode(): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `KN${ymd}-${rand}`;
  }
}
