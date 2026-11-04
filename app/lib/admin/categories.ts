import { getPrisma } from "../db/client";
import type { PrismaClient } from "../generated/prisma/client";
import { queryCategories } from "./category-query";
import type { AdminCategory, AdminCategoryPage, CategorySort, CategoryTab } from "./types";
import { validateCategoryName } from "./validate";

/** Quản lý danh mục sản phẩm — mở rộng của UC-15 (FR-ADM-03). SRS/ERD chỉ có cột text SanPham.danhMuc, nên để Admin
 * tạo được danh mục trước khi có sản phẩm, code bổ sung bảng DanhMuc (ngoài ERD, có chủ đích — xem schema.prisma).
 * Danh mục hiệu lực = các dòng DanhMuc ∪ các giá trị SanPham.danhMuc đang dùng, nên sản phẩm cũ không cần backfill.
 * Đổi tên/gộp là UPDATE hàng loạt SanPham.danhMuc (+ cập nhật dòng DanhMuc nếu có); chỉ xoá được danh mục trống. */

export type CategorySummary = AdminCategory;

export type CategoryResult<T = object> = ({ ok: true } & T) | { ok: false; status: 404 | 409; error: string };

export interface AdminCategoryService {
  /** Tất cả danh mục: số sản phẩm + doanh thu đã ghi nhận (tổng ChiTietDonHang.donGia của các dòng thuộc sản phẩm
   * trong danh mục — cùng cách tính doanh thu với FR-ADM-04). */
  list(): Promise<CategorySummary[]>;
  /** Một trang danh mục sau khi tìm/lọc/sắp xếp. */
  query(opts: { q: string; tab: CategoryTab; sort: CategorySort; page: number }): Promise<AdminCategoryPage>;
  /** Tạo danh mục rỗng. 409 nếu tên đã có (không phân biệt hoa thường — cùng collation của SQL Server). */
  create(ten: string): Promise<CategoryResult<{ ten: string }>>;
  /** Đổi tên (hoặc gộp vào danh mục đã có cùng tên mới) — cập nhật mọi SanPham đang thuộc `tenCu`. */
  rename(tenCu: string, tenMoi: string): Promise<CategoryResult<{ soSanPhamDaDoi: number }>>;
  /** Xoá danh mục trống. 409 nếu còn sản phẩm (không tự xoá/di chuyển sản phẩm). */
  remove(ten: string): Promise<CategoryResult>;
}

export function createAdminCategoryService(getDb: () => PrismaClient): AdminCategoryService {
  async function list(): Promise<CategorySummary[]> {
    const db = getDb();
    const [grouped, registered, doanhThuRows, sanPhamDanhMuc] = await Promise.all([
      db.sanPham.groupBy({ by: ["danhMuc"], _count: { _all: true } }),
      db.danhMuc.findMany({ select: { ten: true } }),
      db.chiTietDonHang.groupBy({ by: ["sanPhamId"], _sum: { donGia: true } }),
      db.sanPham.findMany({ select: { id: true, danhMuc: true } }),
    ]);
    const danhMucCuaSp = new Map(sanPhamDanhMuc.map((s) => [s.id, s.danhMuc]));
    const doanhThu = new Map<string, number>();
    for (const row of doanhThuRows) {
      const dm = danhMucCuaSp.get(row.sanPhamId);
      if (!dm) continue;
      doanhThu.set(dm, (doanhThu.get(dm) ?? 0) + Number(row._sum.donGia ?? 0));
    }
    const soSp = new Map(grouped.map((g) => [g.danhMuc, g._count._all]));
    const names = new Set([...soSp.keys(), ...registered.map((r) => r.ten)]);
    return [...names]
      .map((ten) => ({ ten, soSanPham: soSp.get(ten) ?? 0, doanhThu: doanhThu.get(ten) ?? 0 }))
      .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  }

  return {
    list,

    async query(opts) {
      return queryCategories(await list(), opts);
    },

    async create(tenRaw) {
      const v = validateCategoryName(tenRaw);
      if (!v.ok) return { ok: false, status: 409, error: v.error };
      const lower = v.ten.toLowerCase();
      if ((await list()).some((c) => c.ten.toLowerCase() === lower)) {
        return { ok: false, status: 409, error: `Danh mục “${v.ten}” đã tồn tại.` };
      }
      await getDb().danhMuc.create({ data: { ten: v.ten } });
      return { ok: true, ten: v.ten };
    },

    async rename(tenCu, tenMoiRaw) {
      const v = validateCategoryName(tenMoiRaw);
      if (!v.ok) return { ok: false, status: 409, error: v.error };
      const ten = v.ten;
      if (ten === tenCu) return { ok: false, status: 409, error: "Tên mới trùng với tên hiện tại." };

      return getDb().$transaction(async (tx) => {
        const updated = await tx.sanPham.updateMany({ where: { danhMuc: tenCu }, data: { danhMuc: ten } });
        const dongCu = await tx.danhMuc.findUnique({ where: { ten: tenCu } });
        if (updated.count === 0 && !dongCu) {
          return { ok: false as const, status: 404 as const, error: "Không tìm thấy danh mục." };
        }
        if (dongCu) {
          const dongMoi = await tx.danhMuc.findUnique({ where: { ten } });
          // Tên mới đã có dòng riêng (khác dòng cũ) → gộp: bỏ dòng cũ. Ngược lại đổi tên dòng cũ tại chỗ.
          if (dongMoi && dongMoi.id !== dongCu.id) await tx.danhMuc.delete({ where: { id: dongCu.id } });
          else await tx.danhMuc.update({ where: { id: dongCu.id }, data: { ten } });
        }
        return { ok: true as const, soSanPhamDaDoi: updated.count };
      });
    },

    async remove(ten) {
      const db = getDb();
      const soSp = await db.sanPham.count({ where: { danhMuc: ten } });
      if (soSp > 0) {
        return {
          ok: false,
          status: 409,
          error: `Danh mục còn ${soSp} sản phẩm — chuyển sản phẩm sang danh mục khác (hoặc đổi tên để gộp) trước khi xoá.`,
        };
      }
      const deleted = await db.danhMuc.deleteMany({ where: { ten } });
      if (deleted.count === 0) return { ok: false, status: 404, error: "Không tìm thấy danh mục." };
      return { ok: true };
    },
  };
}

export const adminCategories: AdminCategoryService = createAdminCategoryService(getPrisma);
