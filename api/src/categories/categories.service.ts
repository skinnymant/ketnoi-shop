import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Trả về CÂY danh mục 3 cấp cho mega menu
  findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null, deletedAt: null, isActive: true },
      orderBy: { position: 'asc' },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: { position: 'asc' },
          include: {
            children: {
              where: { deletedAt: null, isActive: true },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  // Tìm 1 danh mục theo slug (cho trang danh mục)
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: { children: { where: { deletedAt: null } }, parent: true },
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    // slug không được trùng
    const existed = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existed) throw new BadRequestException('Slug đã tồn tại');

    // level tự tính: gốc = 1, con = cha + 1
    let level = 1;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new BadRequestException('parentId không tồn tại');
      level = parent.level + 1;
      if (level > 3) throw new BadRequestException('Tối đa 3 cấp danh mục');
    }
    return this.prisma.category.create({ data: { ...dto, level } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  // Xóa MỀM: chỉ đóng dấu thời điểm xóa (quy ước Phần 3.4)
  async softDelete(id: string) {
    await this.ensureExists(id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Không tìm thấy danh mục');
  }
}
