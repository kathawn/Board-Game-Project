import { getPrisma } from "../db/client";
import type { PrismaClient } from "../generated/prisma/client";
import { xoaAnhCu } from "./image";
import type { AdminProduct, AdminProductInput, AdminProductPage } from "./types";

/** UC-15 (FR-ADM-03, BR-12): Admin thêm / sửa / xoá sản phẩm và cập nhật giá niêm yết, ghi thẳng bảng SanPham.
 * Giá mới có hiệu lực ngay cho đơn tạo sau đó; đơn đã tạo giữ giá chốt trong ChiTietDonHang.giaNiemYetChot. */

export const PAGE_SIZE = 10;

export type AdminResult<T = object> = ({ ok: true } & T) | { ok: false; status: 404 | 409; error: string };

export interface AdminProductService {
  list(opts: { q: string; danhMuc: string; page: number }): Promise<AdminProductPage>;
  get(slug: string): Promise<AdminProduct | undefined>;
  create(input: AdminProductInput): Promise<AdminResult>;
  update(slug: string, input: AdminProductInput): Promise<AdminResult>;
  remove(slug: string): Promise<AdminResult>;
  /** Ghi đường dẫn ảnh mới; trả về ảnh cũ để route xoá file. */
  setImage(slug: string, url: string): Promise<AdminResult<{ anhCu: string | null }>>;
}

