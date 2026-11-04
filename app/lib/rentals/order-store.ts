import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { lockResource, toDate, toIso, TRANG_THAI_DANG_GIU, type Tx } from "../db/tx";
import { tinhPhiShip, uocTinhKhoangCachKm } from "./deposit";
import { toShipment } from "../shipping/service";
import type { Shipment } from "../shipping/types";
import { creditWallet } from "../payments/wallet";
import { ngayVietNam } from "./settlement";

/** Ngày mai theo giờ Việt Nam (yyyy-mm-dd) — mốc "cần giao gấp" của tab Chờ bàn giao. */
export function ngayMaiVN(now: Date = new Date()): string {
  return ngayVietNam(new Date(now.getTime() + 86_400_000));
}

/** FR-CT-05 (BR-01, UC-05/UC-06): đơn thuê. Đơn chỉ được TẠO bởi webhook thanh toán cọc thành công
 * (lib/payments/service.ts, UC-10); store này chỉ đọc và xác nhận. Mỗi dòng giữ lại tiền thuê
 * (FR-CT-04/BRU-02) và tiền cọc (FR-CT-03/BRU-01) đã tính lúc tạo đơn, để Staff xác nhận (UC-05)
 * không cần tính lại và không bị ảnh hưởng nếu giá niêm yết đổi sau đó. */

export type TrangThaiDonThue = "Pending" | "Confirmed" | "Active" | "Overdue" | "Cancelled";

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
  /** Họ tên + SĐT người nhận (từ hồ sơ khách) — in lên phiếu dán đơn. Có thể trống nếu khách chưa cập nhật hồ sơ. */
  hoTen?: string;
  sdt?: string;
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
  /** Số đơn "Chờ bàn giao" cần giao gấp: có dòng bắt đầu thuê từ hôm nay trở về trước hoặc ngày mai (áp dụng từ khoá tìm). */
  soGap: number;
}

export interface RentalOrderStore {
  list(): Promise<RentalOrder[]>;
  /** Tìm kiếm (mã đơn / email khách / tên sản phẩm) + lọc giai đoạn + phân trang chạy ở SQL, không tải hết đơn về. */
  search(opts: {
    q: string;
    stage: RentalStage;
    page: number;
    pageSize: number;
    /** Chỉ lấy đơn cần giao gấp (xem RentalOrderPage.soGap); chỉ có ý nghĩa ở giai đoạn ChoBanGiao. */
    urgent?: boolean;
  }): Promise<RentalOrderPage>;
  get(id: string): Promise<RentalOrder | undefined>;
  /** FR-CT-05/UC-05: Staff xác nhận đơn — chỉ hợp lệ khi đơn đang ở Pending. */
  confirm(id: string): Promise<{ ok: true; order: RentalOrder } | { ok: false; error: string }>;
  /** FR-BH-06 (UC-04 luồng thay thế): khách tự huỷ đơn thuê của chính mình khi còn Pending (chưa được
   * Staff xác nhận) — hoàn toàn bộ tiền cọc đã thu vào Ví điện tử nội bộ (BRU-06). */
  cancel(id: string, email: string): Promise<{ ok: true; order: RentalOrder } | { ok: false; status: 404 | 409; error: string }>;
  /** FR-CT-02/BR-05: khoảng ngày của một sản phẩm trong mọi đơn thuê còn hiệu lực. */
  listActiveDateRangesForProduct(productSlug: string): Promise<{ startDate: string; endDate: string }[]>;
}

