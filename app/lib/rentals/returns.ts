import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { lockResource, nextSequence, toDate, toIso, type Tx } from "../db/tx";
import { creditWallet } from "../payments/wallet";
import { THOI_HAN_QR_MS } from "../payments/service";
import type { TrangThaiVanChuyen } from "../shipping/types";
import type { DoiTacGiaoVan } from "./deposit";
import { doiTrangThaiHop } from "./box-state";
import {
  donGiaDenBu,
  ngayVietNam,
  soLuongLoiHopLe,
  tinhQuyetToan,
  tinhSoNgayTre,
  type BienBanKiemDemJson,
  type KetQuaKiemDem,
  type LinhKienChecklist,
  type MucKiemDem,
  type QuyetToan,
} from "./settlement";

/** Trả hàng → kiểm đếm → phạt → hoàn cọc (SRS 3.6, Hình 3.5/3.9):
 *  - UC-08 / FR-KHO-01: Staff kiểm đếm linh kiện từng sản phẩm khi hàng đã về kho (vận đơn chiều trả = DaLay);
 *    hộp game Rented → Checking → Available (đủ) hoặc Damaged (thiếu/hư hỏng) theo FR-KHO-02.
 *  - UC-07 / FR-CT-06, FR-CT-07, FR-TTGV-08: tính phạt trễ hạn + đền bù + chênh lệch ship → hoàn cọc vào Ví điện tử
 *    nội bộ (BRU-06) hoặc, nếu âm, sinh QR thu thêm (UC-10). Đơn: Active/Overdue → Completed → Closed.
 *
 * Số tiền luôn được TÍNH LẠI ở server từ dữ liệu trong DB — giao diện chỉ hiển thị, không gửi số tiền lên.
 * Như các route /api/staff khác, chưa có đăng nhập Staff riêng (UC-13) nên biên bản gắn với tài khoản Staff đầu tiên. */

export type ReturnResult<T> = ({ ok: true } & T) | { ok: false; status: 400 | 404 | 409; error: string };

class ReturnError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

const TX_OPTIONS = { maxWait: 15_000, timeout: 30_000 };

export interface ReturnLineView {
  chiTietDonId: string;
  sanPhamId: string;
  tenSanPham: string;
  giaNiemYet: number;
  ngayKetThuc: string;
  /** Vận đơn chiều trả (UC-11). */
  tra: { maVanDon: string; doiTac: DoiTacGiaoVan; trangThai: TrangThaiVanChuyen; phiShip: number } | null;
  /** Phí ship thực tế đã phát sinh ở chiều giao (vận đơn chiều Nhan); 0 nếu chưa có. */
  phiShipNhan: number;
  /** Ngày hàng về kho (vận đơn chiều trả tới DaLay), giờ Việt Nam; null khi chưa về. */
  ngayTra: string | null;
  soNgayTre: number;
  checklist: LinhKienChecklist[];
  /** Hộp game vật lý đã xuất kho cho dòng này lúc bàn giao (ChiTietDonHang.maHop). */
  maHop: string | null;
  bienBan: (BienBanKiemDemJson & { ngayLap: string }) | null;
}

export interface PhieuQuyetToan {
  ngay: string;
  xuLy: "HoanVi" | "ThuThem" | "HoanKhong";
  quyetToan: QuyetToan;
}

export interface ReturnOrderView {
  id: string;
  email: string;
  trangThai: "Active" | "Overdue" | "Completed";
  diaChiTra: string;
  tongCocDaThu: number;
  lines: ReturnLineView[];
  /** Có khi mọi dòng đã về kho và đã kiểm đếm — xem trước số tiền sẽ hoàn/thu thêm. */
  quyetToan: QuyetToan | null;
  /** Lý do chưa quyết toán được (hiển thị cho Staff). */
  chuaQuyetToanDuoc: string | null;
  phieu: PhieuQuyetToan | null;
  thuThem: { maThanhToan: string; soTien: number; trangThai: "ChoThanhToan" | "DaThanhToan" | "HetHieuLuc" } | null;
}

