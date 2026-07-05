import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Trả về dạng object { key: value } — tiện cho frontend (hotline, freeship...)
  async findAllAsMap(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    return rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  async findOne(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Không tìm thấy cấu hình "${key}"`);
    return setting;
  }

  // Tạo mới hoặc cập nhật (admin)
  upsert(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async remove(key: string) {
    await this.findOne(key); // ném 404 nếu không có
    return this.prisma.setting.delete({ where: { key } });
  }
}