export function createAdminProductService(getDb: () => PrismaClient): AdminProductService {
  return {
    async list({ q, danhMuc, page }) {
      const db = getDb();
      const keyword = q.trim();
      const theoTuKhoa = keyword
        ? { OR: [{ ten: { contains: keyword } }, { slug: { contains: keyword.toLowerCase() } }] }
        : {};
      const where = { ...theoTuKhoa, ...(danhMuc ? { danhMuc } : {}) };

      const total = await db.sanPham.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const current = Math.min(totalPages, Math.max(1, page));

      const [rows, grouped, tatCaDanhMuc] = await Promise.all([
        db.sanPham.findMany({
          where,
          select: { slug: true, ten: true, danhMuc: true, giaNiemYet: true },
          orderBy: { ten: "asc" },
          skip: (current - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.sanPham.groupBy({ by: ["danhMuc"], where: theoTuKhoa, _count: { _all: true } }),
        db.sanPham.findMany({ distinct: ["danhMuc"], select: { danhMuc: true }, orderBy: { danhMuc: "asc" } }),
      ]);

      const categoryCounts = Object.fromEntries(grouped.map((g) => [g.danhMuc, g._count._all]));
      return {
        items: rows.map((r) => ({ slug: r.slug, ten: r.ten, danhMuc: r.danhMuc, giaNiemYet: Number(r.giaNiemYet) })),
        total,
        page: current,
        totalPages,
        categoryCounts,
        totalAll: grouped.reduce((sum, g) => sum + g._count._all, 0),
        categories: tatCaDanhMuc.map((c) => c.danhMuc),
      };
    },

    async get(slug) {
      const db = getDb();
      const row = await db.sanPham.findUnique({
        where: { slug },
        include: { _count: { select: { chiTietDon: true, linhKien: true, hopGame: true } } },
      });
      if (!row) return undefined;
      const soHopSan = await db.hopGame.count({ where: { sanPhamId: row.id, trangThai: "Available" } });
      return {
        slug: row.slug,
        ten: row.ten,
        danhMuc: row.danhMuc,
        giaNiemYet: Number(row.giaNiemYet),
        moTaNgan: row.moTa,
        soNguoiMin: row.soNguoiMin,
        soNguoiMax: row.soNguoiMax,
        soHopSan,
        soHopTong: row._count.hopGame,
        soDonLienQuan: row._count.chiTietDon,
        soLinhKien: row._count.linhKien,
        anh: row.anhUrl,
      };
    },

    async create(input) {
      const db = getDb();
      if (await db.sanPham.findUnique({ where: { slug: input.slug }, select: { id: true } })) {
        return { ok: false, status: 409, error: "Slug đã tồn tại, hãy chọn slug khác." };
      }
      try {
        await db.sanPham.create({
          data: {
            slug: input.slug,
            ten: input.ten,
            danhMuc: input.danhMuc,
            giaNiemYet: input.giaNiemYet,
            moTa: input.moTaNgan,
            soNguoiMin: input.soNguoiMin,
            soNguoiMax: input.soNguoiMax,
          },
        });
      } catch (e) {
        // Hai Admin tạo cùng slug đúng lúc: ràng buộc unique của DB là chốt chặn cuối.
        if ((e as { code?: string }).code === "P2002") {
          return { ok: false, status: 409, error: "Slug đã tồn tại, hãy chọn slug khác." };
        }
        throw e;
      }
      return { ok: true };
    },

    async update(slug, input) {
      // Slug là định danh công khai (URL, giỏ hàng) nên không cho đổi sau khi tạo.
      const updated = await getDb().sanPham.updateMany({
        where: { slug },
        data: {
          ten: input.ten,
          danhMuc: input.danhMuc,
          giaNiemYet: input.giaNiemYet,
          moTa: input.moTaNgan,
          soNguoiMin: input.soNguoiMin,
          soNguoiMax: input.soNguoiMax,
        },
      });
      return updated.count === 0 ? { ok: false, status: 404, error: "Không tìm thấy sản phẩm." } : { ok: true };
    },

    async remove(slug) {
      let anhUrl: string | null = null;
      const xong = await getDb().$transaction(async (tx) => {
        const row = await tx.sanPham.findUnique({
          where: { slug },
          select: { id: true, anhUrl: true, _count: { select: { chiTietDon: true, danhGia: true } } },
        });
        if (!row) return { ok: false, status: 404, error: "Không tìm thấy sản phẩm." } as const;
        if (row._count.chiTietDon > 0 || row._count.danhGia > 0) {
          return {
            ok: false,
            status: 409,
            error: `Không thể xoá: sản phẩm đã có ${row._count.chiTietDon} dòng đơn hàng và ${row._count.danhGia} đánh giá. Hãy giữ lại để bảo toàn lịch sử đơn.`,
          } as const;
        }
        // Khoản thanh toán còn chờ (QR chưa hết hạn) lưu snapshot dòng hàng theo slug: xoá lúc này khách quét xong sẽ
        // phải hoàn ví thay vì nhận đơn, nên chặn để Admin thử lại sau khi QR hết hạn (tối đa 15 phút).
        const dangCho = await tx.thanhToan.count({
          where: { trangThai: "ChoThanhToan", hetHanLuc: { gt: new Date() }, snapshot: { contains: `"${slug}"` } },
        });
        if (dangCho > 0) {
          return {
            ok: false,
            status: 409,
            error: `Không thể xoá lúc này: có ${dangCho} khoản thanh toán QR đang chờ khách quét cho sản phẩm này. Thử lại sau khi QR hết hạn (tối đa 15 phút).`,
          } as const;
        }
        anhUrl = row.anhUrl;
        await tx.linhKien.deleteMany({ where: { sanPhamId: row.id } });
        await tx.hopGame.deleteMany({ where: { sanPhamId: row.id } });
        await tx.sanPham.delete({ where: { id: row.id } });
        return { ok: true, anh: anhUrl } as const;
      });
      if (xong.ok) await xoaAnhCu(xong.anh);
      return xong.ok ? { ok: true } : xong;
    },
    async setImage(slug, url) {
      const db = getDb();
      const row = await db.sanPham.findUnique({ where: { slug }, select: { anhUrl: true } });
      if (!row) return { ok: false, status: 404, error: "Không tìm thấy sản phẩm." };
      await db.sanPham.update({ where: { slug }, data: { anhUrl: url } });
      return { ok: true, anhCu: row.anhUrl };
    },
  };
}

export const adminProducts: AdminProductService = createAdminProductService(getPrisma);
