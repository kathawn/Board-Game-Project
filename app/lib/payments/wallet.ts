import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { lockResource, type Tx } from "../db/tx";

/** BRU-06 (BR-16): Ví điện tử nội bộ — mỗi khách một ví (1-1), số dư tăng khi hệ thống hoàn tiền
 * (UC-10 luồng ngoại lệ 4a/7b) và giảm khi khách rút về ngân hàng (UC-20/FR-TTGV-09). Mỗi lần cộng/trừ ghi một
 * dòng sổ cái ButToanVi (cộng: số dương, rút: số âm); cặp (thanhToanId, maGiaoDich) là duy nhất nên cùng một giao
 * dịch không thể hoàn hai lần. */

export async function creditWallet(
  tx: Tx,
  input: { email: string; thanhToanId: string; maGiaoDich: string; soTien: number; lyDo: string },
): Promise<void> {
  // ERD ViDienTu: so_du >= 0 — số tiền hoàn phải dương, không ghi bút toán 0/âm.
  if (!(input.soTien > 0)) return;

  const khach = await tx.khachHang.findUnique({ where: { email: input.email }, select: { id: true } });
  if (!khach) throw new Error(`Không tìm thấy khách hàng ${input.email} để hoàn ví.`);

  const vi =
    (await tx.viDienTu.findUnique({ where: { khachHangId: khach.id } })) ??
    (await tx.viDienTu.create({ data: { khachHangId: khach.id, soDu: 0 } }));

  await tx.butToanVi.create({
    data: {
      viId: vi.id,
      soTien: input.soTien,
      lyDo: input.lyDo,
      thanhToanId: input.thanhToanId,
      maGiaoDich: input.maGiaoDich,
    },
  });
  await tx.viDienTu.update({ where: { id: vi.id }, data: { soDu: { increment: input.soTien } } });
}

export async function getWalletBalance(db: PrismaClient, email: string): Promise<number> {
  const vi = await db.viDienTu.findFirst({ where: { khachHang: { email } }, select: { soDu: true } });
  return vi ? Number(vi.soDu) : 0;
}

export const WALLET_PAGE_SIZE = 8;

export type NhomButToan = "coc" | "tien" | "rut";

const TIEN_TO_HOAN_COC = ["HUYDON-", "HOANCOC-"] as const;
const TIEN_TO_RUT = "RUT-";

/** Phân nhóm bút toán theo tiền tố mã giao dịch: hoàn cọc theo đơn (huỷ đơn Pending, quyết toán khi trả hàng),
 * rút tiền về ngân hàng (UC-20), hoặc hoàn tiền thanh toán đã thu nhưng không tạo được đơn (MOMO-..., BRU-07). */
export function nhomButToan(maGiaoDich: string | null): NhomButToan {
  if (maGiaoDich?.startsWith(TIEN_TO_RUT)) return "rut";
  return maGiaoDich && TIEN_TO_HOAN_COC.some((t) => maGiaoDich.startsWith(t)) ? "coc" : "tien";
}

export interface WalletEntry {
  id: string;
  /** Dương = tiền vào ví (hoàn), âm = tiền ra (rút về ngân hàng). */
  soTien: number;
  lyDo: string;
  maGiaoDich: string | null;
  /** ISO string — để JSON hoá qua API. */
  ngayTao: string;
}

export interface WalletLedger {
  soDu: number;
  /** Tổng tiền đã được hoàn vào ví (chỉ cộng bút toán dương, không phụ thuộc bộ lọc/trang). */
  tongHoan: number;
  rows: WalletEntry[];
  /** Số dòng khớp bộ lọc hiện tại (dùng cho phân trang). */
  total: number;
  page: number;
  totalPages: number;
  /** Số đếm từng nhóm (theo từ khoá tìm kiếm, không theo nhóm đang chọn) cho chip lọc. */
  dem: { all: number; coc: number; tien: number; rut: number };
}

export interface WalletQuery {
  page?: number;
  pageSize?: number;
  nhom?: NhomButToan;
  q?: string;
}

const orHoanCoc = () => TIEN_TO_HOAN_COC.map((t) => ({ maGiaoDich: { startsWith: t } }));

