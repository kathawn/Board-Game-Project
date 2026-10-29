import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { toIso, TRANG_THAI_DANG_GIU } from "../db/tx";
import { tinhPhiShip, uocTinhKhoangCachKm } from "./deposit";

/** FR-CT-05 (BR-01, UC-05/UC-06): đơn thuê. Đơn chỉ được TẠO bởi webhook thanh toán cọc thành công
 * (lib/payments/service.ts, UC-10); store này chỉ đọc và xác nhận. Mỗi dòng giữ lại tiền thuê
 * (FR-CT-04/BRU-02) và tiền cọc (FR-CT-03/BRU-01) đã tính lúc tạo đơn, để Staff xác nhận (UC-05)
 * không cần tính lại và không bị ảnh hưởng nếu giá niêm yết đổi sau đó. */

export type TrangThaiDonThue = "Pending" | "Confirmed";

export interface RentalOrderLine {
  productSlug: string;
  productName: string;
  startDate: string;
  endDate: string;
  tienThue: number;
  tienCoc: number;
}

export interface RentalOrder {
  /** Mã hiển thị (DT-00001); khoá chính UUID chỉ dùng nội bộ trong DB. */
  id: string;
  email: string;
  trangThai: TrangThaiDonThue;
  ngayTao: string;
  diaChiNhan: string;
  doiTac: "GreenSM" | "ShopeeExpress";
  lines: RentalOrderLine[];
  tongTienThue: number;
  tongTienCoc: number;
  /** UC-10: khoản thanh toán cọc đã tạo ra đơn này. */
  paymentId?: string;
}

export interface RentalOrderStore {
  list(): Promise<RentalOrder[]>;
  get(id: string): Promise<RentalOrder | undefined>;
  /** FR-CT-05/UC-05: Staff xác nhận đơn — chỉ hợp lệ khi đơn đang ở Pending. */
  confirm(id: string): Promise<{ ok: true; order: RentalOrder } | { ok: false; error: string }>;
  /** FR-CT-02/BR-05: khoảng ngày của một sản phẩm trong mọi đơn thuê còn hiệu lực. */
  listActiveDateRangesForProduct(productSlug: string): Promise<{ startDate: string; endDate: string }[]>;
}

const includeOrder = {
  khachHang: { select: { email: true } },
  chiTiet: { include: { sanPham: { select: { slug: true, ten: true } } } },
  datCoc: true,
  thanhToan: { select: { maThanhToan: true }, take: 1 },
} satisfies Prisma.DonHangInclude;

type OrderRow = Prisma.DonHangGetPayload<{ include: typeof includeOrder }>;

function toRentalOrder(row: OrderRow): RentalOrder {
  const lines: RentalOrderLine[] = row.chiTiet.map((c) => ({
    productSlug: c.sanPham.slug,
    productName: c.sanPham.ten,
    startDate: c.ngayBatDau ? toIso(c.ngayBatDau) : "",
    endDate: c.ngayKetThuc ? toIso(c.ngayKetThuc) : "",
    tienThue: Number(c.tienThue ?? 0),
    tienCoc: Number(c.tienCoc ?? 0),
  }));
  const diaChiNhan = row.chiTiet[0]?.diaChiNhan ?? "";
  return {
    id: row.maDon,
    email: row.khachHang.email,
    trangThai: row.trangThai === "Confirmed" ? "Confirmed" : "Pending",
    ngayTao: toIso(row.ngayTao),
    diaChiNhan,
    // Đối tác giao vận chọn theo khoảng cách (BRU-05) — suy ra từ địa chỉ nhận, chưa lưu GiaoVan
    // cho tới khi Staff bàn giao (UC-06).
    doiTac: tinhPhiShip(uocTinhKhoangCachKm(diaChiNhan)).doiTac,
    lines,
    tongTienThue: lines.reduce((sum, l) => sum + l.tienThue, 0),
    tongTienCoc: row.datCoc ? Number(row.datCoc.soTien) : lines.reduce((sum, l) => sum + l.tienCoc, 0),
    paymentId: row.thanhToan[0]?.maThanhToan,
  };
}

export function createPrismaRentalOrderStore(getDb: () => PrismaClient): RentalOrderStore {
  return {
    async list() {
      const rows = await getDb().donHang.findMany({
        // Staff chỉ xử lý đơn đang chờ xác nhận hoặc vừa xác nhận (UC-05); Active/Completed... thuộc UC-06/07.
        where: { loai: "Thue", trangThai: { in: ["Pending", "Confirmed"] } },
        include: includeOrder,
        orderBy: { ngayTao: "desc" },
      });
      return rows.map(toRentalOrder);
    },

    async get(id) {
      const row = await getDb().donHang.findUnique({ where: { maDon: id }, include: includeOrder });
      return row && row.loai === "Thue" ? toRentalOrder(row) : undefined;
    },

    async confirm(id) {
      const db = getDb();
      // Một câu UPDATE có điều kiện: hai Staff bấm xác nhận cùng lúc thì chỉ một người chuyển được.
      const updated = await db.donHang.updateMany({
        where: { maDon: id, loai: "Thue", trangThai: "Pending" },
        data: { trangThai: "Confirmed" },
      });
      if (updated.count === 0) {
        const exists = await db.donHang.findUnique({ where: { maDon: id }, select: { loai: true } });
        return {
          ok: false,
          error: exists?.loai === "Thue" ? "Đơn thuê không ở trạng thái chờ xác nhận." : "Không tìm thấy đơn thuê.",
        };
      }
      return { ok: true, order: (await this.get(id))! };
    },

    async listActiveDateRangesForProduct(productSlug) {
      const rows = await getDb().chiTietDonHang.findMany({
        where: {
          sanPham: { slug: productSlug },
          ngayBatDau: { not: null },
          donHang: { loai: "Thue", trangThai: { in: TRANG_THAI_DANG_GIU } },
        },
        select: { ngayBatDau: true, ngayKetThuc: true },
      });
      return rows.map((r) => ({ startDate: toIso(r.ngayBatDau!), endDate: toIso(r.ngayKetThuc!) }));
    },
  };
}