/** Giai đoạn của một đơn trong luồng trả hàng — dùng để lọc/ưu tiên danh sách khi có nhiều đơn. */
export type ReturnStage = "ChoVeKho" | "ChoKiemDem" | "ChoQuyetToan" | "ChoThuThem";
/** Thứ tự ưu tiên hiển thị: việc Staff làm được ngay lên trước. */
export const RETURN_STAGES: readonly ReturnStage[] = ["ChoKiemDem", "ChoQuyetToan", "ChoThuThem", "ChoVeKho"];

/** Dòng tóm tắt trong danh sách (nhẹ: không kèm checklist/biên bản). */
export interface ReturnOrderSummary {
  id: string;
  email: string;
  trangThai: "Active" | "Overdue" | "Completed";
  stage: ReturnStage;
  sanPham: string;
  soDong: number;
}

export interface ReturnListParams {
  /** Tìm theo mã đơn, email hoặc tên sản phẩm. */
  q?: string;
  stage?: ReturnStage | "all";
  page?: number;
  pageSize?: number;
}

export interface ReturnListPage {
  orders: ReturnOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Số đơn theo từng giai đoạn (đã áp dụng ô tìm kiếm, chưa áp dụng bộ lọc giai đoạn). */
  counts: Record<ReturnStage | "all", number>;
}

export interface InspectInput {
  maDon: string;
  chiTietDonId: string;
  items: { linhKienId: string; ketQua: KetQuaKiemDem; soLuongLoi?: number }[];
  ghiChuNgoai?: string;
  /** UC-13: nhân viên (Staff hoặc Admin) đang đăng nhập và lập biên bản — ghi vào BienBanKiemDem.nhanVienId để truy vết. */
  nhanVienId?: string;
}

export interface SettleOutcome {
  quyetToan: QuyetToan;
  xuLy: PhieuQuyetToan["xuLy"];
  /** Mã khoản thu thêm (UC-10) khi khách còn phải trả thêm. */
  maThanhToanThuThem: string | null;
}

export interface ReturnService {
  list(params?: ReturnListParams): Promise<ReturnListPage>;
  /** Chi tiết đầy đủ một đơn (checklist, biên bản, quyết toán). */
  get(maDon: string): Promise<ReturnOrderView | null>;
  inspect(input: InspectInput): Promise<ReturnResult<{ coLoi: boolean; trangThaiHop: "Available" | "Damaged" }>>;
  settle(maDon: string): Promise<ReturnResult<SettleOutcome>>;
  /** Sinh lại QR thu thêm khi QR cũ đã hết hạn mà khách chưa trả. */
  collectAgain(maDon: string): Promise<ReturnResult<{ maThanhToan: string; soTien: number }>>;
}

const includeOrder = {
  khachHang: { select: { email: true } },
  datCoc: true,
  thanhToan: true,
  chiTiet: {
    include: {
      sanPham: { include: { linhKien: true } },
      giaoVan: true,
      bienBan: { orderBy: { ngayLap: "desc" }, take: 1 },
    },
  },
} satisfies Prisma.DonHangInclude;

const includeSummary = {
  khachHang: { select: { email: true } },
  chiTiet: {
    select: {
      sanPham: { select: { ten: true } },
      giaoVan: { select: { chieu: true, trangThaiVanChuyen: true } },
      bienBan: { select: { id: true }, take: 1 },
    },
  },
} satisfies Prisma.DonHangInclude;

type OrderRow = Prisma.DonHangGetPayload<{ include: typeof includeOrder }>;
type SummaryRow = Prisma.DonHangGetPayload<{ include: typeof includeSummary }>;

