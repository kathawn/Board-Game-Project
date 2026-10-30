import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { toIso, TRANG_THAI_DANG_GIU } from "../db/tx";
import { tinhPhiShip, uocTinhKhoangCachKm } from "./deposit";
import { toShipment } from "../shipping/service";
import type { Shipment } from "../shipping/types";

/** FR-CT-05 (BR-01, UC-05/UC-06): đơn thuê. Đơn chỉ được TẠO bởi webhook thanh toán cọc thành công
 * (lib/payments/service.ts, UC-10); store này chỉ đọc và xác nhận. Mỗi dòng giữ lại tiền thuê
 * (FR-CT-04/BRU-02) và tiền cọc (FR-CT-03/BRU-01) đã tính lúc tạo đơn, để Staff xác nhận (UC-05)
 * không cần tính lại và không bị ảnh hưởng nếu giá niêm yết đổi sau đó. */

export type TrangThaiDonThue = "Pending" | "Confirmed" | "Active" | "Overdue";

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
  /** FR-TTGV-03/04/05: vận đơn hai chiều đã tạo (gộp mọi dòng đơn; trống cho tới khi bàn giao). */
  shipments: Shipment[];
}

/** Giai đoạn xử lý của Staff trên màn đơn thuê (mỗi giai đoạn là một tab):
 * ChoXacNhan = Pending (UC-05), ChoBanGiao = Confirmed (UC-06), DangThue = Active + Overdue (theo dõi UC-12). */
export const RENTAL_STAGES = ["ChoXacNhan", "ChoBanGiao", "DangThue"] as const;
export type RentalStage = (typeof RENTAL_STAGES)[number];

const STAGE_TRANG_THAI: Record<RentalStage, string[]> = {
  ChoXacNhan: ["Pending"],
  ChoBanGiao: ["Confirmed"],
  DangThue: ["Active", "Overdue"],
};

export interface RentalOrderPage {
  orders: RentalOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Số đơn theo từng giai đoạn (áp dụng từ khoá tìm kiếm, không áp dụng giai đoạn) để hiện trên tab. */
  counts: Record<RentalStage, number>;
}

export interface RentalOrderStore {
  list(): Promise<RentalOrder[]>;
  /** Tìm kiếm (mã đơn / email khách / tên sản phẩm) + lọc giai đoạn + phân trang chạy ở SQL, không tải hết đơn về. */
  search(opts: { q: string; stage: RentalStage; page: number; pageSize: number }): Promise<RentalOrderPage>;
  get(id: string): Promise<RentalOrder | undefined>;
  /** FR-CT-05/UC-05: Staff xác nhận đơn — chỉ hợp lệ khi đơn đang ở Pending. */
  confirm(id: string): Promise<{ ok: true; order: RentalOrder } | { ok: false; error: string }>;
  /** FR-CT-02/BR-05: khoảng ngày của một sản phẩm trong mọi đơn thuê còn hiệu lực. */
  listActiveDateRangesForProduct(productSlug: string): Promise<{ startDate: string; endDate: string }[]>;
}

const includeOrder = {
  khachHang: { select: { email: true } },
  chiTiet: { include: { sanPham: { select: { slug: true, ten: true } }, giaoVan: true } },
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
    trangThai: (["Confirmed", "Active", "Overdue"].includes(row.trangThai) ? row.trangThai : "Pending") as TrangThaiDonThue,
    ngayTao: toIso(row.ngayTao),
    diaChiNhan,
    // Đối tác giao vận dự kiến chọn theo khoảng cách (BRU-05) — suy ra từ địa chỉ nhận; vận đơn thật nằm
    // ở `shipments` sau khi Staff bàn giao (UC-06).
    doiTac: tinhPhiShip(uocTinhKhoangCachKm(diaChiNhan)).doiTac,
    lines,
    tongTienThue: lines.reduce((sum, l) => sum + l.tienThue, 0),
    tongTienCoc: row.datCoc ? Number(row.datCoc.soTien) : lines.reduce((sum, l) => sum + l.tienCoc, 0),
    paymentId: row.thanhToan[0]?.maThanhToan,
    shipments: row.chiTiet.flatMap((c) => c.giaoVan.filter((g) => g.maVanDon).map(toShipment)),
  };
}

export function createPrismaRentalOrderStore(getDb: () => PrismaClient): RentalOrderStore {
  return {
    async list() {
      const rows = await getDb().donHang.findMany({
        // Staff xử lý đơn chờ xác nhận (UC-05), đã xác nhận chờ bàn giao (UC-06) và đang thuê/quá hạn để theo
        // dõi vận chuyển (UC-12); Completed/Closed thuộc UC-07.
        where: { loai: "Thue", trangThai: { in: ["Pending", "Confirmed", "Active", "Overdue"] } },
        include: includeOrder,
        orderBy: { ngayTao: "desc" },
      });
      return rows.map(toRentalOrder);
    },

    async search({ q, stage, page, pageSize }) {
      const db = getDb();
      const keyword = q.trim();
      const timKiem: Prisma.DonHangWhereInput = keyword
        ? {
            OR: [
              { maDon: { contains: keyword } },
              { khachHang: { email: { contains: keyword } } },
              { chiTiet: { some: { sanPham: { ten: { contains: keyword } } } } },
            ],
          }
        : {};
      const base: Prisma.DonHangWhereInput = { loai: "Thue", ...timKiem };
      const where: Prisma.DonHangWhereInput = { ...base, trangThai: { in: STAGE_TRANG_THAI[stage] } };

      const total = await db.donHang.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const current = Math.min(totalPages, Math.max(1, page));

      const [rows, grouped] = await Promise.all([
        db.donHang.findMany({
          where,
          include: includeOrder,
          // Việc cần làm trước: đơn cũ nhất xử lý trước; ở tab đang thuê thì Overdue (quá hạn) lên đầu.
          orderBy: stage === "DangThue" ? [{ trangThai: "desc" }, { ngayTao: "asc" }] : [{ ngayTao: "asc" }],
          skip: (current - 1) * pageSize,
          take: pageSize,
        }),
        db.donHang.groupBy({
          by: ["trangThai"],
          where: { ...base, trangThai: { in: Object.values(STAGE_TRANG_THAI).flat() } },
          _count: { _all: true },
        }),
      ]);

      const counts = { ChoXacNhan: 0, ChoBanGiao: 0, DangThue: 0 } as Record<RentalStage, number>;
      for (const g of grouped) {
        const s = RENTAL_STAGES.find((st) => STAGE_TRANG_THAI[st].includes(g.trangThai));
        if (s) counts[s] += g._count._all;
      }
      return { orders: rows.map(toRentalOrder), total, page: current, pageSize, totalPages, counts };
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
