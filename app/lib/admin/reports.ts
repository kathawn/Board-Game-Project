import { getPrisma } from "../db/client";
import { toIso } from "../db/tx";
import type { PrismaClient } from "../generated/prisma/client";
import type { DonRow, HopRow, LoaiDon, Paged, RangeSummary, RevenueLineRow, TrangThaiDon, TrangThaiHop } from "./types";

/** UC-16 (FR-ADM-04, FR-ADM-05; BR-07, BR-13): báo cáo doanh thu bán/thuê theo khoảng ngày (gồm trường hợp đặc
 * biệt "theo tháng"), tồn kho hộp game theo trạng thái, và danh sách đơn theo trạng thái — mọi tìm/lọc/phân
 * trang chạy ở SQL để còn dùng được khi có hàng trăm/nghìn đơn (không tải hết về rồi lọc ở client).
 *
 * Quy ước số liệu (khớp 100% với cách Dashboard/Báo cáo chi tiết trình bày, đã thống nhất ở bước mockup):
 * - Doanh thu bán = tổng ChiTietDonHang.donGia của các dòng thuộc đơn Ban (donGia đã là thành tiền = đơn giá × SL).
 * - Doanh thu thuê = tổng ChiTietDonHang.tienThue của các dòng thuộc đơn Thue (không tính cọc, phí ship, khoản hoàn).
 * - "Đơn" trong báo cáo doanh thu nghĩa là 1 dòng ChiTietDonHang (khớp đơn vị hiển thị ở bảng giao dịch mockup),
 *   không phải 1 DonHang — một đơn thuê/mua nhiều sản phẩm sẽ tính thành nhiều dòng. */

export const PAGE_SIZE = 10;

export const DON_STATUSES: TrangThaiDon[] = ["Pending", "Confirmed", "Active", "Overdue", "Completed", "Closed", "Cancelled"];
export const HOP_STATUSES: TrangThaiHop[] = ["Available", "Reserved", "Rented", "Checking", "Damaged", "Sold"];

export type { DonRow, HopRow, LoaiDon, Paged, RangeSummary, RevenueLineRow, TrangThaiDon, TrangThaiHop };

function paginate<T>(all: T[], page: number): Paged<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(totalPages, Math.max(1, page));
  return { items: all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total: all.length, page: current, totalPages };
}

/** [from, to] bao gồm cả hai đầu — to là ngày cuối cùng còn tính, nên mốc kết thúc truyền cho Prisma là đầu ngày
 * kế tiếp (lt), tránh bỏ sót các dòng tạo trong ngày `to` sau nửa đêm theo giờ UTC lưu trong cột. */