/** Điều kiện Prisma cho một truy vấn sổ cái: luôn giới hạn theo ví, tuỳ chọn nhóm và từ khoá (khớp lý do hoặc mã giao dịch). */
export function buildWalletWhere(viId: string, { nhom, q }: Pick<WalletQuery, "nhom" | "q">) {
  const and: object[] = [];
  const tuKhoa = q?.trim();
  if (tuKhoa) and.push({ OR: [{ lyDo: { contains: tuKhoa } }, { maGiaoDich: { contains: tuKhoa } }] });
  if (nhom === "coc") and.push({ OR: orHoanCoc() });
  if (nhom === "rut") and.push({ maGiaoDich: { startsWith: TIEN_TO_RUT } });
  if (nhom === "tien") {
    and.push({ OR: [{ maGiaoDich: null }, { NOT: { OR: [...orHoanCoc(), { maGiaoDich: { startsWith: TIEN_TO_RUT } }] } }] });
  }
  return and.length === 0 ? { viId } : { viId, AND: and };
}

/** Số dư + sổ cái ví của khách (BRU-06), mới nhất trước, tìm kiếm/lọc/phân trang phía server. `page` ngoài phạm vi thì kẹp về [1, totalPages]. */
export async function getWalletLedger(
  db: PrismaClient,
  email: string,
  { page = 1, pageSize = WALLET_PAGE_SIZE, nhom, q }: WalletQuery = {},
): Promise<WalletLedger> {
  const vi = await db.viDienTu.findFirst({ where: { khachHang: { email } }, select: { id: true, soDu: true } });
  if (!vi) {
    return { soDu: 0, tongHoan: 0, rows: [], total: 0, page: 1, totalPages: 1, dem: { all: 0, coc: 0, tien: 0, rut: 0 } };
  }

  const [tong, all, coc, tien, rut] = await Promise.all([
    db.butToanVi.aggregate({ where: { viId: vi.id, soTien: { gt: 0 } }, _sum: { soTien: true } }),
    db.butToanVi.count({ where: buildWalletWhere(vi.id, { q }) }),
    db.butToanVi.count({ where: buildWalletWhere(vi.id, { q, nhom: "coc" }) }),
    db.butToanVi.count({ where: buildWalletWhere(vi.id, { q, nhom: "tien" }) }),
    db.butToanVi.count({ where: buildWalletWhere(vi.id, { q, nhom: "rut" }) }),
  ]);
  const dem = { all, coc, tien, rut };
  const total = nhom ? dem[nhom] : dem.all;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), totalPages);

  const rows = await db.butToanVi.findMany({
    where: buildWalletWhere(vi.id, { q, nhom }),
    orderBy: [{ ngayTao: "desc" }, { id: "desc" }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  return {
    soDu: Number(vi.soDu),
    tongHoan: Number(tong._sum.soTien ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      soTien: Number(r.soTien),
      lyDo: r.lyDo,
      maGiaoDich: r.maGiaoDich,
      ngayTao: r.ngayTao.toISOString(),
    })),
    total,
    page: safePage,
    totalPages,
    dem,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// UC-20 / FR-TTGV-09: rút tiền từ ví nội bộ về tài khoản ngân hàng của khách. Chuyển tiền thật qua MoMo là giả lập
// (không gọi API thật) — hệ thống chỉ kiểm tra số dư, trừ ví và ghi sổ cái.

export interface RutTienInput {
  soTien: number;
  nganHang: string;
  soTaiKhoan: string;
  tenChuTaiKhoan: string;
  /** Mã do client sinh cho mỗi lần mở form rút tiền; gửi lại cùng mã (bấm đúp, retry) thì chỉ trừ ví một lần. */
  maYeuCau?: string;
}

/** Cột ViDienTu.soDu là Decimal(12,0) → số tiền rút không thể vượt giá trị này. */
const SO_TIEN_TOI_DA = 999_999_999_999;

/** Che số tài khoản khi ghi sổ/hiển thị: chỉ giữ 4 số cuối. */
export function maskTaiKhoan(soTaiKhoan: string): string {
  return `••••${soTaiKhoan.length > 4 ? soTaiKhoan.slice(-4) : ""}`;
}

/** Kiểm tra dữ liệu form rút tiền: số tiền là số nguyên dương (VND), thông tin tài khoản nhận đầy đủ. */
export function validateRutTien(raw: unknown): { ok: true; value: RutTienInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Dữ liệu không hợp lệ." };
  const r = raw as Record<string, unknown>;

  const soTien = typeof r.soTien === "number" ? r.soTien : Number.NaN;
  if (!Number.isSafeInteger(soTien) || soTien <= 0 || soTien > SO_TIEN_TOI_DA) {
    return { ok: false, error: "Số tiền rút phải là số nguyên dương (đồng) trong giới hạn cho phép." };
  }

  const nganHang = typeof r.nganHang === "string" ? r.nganHang.trim() : "";
  if (!nganHang) return { ok: false, error: "Vui lòng nhập tên ngân hàng nhận." };
  if (nganHang.length > 100) return { ok: false, error: "Tên ngân hàng quá dài (tối đa 100 ký tự)." };

  const soTaiKhoan = typeof r.soTaiKhoan === "string" ? r.soTaiKhoan.trim() : "";
  if (!/^\d{6,20}$/.test(soTaiKhoan)) return { ok: false, error: "Số tài khoản phải gồm 6–20 chữ số." };

  const tenChuTaiKhoan = typeof r.tenChuTaiKhoan === "string" ? r.tenChuTaiKhoan.trim() : "";
  if (!tenChuTaiKhoan) return { ok: false, error: "Vui lòng nhập tên chủ tài khoản." };
  if (tenChuTaiKhoan.length > 100) return { ok: false, error: "Tên chủ tài khoản quá dài (tối đa 100 ký tự)." };

  const value: RutTienInput = { soTien, nganHang, soTaiKhoan, tenChuTaiKhoan };
  if (r.maYeuCau !== undefined) {
    if (typeof r.maYeuCau !== "string" || !/^[A-Za-z0-9-]{8,40}$/.test(r.maYeuCau)) {
      return { ok: false, error: "Mã yêu cầu không hợp lệ." };
    }
    value.maYeuCau = r.maYeuCau;
  }
  return { ok: true, value };
}

export type RutTienResult =
  | { ok: true; soDuMoi: number; maGiaoDich: string }
  | { ok: false; status: 409; error: string };

/** Trừ ví và ghi bút toán âm trong MỘT transaction. Trừ bằng UPDATE có điều kiện `soDu >= soTien` nên hai yêu cầu rút
 * đồng thời không thể cùng lấy hết một số dư (và ràng buộc CHECK soDu >= 0 của DB là lớp chặn cuối).
 * - Theo quyết định của chủ dự án, khách được rút về bất kỳ tài khoản ngân hàng nào (không ràng buộc tên chủ tài khoản).
 * - Chống gửi trùng: khoá ứng dụng theo ví rồi tìm bút toán cùng mã yêu cầu; có rồi thì trả lại kết quả cũ, không trừ lần hai. */
export async function rutTienVi(db: PrismaClient, email: string, input: RutTienInput): Promise<RutTienResult> {
  const khongDu: RutTienResult = { ok: false, status: 409, error: "Số dư ví không đủ để rút số tiền này." };

  return db.$transaction(async (tx: Tx) => {
    const vi = await tx.viDienTu.findFirst({ where: { khachHang: { email } }, select: { id: true } });
    if (!vi) return khongDu;

    const maGiaoDich = `${TIEN_TO_RUT}${input.maYeuCau ?? randomUUID().slice(0, 8).toUpperCase()}`;
    if (input.maYeuCau) {
      await lockResource(tx, `vi:${vi.id}`);
      const daGhi = await tx.butToanVi.findFirst({ where: { viId: vi.id, maGiaoDich }, select: { id: true } });
      if (daGhi) {
        const hienTai = await tx.viDienTu.findUniqueOrThrow({ where: { id: vi.id }, select: { soDu: true } });
        return { ok: true as const, soDuMoi: Number(hienTai.soDu), maGiaoDich };
      }
    }

    const updated = await tx.viDienTu.updateMany({
      where: { id: vi.id, soDu: { gte: input.soTien } },
      data: { soDu: { decrement: input.soTien } },
    });
    if (updated.count === 0) return khongDu;

    await tx.butToanVi.create({
      data: {
        viId: vi.id,
        soTien: -input.soTien,
        lyDo: `Rút tiền về ${input.nganHang} ${maskTaiKhoan(input.soTaiKhoan)} (${input.tenChuTaiKhoan})`,
        maGiaoDich,
      },
    });
    const sau = await tx.viDienTu.findUniqueOrThrow({ where: { id: vi.id }, select: { soDu: true } });
    return { ok: true as const, soDuMoi: Number(sau.soDu), maGiaoDich };
  });
}