/** Đơn thuộc màn hình trả hàng: khách đã yêu cầu lấy hàng trả (UC-11), hoặc đã quyết toán nhưng còn khoản thu thêm. */
const dieuKienDanhSach = {
  loai: "Thue",
  OR: [
    { trangThai: { in: ["Active", "Overdue"] }, chiTiet: { some: { giaoVan: { some: { chieu: "Tra" } } } } },
    { trangThai: "Completed", thanhToan: { some: { mucDich: "ThuThem" } } },
  ],
} satisfies Prisma.DonHangWhereInput;

function tinhStage(row: SummaryRow): ReturnStage {
  if (row.trangThai === "Completed") return "ChoThuThem";
  const veKho = row.chiTiet.every((c) => c.giaoVan.some((g) => g.chieu === "Tra" && g.trangThaiVanChuyen === "DaLay"));
  if (!veKho) return "ChoVeKho";
  return row.chiTiet.every((c) => c.bienBan.length > 0) ? "ChoQuyetToan" : "ChoKiemDem";
}

function toSummary(row: SummaryRow): ReturnOrderSummary {
  return {
    id: row.maDon,
    email: row.khachHang.email,
    trangThai: row.trangThai as ReturnOrderSummary["trangThai"],
    stage: tinhStage(row),
    sanPham: row.chiTiet.map((c) => c.sanPham.ten).join(", "),
    soDong: row.chiTiet.length,
  };
}

/** So khớp không phân biệt hoa/thường và dạng Unicode (NFC) của tiếng Việt. */
const chuanHoa = (v: string) => v.normalize("NFC").toLowerCase();
type LineRow = OrderRow["chiTiet"][number];

/** Biên bản cũ (seed) có thể là chuỗi thường thay vì JSON — vẫn đọc được, coi như đủ linh kiện. */
function parseBienBan(raw: string): BienBanKiemDemJson {
  try {
    const p = JSON.parse(raw) as Partial<BienBanKiemDemJson> | null;
    if (p && Array.isArray(p.items)) {
      return { maHop: p.maHop ?? null, items: p.items, ghiChuNgoai: p.ghiChuNgoai ?? "", coLoi: Boolean(p.coLoi) };
    }
  } catch {
    // rơi xuống dạng chuỗi thường
  }
  return { maHop: null, items: [], ghiChuNgoai: raw, coLoi: false };
}

function parsePhieu(raw: string | null | undefined): PhieuQuyetToan | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PhieuQuyetToan;
  } catch {
    return null;
  }
}

function toChecklist(row: LineRow): LinhKienChecklist[] {
  return row.sanPham.linhKien.map((lk) => ({
    id: lk.id,
    ten: lk.tenLinhKien,
    docBan: lk.laDocBan,
    soLuong: lk.soLuong,
    giaLe: lk.giaLe === null ? null : Number(lk.giaLe),
  }));
}

function traShipment(row: LineRow) {
  return row.giaoVan.find((g) => g.chieu === "Tra" && g.maVanDon) ?? null;
}

function toLineView(row: LineRow): ReturnLineView {
  const tra = traShipment(row);
  // Ngày trả CHỈ lấy từ thời điểm vận đơn tới DaLay (đã lưu) — không bao giờ suy ra từ "bây giờ", nếu không tiền
  // phạt (15%/ngày) sẽ tăng dần theo ngày Staff chậm bấm quyết toán.
  const ngayTra = tra?.trangThaiVanChuyen === "DaLay" && tra.hoanTatLuc ? ngayVietNam(tra.hoanTatLuc) : null;
  const ngayKetThuc = row.ngayKetThuc ? toIso(row.ngayKetThuc) : "";
  const bb = row.bienBan[0];
  return {
    chiTietDonId: row.id,
    sanPhamId: row.sanPhamId,
    tenSanPham: row.sanPham.ten,
    // FR-ADM-03: tiền phạt / đền bù tính theo giá niêm yết LÚC ĐẶT, không theo giá hiện tại (Admin có thể đã đổi giá).
    giaNiemYet: Number(row.giaNiemYetChot ?? row.sanPham.giaNiemYet),
    ngayKetThuc,
    tra: tra
      ? {
          maVanDon: tra.maVanDon!,
          doiTac: tra.doiTac as DoiTacGiaoVan,
          trangThai: tra.trangThaiVanChuyen as TrangThaiVanChuyen,
          phiShip: Number(tra.phiShip),
        }
      : null,
    phiShipNhan: row.giaoVan.filter((g) => g.chieu === "Nhan" && g.maVanDon).reduce((s, g) => s + Number(g.phiShip), 0),
    ngayTra,
    soNgayTre: ngayTra && ngayKetThuc ? tinhSoNgayTre(ngayKetThuc, ngayTra) : 0,
    checklist: toChecklist(row),
    maHop: row.maHop,
    bienBan: bb ? { ...parseBienBan(bb.ketQua), ngayLap: toIso(bb.ngayLap) } : null,
  };
}

