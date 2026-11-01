import { getPrisma } from "../db/client";
import type { PrismaClient } from "../generated/prisma/client";
import { DANH_MUC_TOI_DA } from "./validate";

/** Quản lý danh mục sản phẩm — mở rộng của UC-15 (FR-ADM-03): SRS/ERD không có bảng "DanhMuc" riêng, danh mục chỉ
 * là cột text tự do trên SanPham.danhMuc, nên "danh mục" ở đây là tổng hợp theo GROUP BY, không phải CRUD trên một
 * bảng con. Một danh mục chỉ tồn tại khi có >= 1 sản phẩm thuộc nó — không tạo được danh mục rỗng, và đổi
 * tên/gộp danh mục là UPDATE hàng loạt SanPham.danhMuc, không phải sửa một dòng "danh mục". */

export interface CategorySummary {
  ten: string;
  soSanPham: number;
  doanhThu: number;
}

export type RenameResult = { ok: true; soSanPhamDaDoi: number } | { ok: false; status: 404 | 409; error: string };

export interface AdminCategoryService {
  /** Tổng hợp từng danh mục: số sản phẩm + doanh thu đã ghi nhận (tổng ChiTietDonHang.donGia của các dòng
   * thuộc sản phẩm trong danh mục đó — cùng cách tính doanh thu với FR-ADM-04). */
  list(): Promise<CategorySummary[]>;
  /** Đổi tên (hoặc gộp vào danh mục đã có cùng tên mới) — cập nhật mọi SanPham đang thuộc `tenCu`. */
  rename(tenCu: string, tenMoi: string): Promise<RenameResult>;
}

export function createAdminCategoryService(getDb: () => PrismaClient): AdminCategoryService {
  return {
    async list() {
      const db = getDb();
      const grouped = await db.sanPham.groupBy({ by: ["danhMuc"], _count: { _all: true } });
      const doanhThuRows = await db.chiTietDonHang.groupBy({
        by: ["sanPhamId"],
        _sum: { donGia: true },
      });
      const sanPhamDanhMuc = await db.sanPham.findMany({ select: { id: true, danhMuc: true } });
      const danhMucCuaSp = new Map(sanPhamDanhMuc.map((s) => [s.id, s.danhMuc]));
      const doanhThuTheoDanhMuc = new Map<string, number>();
      for (const row of doanhThuRows) {
        const dm = danhMucCuaSp.get(row.sanPhamId);
        if (!dm) continue;
        doanhThuTheoDanhMuc.set(dm, (doanhThuTheoDanhMuc.get(dm) ?? 0) + Number(row._sum.donGia ?? 0));
      }
      return grouped
        .map((g) => ({ ten: g.danhMuc, soSanPham: g._count._all, doanhThu: doanhThuTheoDanhMuc.get(g.danhMuc) ?? 0 }))
        .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
    },

    async rename(tenCu, tenMoi) {
      const ten = tenMoi.trim();
      if (!ten) return { ok: false, status: 409, error: "Tên danh mục không được để trống." };
      if (ten.length > DANH_MUC_TOI_DA) return { ok: false, status: 409, error: `Tên danh mục tối đa ${DANH_MUC_TOI_DA} ký tự.` };
      if (ten === tenCu) return { ok: false, status: 409, error: "Tên mới trùng với tên hiện tại." };

      const updated = await getDb().sanPham.updateMany({ where: { danhMuc: tenCu }, data: { danhMuc: ten } });
      if (updated.count === 0) return { ok: false, status: 404, error: "Không tìm thấy danh mục." };
      return { ok: true, soSanPhamDaDoi: updated.count };
    },
  };
}

export const adminCategories: AdminCategoryService = createAdminCategoryService(getPrisma);