const includeOrder = {
  khachHang: { select: { email: true, hoTen: true, sdt: true } },
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
    hoTen: row.khachHang.hoTen || undefined,
    sdt: row.khachHang.sdt || undefined,
    trangThai: (["Confirmed", "Active", "Overdue", "Cancelled"].includes(row.trangThai) ? row.trangThai : "Pending") as TrangThaiDonThue,
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

    async search({ q, stage, page, pageSize, urgent }) {
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
      // "Gấp" = có dòng bắt đầu thuê từ ngày mai trở về trước (kể cả đã trễ lịch). Ngày tính theo giờ VN.
      const gap: Prisma.DonHangWhereInput = {
        trangThai: "Confirmed",
        chiTiet: { some: { ngayBatDau: { lte: toDate(ngayMaiVN()) } } },
      };
      const where: Prisma.DonHangWhereInput = {
        ...base,
        trangThai: { in: STAGE_TRANG_THAI[stage] },
        ...(urgent && stage === "ChoBanGiao" ? gap : {}),
      };

      const total = await db.donHang.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const current = Math.min(totalPages, Math.max(1, page));

      const [rows, grouped, soGap] = await Promise.all([
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
        db.donHang.count({ where: { ...base, ...gap } }),
      ]);

      const counts = { ChoXacNhan: 0, ChoBanGiao: 0, DangThue: 0 } as Record<RentalStage, number>;
      for (const g of grouped) {
        const s = RENTAL_STAGES.find((st) => STAGE_TRANG_THAI[st].includes(g.trangThai));
        if (s) counts[s] += g._count._all;
      }
      return { orders: rows.map(toRentalOrder), total, page: current, pageSize, totalPages, counts, soGap };
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

    async cancel(id, email) {
      const db = getDb();
      return db.$transaction(async (tx: Tx) => {
        // Khoá cùng tên với settle/collectAgain (lib/rentals/returns.ts) để không xen kẽ với các bước xử lý
        // khác trên đơn này. confirm()/handover() không dùng khoá này — chống hai bên "thắng" cùng lúc giữa
        // huỷ và xác nhận/bàn giao đến từ việc cả hai đều là UPDATE có điều kiện trên tiền đề loại trừ nhau
        // (Pending vs đã Confirmed), không phải từ khoá chung.
        await lockResource(tx, `ht:${id}`);

        const order = await tx.donHang.findUnique({
          where: { maDon: id },
          select: { id: true, loai: true, trangThai: true, khachHang: { select: { email: true } } },
        });
        if (!order || order.loai !== "Thue" || order.khachHang.email !== email) {
          return { ok: false as const, status: 404 as const, error: "Không tìm thấy đơn thuê." };
        }

        // UPDATE có điều kiện: Staff xác nhận (UC-05) đúng lúc khách bấm huỷ thì chỉ một bên thắng.
        const updated = await tx.donHang.updateMany({
          where: { id: order.id, trangThai: "Pending" },
          data: { trangThai: "Cancelled" },
        });
        if (updated.count === 0) {
          return { ok: false as const, status: 409 as const, error: "Đơn thuê đã được xác nhận hoặc không còn ở trạng thái chờ xác nhận, không thể huỷ." };
        }

        // Đơn thuê Pending luôn được webhook tạo kèm DatCoc + khoản TienCoc đã DaThanhToan (lib/payments/service.ts)
        // — tiền đã thu thật nên không được âm thầm bỏ qua hoàn ví nếu thiếu một trong hai; ném lỗi để dừng cả
        // transaction (rollback luôn bước huỷ đơn) thay vì mất tiền không dấu vết.
        const coc = await tx.datCoc.findUnique({ where: { donHangId: order.id } });
        if (!coc) throw new Error(`Đơn thuê ${id} không có tiền cọc để hoàn — dữ liệu không nhất quán.`);
        const thanhToanCoc = await tx.thanhToan.findFirst({
          where: { donHangId: order.id, mucDich: "TienCoc", trangThai: "DaThanhToan" },
          select: { id: true, maThanhToan: true },
        });
        if (!thanhToanCoc) throw new Error(`Đơn thuê ${id} không có khoản tiền cọc đã thanh toán để hoàn — dữ liệu không nhất quán.`);

        await creditWallet(tx, {
          email,
          thanhToanId: thanhToanCoc.id,
          maGiaoDich: `HUYDON-${id}`,
          soTien: Number(coc.soTien),
          lyDo: `Hoàn cọc đơn ${id} — khách huỷ khi còn chờ xác nhận (FR-BH-06)`,
        });
        await tx.datCoc.update({
          where: { donHangId: order.id },
          data: { trangThai: "Refunded", ngayHoan: toDate(ngayVietNam(new Date())) },
        });

        // Đọc lại trong CHÍNH transaction này (không gọi this.get(), vì đó mở kết nối mới và sẽ
        // chờ chính khoá hàng mà transaction này đang giữ, gây timeout).
        const after = await tx.donHang.findUniqueOrThrow({ where: { id: order.id }, include: includeOrder });
        return { ok: true as const, order: toRentalOrder(after) };
      }, { maxWait: 15_000, timeout: 30_000 });
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
