import { dbEnabled, getPrisma } from "../db/client";
import { PRODUCTS, filterProducts, type Product, type ProductFilter } from "../products";
import type { PrismaClient } from "../generated/prisma/client";

/** FR-ADM-03 (BR-12): danh mục sản phẩm và giá niêm yết sống trong bảng SanPham để Admin sửa được và thay đổi có hiệu
 * lực ngay cho mọi đơn tạo sau đó. Mọi nơi cần đọc sản phẩm phía server dùng `catalog` này thay vì mảng PRODUCTS tĩnh
 * (lib/products.ts giờ chỉ còn là dữ liệu seed + hàm tính giá thuần). Có DATABASE_URL (và không chạy test) → đọc SQL
 * Server; ngược lại dùng PRODUCTS trong bộ nhớ như trước, để test đơn vị không cần SQL Server. */

export interface CatalogStore {
  list(filter?: ProductFilter): Promise<Product[]>;
  get(slug: string): Promise<Product | undefined>;
  /** Nhiều sản phẩm một lượt (giỏ hàng / checkout); slug không tồn tại thì vắng mặt trong Map. */
  getMany(slugs: string[]): Promise<Map<string, Product>>;
  /** Danh mục (danhMuc) hiện có, đã sắp xếp. */
  categories(): Promise<string[]>;
}

/** Sản phẩm Admin vừa tạo chưa có ảnh (UC-15 chưa có upload) → dùng ảnh mặc định. */
export const ANH_MAC_DINH = "/images/placeholder.jpg";

function createMemoryCatalog(): CatalogStore {
  return {
    async list(filter = {}) {
      return filterProducts(PRODUCTS, filter);
    },
    async get(slug) {
      return PRODUCTS.find((p) => p.slug === slug);
    },
    async getMany(slugs) {
      return new Map(PRODUCTS.filter((p) => slugs.includes(p.slug)).map((p) => [p.slug, p]));
    },
    async categories() {
      return Array.from(new Set(PRODUCTS.map((p) => p.danhMuc))).sort();
    },
  };
}

const include = { linhKien: { orderBy: { tenLinhKien: "asc" as const } } };

function createPrismaCatalog(getDb: () => PrismaClient): CatalogStore {
  /** Tồn kho thật = số hộp game đang Available (FR-BH-04). */
  async function demTon(db: PrismaClient, ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await db.hopGame.groupBy({
      by: ["sanPhamId"],
      where: { trangThai: "Available", sanPhamId: { in: ids } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.sanPhamId, r._count._all]));
  }

  type Row = Awaited<ReturnType<PrismaClient["sanPham"]["findMany"]>>[number] & {
    linhKien: { tenLinhKien: string; laDocBan: boolean; soLuong: number; giaLe: unknown }[];
  };
  const toProduct = (row: Row, ton: Map<string, number>): Product => ({
    slug: row.slug,
    ten: row.ten,
    anh: row.anhUrl ?? ANH_MAC_DINH,
    danhMuc: row.danhMuc,
    soNguoiMin: row.soNguoiMin,
    soNguoiMax: row.soNguoiMax,
    giaNiemYet: Number(row.giaNiemYet),
    linhKien: row.linhKien.map((l) => ({
      ten: l.tenLinhKien,
      docBan: l.laDocBan,
      soLuong: l.soLuong,
      ...(l.giaLe === null ? {} : { giaLe: Number(l.giaLe) }),
    })),
    tone: "wine",
    moTaNgan: row.moTa,
    soLuongTon: ton.get(row.id) ?? 0,
  });

  return {
    async list(filter = {}) {
      const db = getDb();
      const rows = (await db.sanPham.findMany({ include, orderBy: { ten: "asc" } })) as unknown as Row[];
      const ton = await demTon(db, rows.map((r) => r.id));
      return filterProducts(rows.map((r) => toProduct(r, ton)), filter);
    },
    async get(slug) {
      const db = getDb();
      const row = (await db.sanPham.findUnique({ where: { slug }, include })) as unknown as Row | null;
      if (!row) return undefined;
      return toProduct(row, await demTon(db, [row.id]));
    },
    async getMany(slugs) {
      const uniq = [...new Set(slugs)];
      if (uniq.length === 0) return new Map();
      const db = getDb();
      const rows = (await db.sanPham.findMany({ where: { slug: { in: uniq } }, include })) as unknown as Row[];
      const ton = await demTon(db, rows.map((r) => r.id));
      return new Map(rows.map((r) => [r.slug, toProduct(r, ton)]));
    },
    async categories() {
      const rows = await getDb().sanPham.findMany({ distinct: ["danhMuc"], select: { danhMuc: true } });
      return rows.map((r) => r.danhMuc).sort();
    },
  };
}

export const catalog: CatalogStore = dbEnabled() ? createPrismaCatalog(getPrisma) : createMemoryCatalog();