function toDateRange(from: string, to: string) {
  const gte = new Date(`${from}T00:00:00.000Z`);
  const ketThuc = new Date(`${to}T00:00:00.000Z`);
  const lt = new Date(ketThuc.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

export interface AdminReportService {
  rangeSummary(from: string, to: string): Promise<RangeSummary>;
  queryRevenueLines(opts: { from: string; to: string; loai: "" | LoaiDon; q: string; page: number }): Promise<Paged<RevenueLineRow>>;
  queryOrders(opts: {
    trangThai: "" | TrangThaiDon;
    loai: "" | LoaiDon;
    q: string;
    page: number;
  }): Promise<Paged<DonRow> & { counts: Record<TrangThaiDon, number>; totalAll: number }>;
  queryBoxes(opts: {
    trangThai: "" | TrangThaiHop;
    q: string;
    page: number;
  }): Promise<Paged<HopRow> & { counts: Record<TrangThaiHop, number>; totalAll: number }>;
}

export function createAdminReportService(getDb: () => PrismaClient): AdminReportService {
  /** Mọi dòng ChiTietDonHang trong khoảng ngày (theo DonHang.ngayTao), kèm tên khách/sản phẩm, lọc theo loại +
   * từ khoá ở SQL. Dùng chung cho rangeSummary và queryRevenueLines nên luôn khớp số liệu với nhau. */
  async function revenueLines(from: string, to: string, loai: "" | LoaiDon, keyword: string) {
    const db = getDb();
    const { gte, lt } = toDateRange(from, to);
    const k = keyword.trim();
    const rows = await db.chiTietDonHang.findMany({
      where: {
        donHang: {
          ngayTao: { gte, lt },
          ...(loai ? { loai } : {}),
          ...(k
            ? {
                OR: [
                  { maDon: { contains: k } },
                  { khachHang: { hoTen: { contains: k } } },
                  { chiTiet: { some: { sanPham: { ten: { contains: k } } } } },
                ],
              }
            : {}),
        },
      },
      select: {
        donGia: true,
        tienThue: true,
        sanPham: { select: { ten: true } },
        donHang: { select: { maDon: true, loai: true, ngayTao: true, khachHang: { select: { hoTen: true } } } },
      },
      orderBy: { donHang: { ngayTao: "desc" } },
    });
    return rows.map((r) => {
      const loaiDong = r.donHang.loai as LoaiDon;
      return {
        maDon: r.donHang.maDon,
        loai: loaiDong,
        ngayTao: toIso(r.donHang.ngayTao),
        khach: r.donHang.khachHang.hoTen,
        sanPham: r.sanPham.ten,
        tien: loaiDong === "Ban" ? Number(r.donGia) : Number(r.tienThue ?? 0),
      } satisfies RevenueLineRow;
    });
  }

  return {
    async rangeSummary(from, to) {
      const rows = await revenueLines(from, to, "", "");
      const sum = (loai: LoaiDon) => {
        const rs = rows.filter((r) => r.loai === loai);
        return { soDon: rs.length, doanhThu: rs.reduce((s, r) => s + r.tien, 0) };
      };
      const ban = sum("Ban");
      const thue = sum("Thue");
      return { ban, thue, tong: ban.doanhThu + thue.doanhThu, soDon: ban.soDon + thue.soDon };
    },

    async queryRevenueLines({ from, to, loai, q, page }) {
      const rows = await revenueLines(from, to, loai, q);
      return paginate(rows, page);
    },

    async queryOrders({ trangThai, loai, q, page }) {
      const db = getDb();
      const k = q.trim();
      // "base" (không lọc trạng thái) phục vụ counts theo từng trạng thái cho chip bộ lọc; "where" thêm trạng thái
      // đang chọn để chỉ tải đúng tập đang cần hiển thị — tránh tải toàn bộ bảng DonHang khi đã lọc theo trạng thái.
      const base = {
        ...(loai ? { loai } : {}),
        ...(k
          ? {
              OR: [
                { maDon: { contains: k } },
                { khachHang: { hoTen: { contains: k } } },
                { chiTiet: { some: { sanPham: { ten: { contains: k } } } } },
              ],
            }
          : {}),
      };
      const where = { ...base, ...(trangThai ? { trangThai } : {}) };

      const [rows, grouped, totalAll] = await Promise.all([
        db.donHang.findMany({
          where,
          select: {
            maDon: true,
            loai: true,
            trangThai: true,
            ngayTao: true,
            khachHang: { select: { hoTen: true } },
            chiTiet: { select: { sanPham: { select: { ten: true } }, donGia: true, tienThue: true } },
          },
        }),
        db.donHang.groupBy({ by: ["trangThai"], where: base, _count: { _all: true } }),
        db.donHang.count({ where: base }),
      ]);

      const counts = Object.fromEntries(DON_STATUSES.map((s) => [s, 0])) as Record<TrangThaiDon, number>;
      for (const g of grouped) counts[g.trangThai as TrangThaiDon] = g._count._all;

      const uuTien: TrangThaiDon[] = ["Overdue", "Pending", "Confirmed", "Active", "Completed", "Closed", "Cancelled"];
      const mapped: DonRow[] = rows.map((r) => {
        const loaiDon = r.loai as LoaiDon;
        return {
          maDon: r.maDon,
          loai: loaiDon,
          trangThai: r.trangThai as TrangThaiDon,
          ngayTao: toIso(r.ngayTao),
          khach: r.khachHang.hoTen,
          sanPham: r.chiTiet.map((c) => c.sanPham.ten).join(", "),
          tien:
            loaiDon === "Ban"
              ? r.chiTiet.reduce((s, c) => s + Number(c.donGia), 0)
              : r.chiTiet.reduce((s, c) => s + Number(c.tienThue ?? 0), 0),
        };
      });
      const sorted = mapped.sort(
        (a, b) => uuTien.indexOf(a.trangThai) - uuTien.indexOf(b.trangThai) || b.ngayTao.localeCompare(a.ngayTao),
      );

      return { ...paginate(sorted, page), counts, totalAll };
    },

    async queryBoxes({ trangThai, q, page }) {
      const db = getDb();
      const k = q.trim();
      const where = {
        ...(trangThai ? { trangThai } : {}),
        ...(k ? { OR: [{ maHop: { contains: k } }, { sanPham: { ten: { contains: k } } }] } : {}),
      };
      const baseWhere = k ? { OR: [{ maHop: { contains: k } }, { sanPham: { ten: { contains: k } } }] } : {};

      const [rows, grouped, totalAll] = await Promise.all([
        db.hopGame.findMany({
          where,
          select: { maHop: true, trangThai: true, sanPham: { select: { ten: true } } },
          orderBy: { maHop: "asc" },
        }),
        db.hopGame.groupBy({ by: ["trangThai"], where: baseWhere, _count: { _all: true } }),
        db.hopGame.count({ where: baseWhere }),
      ]);

      const counts = Object.fromEntries(HOP_STATUSES.map((s) => [s, 0])) as Record<TrangThaiHop, number>;
      for (const g of grouped) counts[g.trangThai as TrangThaiHop] = g._count._all;

      const mapped: HopRow[] = rows.map((r) => ({ maHop: r.maHop, sanPham: r.sanPham.ten, trangThai: r.trangThai as TrangThaiHop }));
      return { ...paginate(mapped, page), counts, totalAll };
    },
  };
}

export const adminReports: AdminReportService = createAdminReportService(getPrisma);