/** Gom dữ liệu 4 khoản (cọc, phạt, đền bù, ship) của cả đơn. Trả về lý do nếu chưa đủ điều kiện quyết toán. */
function tinhChoDon(order: OrderRow, lines: ReturnLineView[]): { quyetToan: QuyetToan | null; lyDo: string | null } {
  if (!order.datCoc) return { quyetToan: null, lyDo: "Đơn chưa có khoản đặt cọc." };
  const chuaVe = lines.filter((l) => l.tra?.trangThai !== "DaLay");
  if (chuaVe.length > 0) {
    return {
      quyetToan: null,
      lyDo: `Giao vận chưa lấy xong hàng trả (UC-11/UC-12): ${chuaVe.map((l) => l.tenSanPham).join(", ")}.`,
    };
  }
  const thieuNgayVe = lines.filter((l) => !l.ngayTra);
  if (thieuNgayVe.length > 0) {
    return {
      quyetToan: null,
      lyDo: `Thiếu ngày hàng về kho của vận đơn chiều trả nên chưa tính được phạt trễ hạn: ${thieuNgayVe.map((l) => l.tenSanPham).join(", ")}.`,
    };
  }
  const chuaKiem = lines.filter((l) => !l.bienBan);
  if (chuaKiem.length > 0) {
    return { quyetToan: null, lyDo: `Chưa kiểm đếm (UC-08): ${chuaKiem.map((l) => l.tenSanPham).join(", ")}.` };
  }

  // Cọc giữ phí ship chiều giao × 2 cho MỖI dòng (BRU-01) → phần ship đã giữ của một dòng = phiShipGiu / số dòng.
  // Khách chịu 100% phí ship thực tế cả hai chiều (FR-TTGV-08), nên so với tổng ship thực tế giao + trả của dòng đó.
  const shipGiuMoiDong = Number(order.datCoc.phiShipGiu) / lines.length;
  return {
    lyDo: null,
    quyetToan: tinhQuyetToan({
      tongCocDaThu: Number(order.datCoc.soTien),
      dong: lines.map((l) => ({
        tenSanPham: l.tenSanPham,
        giaNiemYet: l.giaNiemYet,
        soNgayTre: l.soNgayTre,
        items: l.bienBan!.items,
        shipGiu: shipGiuMoiDong,
        phiShipNhanThucTe: l.phiShipNhan,
        phiShipTraThucTe: l.tra!.phiShip,
      })),
    }),
  };
}

