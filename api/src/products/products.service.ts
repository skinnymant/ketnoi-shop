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
import { withWarrantySpec } from './product-warranty';
import {
  VI_FROM,
  VI_TO,
  escapeLike,
  fuzzyTokenMatch,
  normalizeVi,
  searchTokens,
} from './search-normalize';

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
    // Prisma does not support ordering by COALESCE through orderBy. Keep the
    // same filter conditions for the bounded SQL price-sort page below.
    const priceSortConditions = [
      Prisma.sql`p.deleted_at IS NULL`,
      Prisma.sql`p.is_active = true`,
    ];

    // Lọc theo danh mục: lấy id danh mục + toàn bộ con cháu của nó
    if (q.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: q.category },
        include: { children: { include: { children: true } } },
      });
      if (!cat) throw new NotFoundException('Danh mục không tồn tại');
      const ids = [
        cat.id,
        ...cat.children.flatMap((c) => [
          c.id,
          ...c.children.map((cc) => cc.id),
        ]),
      ];
      where.categoryId = { in: ids };
      priceSortConditions.push(
        Prisma.sql`p.category_id IN (${Prisma.join(ids)})`,
      );
    }

    if (q.brand) {
      where.brand = { slug: q.brand };
      priceSortConditions.push(Prisma.sql`b.slug = ${q.brand}`);
    }

    // Khoảng giá: salePrice nếu có, ngược lại dùng giá gốc price.
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      const range = {
        ...(q.minPrice !== undefined && { gte: q.minPrice }),
        ...(q.maxPrice !== undefined && { lte: q.maxPrice }),
      };
      where.OR = [{ salePrice: range }, { salePrice: null, price: range }];
      if (q.minPrice !== undefined) {
        priceSortConditions.push(
          Prisma.sql`COALESCE(p.sale_price, p.price) >= ${q.minPrice}`,
        );
      }
      if (q.maxPrice !== undefined) {
        priceSortConditions.push(
          Prisma.sql`COALESCE(p.sale_price, p.price) <= ${q.maxPrice}`,
        );
      }
    }

    // Tìm kiếm: không dấu, nhiều từ, chịu lỗi gõ — xem searchIds()
    if (q.search?.trim()) {
      const ids = await this.searchIds(q.search);
      where.id = { in: ids };
      priceSortConditions.push(
        ids.length
          ? Prisma.sql`p.id IN (${Prisma.join(ids)})`
          : Prisma.sql`false`,
      );
    }

    // Chỉ sản phẩm đang giảm giá (salePrice < price)
    if (q.onSale === 'true') {
      where.AND = [{ salePrice: { lt: this.prisma.product.fields.price } }];
      priceSortConditions.push(Prisma.sql`p.sale_price < p.price`);
    }

    // Lọc theo thông số kỹ thuật: "Điện áp:18V"
    if (q.spec) {
      const [specName, specValue] = q.spec.split(':');
      if (specName && specValue) {
        where.specs = { some: { specName, specValue } };
        priceSortConditions.push(Prisma.sql`EXISTS (
          SELECT 1 FROM product_specs s WHERE s.product_id = p.id
            AND s.spec_name = ${specName} AND s.spec_value = ${specValue}
        )`);
      }
    }

    // 2) Sắp xếp
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'best_selling' ? { soldCount: 'desc' } : { createdAt: 'desc' }; // newest; price sort is handled in SQL below

    // 3) Chạy song song: đếm tổng + lấy trang hiện tại
    const page = q.page ?? 1;
    const limit = q.limit ?? 12;
    const select = {
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
    } satisfies Prisma.ProductSelect;
    const priceSort = q.sort === 'price_asc' || q.sort === 'price_desc';
    const [total, data] = priceSort
      ? await this.prisma.$transaction(async (tx) => {
          const direction =
            q.sort === 'price_desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
          const [total, ids] = await Promise.all([
            tx.product.count({ where }),
            tx.$queryRaw<{ id: string }[]>`SELECT p.id FROM products p
              LEFT JOIN brands b ON b.id = p.brand_id
              WHERE ${Prisma.join(priceSortConditions, ' AND ')}
              ORDER BY COALESCE(p.sale_price, p.price) ${direction}, p.id ASC
              LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
          ]);
          const products = ids.length
            ? await tx.product.findMany({
                where: { ...where, id: { in: ids.map(({ id }) => id) } },
                select,
              })
            : [];
          const byId = new Map(
            products.map((product) => [product.id, product]),
          );
          return [
            total,
            ids.flatMap(({ id }) => {
              const product = byId.get(id);
              return product ? [product] : [];
            }),
          ] as const;
        })
      : await this.prisma.$transaction([
          this.prisma.product.count({ where }),
          this.prisma.product.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select,
          }),
        ]);

    // Điểm sao thật (chỉ đánh giá đã duyệt) — frontend chỉ hiện sao khi có đánh giá
    const ratings = data.length
      ? await this.prisma.review.groupBy({
          by: ['productId'],
          where: {
            productId: { in: data.map((p) => p.id) },
            status: 'APPROVED',
          },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const ratingOf = new Map(ratings.map((r) => [r.productId, r]));

    return {
      data: data.map((p) => ({
        ...p,
        ratingAvg: ratingOf.get(p.id)?._avg.rating ?? 0,
        ratingCount: ratingOf.get(p.id)?._count._all ?? 0,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Tìm id sản phẩm khớp từ khóa. Mỗi từ phải xuất hiện trong tên, SKU hoặc
  // tên thương hiệu — so trên dạng không dấu, nên "may khoan" ra "Máy khoan".
  // Không có kết quả thì thử khớp gần đúng ("bosh" → Bosch, "makit" → Makita).
  private async searchIds(query: string): Promise<string[]> {
    const tokens = searchTokens(query);
    if (!tokens.length) return [];

    const norm = (col: string) =>
      Prisma.sql`translate(lower(${Prisma.raw(col)}), ${VI_FROM}, ${VI_TO})`;
    const conds = tokens.map((t) => {
      const like = `%${escapeLike(t)}%`;
      return Prisma.sql`(${norm('p.name')} LIKE ${like}
        OR ${norm('p.sku')} LIKE ${like}
        OR ${norm("coalesce(b.name, '')")} LIKE ${like})`;
    });
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.deleted_at IS NULL AND p.is_active = true
        AND ${Prisma.join(conds, ' AND ')}`;
    if (rows.length) return rows.map((r) => r.id);

    // Gần đúng: so từng từ khóa với từng từ trong tên/SKU/thương hiệu
    const all = await this.prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        brand: { select: { name: true } },
      },
    });
    return all
      .filter((p) => {
        const words = normalizeVi(`${p.name} ${p.sku} ${p.brand?.name ?? ''}`)
          .split(/[\s()/,]+/)
          .filter(Boolean);
        return tokens.every((t) => fuzzyTokenMatch(t, words));
      })
      .map((p) => p.id);
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
    const normalizedSpecs = withWarrantySpec(specs ?? [], dto.warrantyMonths);
    return this.prisma.product.create({
      data: {
        ...rest,
        warrantyMonths: dto.warrantyMonths ?? null,
        ...(images?.length && {
          images: {
            create: images.map((im, i) => ({
              url: im.url,
              alt: im.alt,
              position: im.position ?? i,
            })),
          },
        }),
        ...(normalizedSpecs.length && {
          specs: {
            create: normalizedSpecs.map((s, i) => ({
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
      if (specs || dto.warrantyMonths !== undefined) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id },
          select: { warrantyMonths: true, specs: true },
        });
        const normalizedSpecs = withWarrantySpec(
          specs ?? product.specs,
          dto.warrantyMonths !== undefined
            ? dto.warrantyMonths
            : product.warrantyMonths,
        );
        await tx.productSpec.deleteMany({ where: { productId: id } });
        if (normalizedSpecs.length) {
          await tx.productSpec.createMany({
            data: normalizedSpecs.map((s, i) => ({
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
