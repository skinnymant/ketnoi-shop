import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách thương hiệu đang hoạt động (cho trang chủ, bộ lọc)
  findAll() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // Tìm 1 thương hiệu theo slug (cho trang thương hiệu)
  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu');
    return brand;
  }

  async create(dto: CreateBrandDto) {
    // slug không được trùng
    const existed = await this.prisma.brand.findUnique({
      where: { slug: dto.slug },
    });
    if (existed) throw new BadRequestException('Slug đã tồn tại');

    return this.prisma.brand.create({ data: dto });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.ensureExists(id);
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  // Xóa MỀM: chỉ đóng dấu thời điểm xóa (quy ước Phần 3.4)
  async softDelete(id: string) {
    await this.ensureExists(id);
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Không tìm thấy thương hiệu');
  }
}