function toOrderView(row: OrderRow, nowMs: number): ReturnOrderView {
  const lines = row.chiTiet.map((c) => toLineView(c));
  const { quyetToan, lyDo } = tinhChoDon(row, lines);
  const thuThemRow = row.thanhToan
    .filter((t) => t.mucDich === "ThuThem")
    .sort((a, b) => b.taoLuc.getTime() - a.taoLuc.getTime())[0];
  return {
    id: row.maDon,
    email: row.khachHang.email,
    trangThai: row.trangThai as ReturnOrderView["trangThai"],
    diaChiTra: row.chiTiet.find((c) => c.diaChiTra)?.diaChiTra ?? row.chiTiet[0]?.diaChiNhan ?? "",
    tongCocDaThu: Number(row.datCoc?.soTien ?? 0),
    lines,
    quyetToan,
    chuaQuyetToanDuoc: row.trangThai === "Completed" ? null : lyDo,
    phieu: parsePhieu(row.datCoc?.phieuQuyetToan),
    thuThem: thuThemRow
      ? {
          maThanhToan: thuThemRow.maThanhToan,
          soTien: Number(thuThemRow.soTien),
          trangThai:
            thuThemRow.trangThai === "ChoThanhToan" && thuThemRow.hetHanLuc.getTime() <= nowMs
              ? "HetHieuLuc"
              : (thuThemRow.trangThai as "ChoThanhToan" | "DaThanhToan" | "HetHieuLuc"),
        }
      : null,
  };
}

