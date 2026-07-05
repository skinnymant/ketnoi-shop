import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ ĐỌC: danh sách có lọc / phân trang / sắp xếp / tìm kiếm ==========
  async findAll(q: QueryProductDto) {
    // 1) Dựng điều kiện lọc (where) từng lớp một
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    // Lọc theo danh mục: lấy id danh mục + toàn bộ con cháu của nó
    if (q.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: q.category },
        include: { children: { include: { children: true } } },
      });
      if (!cat) throw new NotFoundException('Danh mục không tồn tại');
      const ids = [
        cat.id,
        ...cat.children.flatMap((c) => [c.id, ...c.children.map((cc) => cc.id)]),
      ];
      where.categoryId = { in: ids };
    }

    if (q.brand) {
      where.brand = { slug: q.brand };
    }

    // Khoảng giá: so trên salePrice (giá bán thật)
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.salePrice = {
        ...(q.minPrice !== undefined && { gte: q.minPrice }),
        ...(q.maxPrice !== undefined && { lte: q.maxPrice }),
      };
    }

    // Tìm kiếm: tên hoặc SKU chứa từ khóa, không phân biệt hoa thường
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { sku: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    // Lọc theo thông số kỹ thuật: "Điện áp:18V"
    if (q.spec) {
      const [specName, specValue] = q.spec.split(':');
      if (specName && specValue) {
        where.specs = { some: { specName, specValue } };
      }
    }

    // 2) Sắp xếp
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { salePrice: 'asc' }
        : q.sort === 'price_desc'
          ? { salePrice: 'desc' }
          : q.sort === 'best_selling'
            ? { soldCount: 'desc' }
            : { createdAt: 'desc' }; // newest

    // 3) Chạy song song: đếm tổng + lấy trang hiện tại
    const page = q.page ?? 1;
    const limit = q.limit ?? 12;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          // Chỉ trả các trường thẻ sản phẩm cần — nhẹ và nhanh
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          salePrice: true,
          soldCount: true,
          freeShip: true,
          brand: { select: { name: true, slug: true } },
          images: {
            orderBy: { position: 'asc' },
            take: 1,
            select: { url: true, alt: true },
          },
          _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Chi tiết sản phẩm cho trang /san-pham/<slug>
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        brand: true,
        category: { include: { parent: true } }, // cho breadcrumb
        images: { orderBy: { position: 'asc' } },
        specs: { orderBy: { position: 'asc' } },
        inventory: { include: { warehouse: { select: { name: true } } } },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { customer: { select: { fullName: true } } },
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    // Tính điểm sao trung bình
    const agg = await this.prisma.review.aggregate({
      where: { productId: product.id, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });

    return {
      ...product,
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count,
    };
  }

  // ==================== GHI: CRUD cho admin ============================
  async create(dto: CreateProductDto) {
    // slug + sku không được trùng
    const dupSlug = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (dupSlug) throw new BadRequestException('Slug đã tồn tại');
    const dupSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (dupSku) throw new BadRequestException('SKU đã tồn tại');

    // categoryId phải tồn tại
    const cat = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!cat) throw new BadRequestException('categoryId không tồn tại');

    const { images, specs, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        ...(images?.length && {
          images: {
            create: images.map((im, i) => ({
              url: im.url,
              alt: im.alt,
              position: im.position ?? i,
            })),
          },
        }),
        ...(specs?.length && {
          specs: {
            create: specs.map((s, i) => ({
              specName: s.specName,
              specValue: s.specValue,
              position: s.position ?? i,
            })),
          },
        }),
      },
      include: { images: true, specs: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    // Nếu đổi slug/sku, đảm bảo không đụng sản phẩm khác
    if (dto.slug) {
      const other = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (other && other.id !== id)
        throw new BadRequestException('Slug đã tồn tại');
    }
    if (dto.sku) {
      const other = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (other && other.id !== id)
        throw new BadRequestException('SKU đã tồn tại');
    }

    const { images, specs, ...rest } = dto;

    // Ảnh/thông số: nếu client gửi lên thì thay thế toàn bộ (xóa cũ, tạo mới)
    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((im, i) => ({
              productId: id,
              url: im.url,
              alt: im.alt,
              position: im.position ?? i,
            })),
          });
        }
      }
      if (specs) {
        await tx.productSpec.deleteMany({ where: { productId: id } });
        if (specs.length) {
          await tx.productSpec.createMany({
            data: specs.map((s, i) => ({
              productId: id,
              specName: s.specName,
              specValue: s.specValue,
              position: s.position ?? i,
            })),
          });
        }
      }
      return tx.product.update({
        where: { id },
        data: rest,
        include: { images: true, specs: true },
      });
    });
  }

  // Xóa MỀM: chỉ đóng dấu thời điểm xóa (quy ước Phần 3.4)
  async softDelete(id: string) {
    await this.ensureExists(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Không tìm thấy sản phẩm');
  }
}