export function createReturnService(deps: { getDb: () => PrismaClient; now?: () => number }): ReturnService {
  const now = deps.now ?? Date.now;

  async function guard<T>(run: () => Promise<ReturnResult<T>>): Promise<ReturnResult<T>> {
    try {
      return await run();
    } catch (e) {
      if (e instanceof ReturnError) return { ok: false, status: e.status, error: e.message };
      throw e;
    }
  }

  async function loadOrder(tx: Tx, maDon: string): Promise<OrderRow> {
    const order = await tx.donHang.findUnique({ where: { maDon }, include: includeOrder });
    if (!order || order.loai !== "Thue") throw new ReturnError(404, "Không tìm thấy đơn thuê.");
    return order;
  }

  /** Hết hạn tính lười (lazy) cho khoản thu thêm, giống UC-10 3a. */
  async function expirePending(tx: Tx, donHangId: string) {
    await tx.thanhToan.updateMany({
      where: { donHangId, mucDich: "ThuThem", trangThai: "ChoThanhToan", hetHanLuc: { lte: new Date(now()) } },
      data: { trangThai: "HetHieuLuc" },
    });
  }

  async function taoQrThuThem(tx: Tx, order: { id: string; khachHangId: string }, soTien: number) {
    const maThanhToan = `PAY-${String(await nextSequence(tx, "seq_mathanhtoan")).padStart(5, "0")}`;
    const taoLuc = now();
    await tx.thanhToan.create({
      data: {
        maThanhToan,
        donHangId: order.id,
        khachHangId: order.khachHangId,
        soTien,
        mucDich: "ThuThem",
        trangThai: "ChoThanhToan",
        maQR: `momo://pay?orderId=${maThanhToan}&amount=${soTien}`,
        taoLuc: new Date(taoLuc),
        hetHanLuc: new Date(taoLuc + THOI_HAN_QR_MS),
        snapshot: JSON.stringify({ lines: [], diaChiNhan: "", doiTac: "GreenSM", dongHetHang: [] }),
      },
    });
    return maThanhToan;
  }

  /** Active → Overdue khi có sản phẩm quá hạn trả (State Machine Hình 3.6); tính lười lúc Staff mở màn hình. */
  async function capNhatQuaHan(db: PrismaClient, maDon?: string) {
    const today = ngayVietNam(new Date(now()));
    const dangThue = await db.donHang.findMany({
      where: { loai: "Thue", trangThai: "Active", ...(maDon ? { maDon } : {}) },
      select: { id: true, chiTiet: { select: { ngayKetThuc: true } } },
    });
    const quaHan = dangThue
      .filter((o) => o.chiTiet.some((c) => c.ngayKetThuc && toIso(c.ngayKetThuc) < today))
      .map((o) => o.id);
    if (quaHan.length > 0) {
      await db.donHang.updateMany({ where: { id: { in: quaHan }, trangThai: "Active" }, data: { trangThai: "Overdue" } });
    }
  }

  return {
    async list(params = {}) {
      const db = deps.getDb();
      await capNhatQuaHan(db);

      const rows = await db.donHang.findMany({
        where: dieuKienDanhSach,
        include: includeSummary,
        orderBy: { ngayTao: "desc" },
      });
      const q = chuanHoa((params.q ?? "").trim());
      const khop = rows.map(toSummary).filter((o) => !q || chuanHoa(`${o.id} ${o.email} ${o.sanPham}`).includes(q));

      const counts: ReturnListPage["counts"] = {
        all: khop.length,
        ChoVeKho: 0,
        ChoKiemDem: 0,
        ChoQuyetToan: 0,
        ChoThuThem: 0,
      };
      for (const o of khop) counts[o.stage] += 1;

      const loc = params.stage && params.stage !== "all" ? khop.filter((o) => o.stage === params.stage) : khop;
      // Việc Staff làm được ngay lên trước (kiểm đếm, quyết toán), đơn quá hạn lên trước trong cùng nhóm;
      // sort ổn định nên các đơn còn lại giữ thứ tự mới nhất trước.
      const hang = (o: ReturnOrderSummary) => RETURN_STAGES.indexOf(o.stage) * 2 + (o.trangThai === "Overdue" ? 0 : 1);
      const sorted = [...loc].sort((x, y) => hang(x) - hang(y));

      const pageSize = Math.min(50, Math.max(5, Math.trunc(params.pageSize ?? 10) || 10));
      const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      const page = Math.min(totalPages, Math.max(1, Math.trunc(params.page ?? 1) || 1));
      return {
        orders: sorted.slice((page - 1) * pageSize, page * pageSize),
        total: sorted.length,
        page,
        pageSize,
        totalPages,
        counts,
      };
    },

    async get(maDon) {
      const db = deps.getDb();
      await capNhatQuaHan(db, maDon);
      const row = await db.donHang.findFirst({ where: { maDon, loai: "Thue" }, include: includeOrder });
      return row ? toOrderView(row, now()) : null;
    },

    inspect: (input) =>
      guard(() =>
        deps.getDb().$transaction(async (tx) => {
          // Chặn hai lần bấm đồng thời cùng lập biên bản cho một dòng đơn.
          await lockResource(tx, `kd:${input.chiTietDonId}`);

          const order = await loadOrder(tx, input.maDon);
          const line = order.chiTiet.find((c) => c.id === input.chiTietDonId);
          if (!line) throw new ReturnError(404, "Không tìm thấy dòng sản phẩm trong đơn.");
          if (order.trangThai !== "Active" && order.trangThai !== "Overdue") {
            throw new ReturnError(409, "Chỉ kiểm đếm được khi đơn đang thuê hoặc quá hạn trả.");
          }
          const tra = traShipment(line);
          if (!tra || tra.trangThaiVanChuyen !== "DaLay") {
            throw new ReturnError(409, "Giao vận chưa lấy xong hàng trả nên chưa có hàng về kho để kiểm đếm.");
          }
          if (line.bienBan.length > 0) throw new ReturnError(409, "Sản phẩm này đã có biên bản kiểm đếm.");
          const maHop = line.maHop;
          if (!maHop) {
            throw new ReturnError(409, "Dòng đơn chưa ghi hộp game xuất kho (đơn bàn giao trước khi có cột mã hộp) — cần gán mã hộp trước.");
          }

          const checklist = toChecklist(line);
          const byId = new Map(checklist.map((c) => [c.id, c]));
          const reqById = new Map<string, InspectInput["items"][number]>();
          for (const it of input.items) {
            if (!byId.has(it.linhKienId)) throw new ReturnError(400, "Có linh kiện không thuộc checklist của sản phẩm.");
            if (it.ketQua !== "Du" && it.ketQua !== "Loi") throw new ReturnError(400, "Kết quả kiểm đếm không hợp lệ.");
            if (reqById.has(it.linhKienId)) throw new ReturnError(400, "Linh kiện bị kiểm đếm trùng.");
            reqById.set(it.linhKienId, it);
          }

          // UC-08 bước 2 / FR-KHO-01: PHẢI đánh dấu từng linh kiện của checklist — không mặc định "Đủ" cho món bị bỏ sót.
          const chuaDanhDau = checklist.filter((lk) => !reqById.has(lk.id));
          if (chuaDanhDau.length > 0) {
            throw new ReturnError(400, `Chưa đánh dấu kết quả cho: ${chuaDanhDau.map((lk) => lk.ten).join(", ")}.`);
          }

          const giaNiemYet = Number(line.giaNiemYetChot ?? line.sanPham.giaNiemYet);
          const items: MucKiemDem[] = checklist.map((lk) => {
            const req = reqById.get(lk.id);
            const ketQua: KetQuaKiemDem = req?.ketQua ?? "Du";
            return {
              linhKienId: lk.id,
              ten: lk.ten,
              docBan: lk.docBan,
              soLuong: lk.soLuong,
              ketQua,
              soLuongLoi: soLuongLoiHopLe(lk, ketQua, req?.soLuongLoi),
              donGiaDenBu: donGiaDenBu(giaNiemYet, lk),
            };
          });
          const coLoi = items.some((i) => i.ketQua === "Loi");

          // FR-KHO-02: hộp vật lý vừa nhận về phải đúng sản phẩm và đang Rented → Checking → Available/Damaged.
          const hop = await tx.hopGame.findUnique({
            where: { maHop: maHop },
            select: { sanPhamId: true, trangThai: true },
          });
          if (!hop) throw new ReturnError(404, `Không tìm thấy hộp game ${maHop}.`);
          if (hop.sanPhamId !== line.sanPhamId) {
            throw new ReturnError(400, `Hộp ${maHop} không phải hộp của sản phẩm "${line.sanPham.ten}".`);
          }
          // Staff có thể đã đẩy hộp sang Checking qua UC-09 trước khi lập biên bản: khi đó bỏ qua bước Rented → Checking.
          if (hop.trangThai !== "Checking") {
            const sangChecking = await doiTrangThaiHop(tx, maHop, "Checking");
            if (!sangChecking.ok) throw new ReturnError(sangChecking.status, sangChecking.error);
          }
          const trangThaiHop = coLoi ? "Damaged" : "Available";
          const ketThuc = await doiTrangThaiHop(tx, maHop, trangThaiHop);
          if (!ketThuc.ok) throw new ReturnError(ketThuc.status, ketThuc.error);

          // Người lập biên bản là nhân viên đang đăng nhập; chỉ khi gọi không qua phiên (seed/test) mới rơi về Staff đầu tiên.
          const staff = input.nhanVienId
            ? await tx.nhanVien.findFirst({ where: { id: input.nhanVienId, dangHoatDong: true }, select: { id: true } })
            : await tx.nhanVien.findFirst({
                where: { vaiTro: "Staff", dangHoatDong: true },
                orderBy: { email: "asc" },
                select: { id: true },
              });
          if (!staff) throw new ReturnError(409, "Chưa có tài khoản nhân viên nào để lập biên bản.");

          const bienBan: BienBanKiemDemJson = {
            maHop: maHop,
            items,
            ghiChuNgoai: (input.ghiChuNgoai ?? "").trim(),
            coLoi,
          };
          await tx.bienBanKiemDem.create({
            data: { chiTietDonId: line.id, nhanVienId: staff.id, ketQua: JSON.stringify(bienBan) },
          });
          return { ok: true as const, coLoi, trangThaiHop };
        }, TX_OPTIONS),
      ),

    settle: (maDon) =>
      guard(() =>
        deps.getDb().$transaction(async (tx) => {
          await lockResource(tx, `ht:${maDon}`);
          const nowDate = new Date(now());

          const order = await loadOrder(tx, maDon);
          if (order.trangThai !== "Active" && order.trangThai !== "Overdue") {
            throw new ReturnError(409, "Đơn không ở trạng thái đang thuê/quá hạn nên không thể quyết toán (có thể đã quyết toán).");
          }
          const lines = order.chiTiet.map((c) => toLineView(c));
          const { quyetToan, lyDo } = tinhChoDon(order, lines);
          if (!quyetToan) throw new ReturnError(409, lyDo ?? "Chưa đủ điều kiện quyết toán.");

          // Một câu UPDATE có điều kiện: hai Staff bấm xác nhận cùng lúc thì chỉ một người đi tiếp.
          const claimed = await tx.donHang.updateMany({
            where: { id: order.id, trangThai: { in: ["Active", "Overdue"] } },
            data: { trangThai: "Completed" },
          });
          if (claimed.count === 0) throw new ReturnError(409, "Đơn vừa được quyết toán bởi người khác.");

          const xuLy: PhieuQuyetToan["xuLy"] =
            quyetToan.soTienThuThem > 0 ? "ThuThem" : quyetToan.soTienHoan > 0 ? "HoanVi" : "HoanKhong";
          const phieu: PhieuQuyetToan = { ngay: ngayVietNam(nowDate), xuLy, quyetToan };

          await tx.datCoc.update({
            where: { donHangId: order.id },
            data: {
              trangThai: quyetToan.soTienHoan >= quyetToan.tongCocDaThu ? "Refunded" : "Partially_Refunded",
              ngayHoan: toDate(phieu.ngay),
              phieuQuyetToan: JSON.stringify(phieu),
            },
          });

          let maThanhToanThuThem: string | null = null;
          if (quyetToan.soTienThuThem > 0) {
            // UC-07 luồng ngoại lệ 4a: không trừ âm — thu phần còn thiếu qua QR (UC-10). Đơn ở Completed, chỉ
            // chuyển Closed khi webhook xác nhận khách đã trả (lib/payments/service.ts).
            maThanhToanThuThem = await taoQrThuThem(tx, order, quyetToan.soTienThuThem);
          } else {
            if (quyetToan.soTienHoan > 0) {
              const coc = order.thanhToan.find((t) => t.mucDich === "TienCoc");
              if (!coc) throw new ReturnError(409, "Không tìm thấy khoản thanh toán cọc của đơn để ghi sổ hoàn ví.");
              await creditWallet(tx, {
                email: order.khachHang.email,
                thanhToanId: coc.id,
                maGiaoDich: `HOANCOC-${maDon}`,
                soTien: quyetToan.soTienHoan,
                lyDo: `Hoàn cọc đơn ${maDon} sau quyết toán (BRU-06)`,
              });
            }
            await tx.donHang.update({ where: { id: order.id }, data: { trangThai: "Closed" } });
          }
          return { ok: true as const, quyetToan, xuLy, maThanhToanThuThem };
        }, TX_OPTIONS),
      ),

    collectAgain: (maDon) =>
      guard(() =>
        deps.getDb().$transaction(async (tx) => {
          await lockResource(tx, `ht:${maDon}`);
          const order = await loadOrder(tx, maDon);
          const phieu = parsePhieu(order.datCoc?.phieuQuyetToan);
          if (order.trangThai !== "Completed" || !phieu || phieu.quyetToan.soTienThuThem <= 0) {
            throw new ReturnError(409, "Đơn này không có khoản thu thêm đang chờ.");
          }
          await expirePending(tx, order.id);
          const hienTai = await tx.thanhToan.findMany({ where: { donHangId: order.id, mucDich: "ThuThem" } });
          if (hienTai.some((t) => t.trangThai === "DaThanhToan")) {
            throw new ReturnError(409, "Khoản thu thêm đã được thanh toán.");
          }
          const dangCho = hienTai.find((t) => t.trangThai === "ChoThanhToan");
          if (dangCho) return { ok: true as const, maThanhToan: dangCho.maThanhToan, soTien: Number(dangCho.soTien) };

          const soTien = phieu.quyetToan.soTienThuThem;
          return { ok: true as const, maThanhToan: await taoQrThuThem(tx, order, soTien), soTien };
        }, TX_OPTIONS),
      ),
  };
}
