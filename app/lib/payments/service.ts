import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { lockResource, nextSequence, toDate, TRANG_THAI_DANG_GIU, type Tx } from "../db/tx";
import type { RentalOrder, RentalOrderLine } from "../rentals/order-store";
import type { RentalCartStore } from "../rentals/store";
import { tinhPhiShip, uocTinhKhoangCachKm } from "../rentals/deposit";
import { creditWallet } from "./wallet";

/** UC-10 (FR-TTGV-06/07, BR-10, BRU-06, BRU-07): thanh toán tiền cọc đơn thuê qua mã QR, xác nhận
 * bằng webhook. Lưu ở bảng ThanhToan (SQL Server).
 *
 * Phạm vi: mới phục vụ mục đích "TienCoc" của đơn thuê. "TienHang" (UC-03) và "ThuThem" (UC-07)
 * dùng chung kiểu dữ liệu nhưng chưa có luồng gọi vào. */

export type MucDichThanhToan = "TienHang" | "TienCoc" | "ThuThem";
/** Đúng 3 giá trị của ENUM trang_thai trong ERD (SRS 3.5). */
export type TrangThaiThanhToan = "ChoThanhToan" | "DaThanhToan" | "HetHieuLuc";
/** Kết quả nghiệp vụ gắn thêm để giao diện biết hiển thị màn hình nào — không có trong ERD:
 * ThatBai = UC-10 3b; HetHang = UC-10 4a/7b (BRU-07: thua race, đã hoàn ví); MotPhanHetHang = giỏ
 * nhiều sản phẩm, chỉ một phần bị người khác chiếm trước; HoanQuaHan = tiền về sau khi QR hết hạn;
 * SaiSoTien = số tiền MoMo thu khác số cần thu. */
export type KetQuaThanhToan =
  | "ThanhCong"
  | "MotPhanHetHang"
  | "HetHang"
  | "ThatBai"
  | "HoanQuaHan"
  | "SaiSoTien";

export const THOI_HAN_QR_MS = 15 * 60 * 1000;

export interface PaymentLine extends RentalOrderLine {
  /** id dòng trong giỏ thuê, để gỡ khỏi giỏ khi khoản thanh toán đã được xử lý. */
  cartLineId: string;
}

export interface Payment {
  id: string;
  email: string;
  mucDich: MucDichThanhToan;
  soTien: number;
  trangThai: TrangThaiThanhToan;
  ketQua: KetQuaThanhToan | null;
  maQr: string;
  taoLuc: number;
  hetHanLuc: number;
  /** Snapshot giỏ thuê tại lúc sinh QR — giá/cọc được chốt ở đây, webhook không tính lại. */
  diaChiNhan: string;
  doiTac: RentalOrder["doiTac"];
  lines: PaymentLine[];
  orderId: string | null;
  soTienHoan: number;
  dongHetHang: string[];
}

export type WebhookInput = { paymentId: string; transactionId: string; amount: number; resultCode: number };

export type WebhookResult =
  | { ok: true; duplicate: boolean; payment: Payment }
  | { ok: false; status: 404 | 409; error: string };

export interface PaymentService {
  createRentalDeposit(input: {
    email: string;
    diaChiNhan: string;
    doiTac: RentalOrder["doiTac"];
    lines: PaymentLine[];
  }): Promise<Payment>;
  get(id: string): Promise<Payment | undefined>;
  applyWebhook(input: WebhookInput): Promise<WebhookResult>;
  /** Chỉ dùng cho trang giả lập MoMo: ép khoản thanh toán hết hạn ngay (mô phỏng "15 phút trôi qua"). */
  expireNow(id: string): Promise<Payment | undefined>;
}

const include = {
  khachHang: { select: { email: true } },
  donHang: { select: { maDon: true } },
} satisfies Prisma.ThanhToanInclude;

type Row = Prisma.ThanhToanGetPayload<{ include: typeof include }>;

interface SnapshotJson {
  lines: PaymentLine[];
  diaChiNhan: string;
  doiTac: RentalOrder["doiTac"];
  dongHetHang: string[];
}

function parseSnapshot(raw: string): SnapshotJson {
  const parsed = JSON.parse(raw) as SnapshotJson | PaymentLine[];
  // Dữ liệu seed lưu "[]" (không có giỏ) — chấp nhận cả dạng mảng.
  if (Array.isArray(parsed)) return { lines: parsed, diaChiNhan: "", doiTac: "GreenSM", dongHetHang: [] };
  return { lines: parsed.lines ?? [], diaChiNhan: parsed.diaChiNhan ?? "", doiTac: parsed.doiTac ?? "GreenSM", dongHetHang: parsed.dongHetHang ?? [] };
}

function toPayment(row: Row): Payment {
  const snap = parseSnapshot(row.snapshot);
  return {
    id: row.maThanhToan,
    email: row.khachHang.email,
    mucDich: row.mucDich as MucDichThanhToan,
    soTien: Number(row.soTien),
    trangThai: row.trangThai as TrangThaiThanhToan,
    ketQua: (row.ketQua as KetQuaThanhToan | null) ?? null,
    maQr: row.maQR ?? "",
    taoLuc: row.taoLuc.getTime(),
    hetHanLuc: row.hetHanLuc.getTime(),
    diaChiNhan: snap.diaChiNhan,
    doiTac: snap.doiTac,
    lines: snap.lines,
    orderId: row.donHang?.maDon ?? null,
    soTienHoan: Number(row.soTienHoan),
    dongHetHang: snap.dongHetHang,
  };
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function createPaymentService(deps: {
  getDb: () => PrismaClient;
  rentalCart: () => RentalCartStore;
  now?: () => number;
}): PaymentService {
  const now = deps.now ?? Date.now;

  /** UC-10 3a: hết hạn tính lười (lazy) tại thời điểm đọc/nhận webhook, không cần job nền. */
  async function expireIfDue(db: PrismaClient | Tx, id?: string): Promise<void> {
    await db.thanhToan.updateMany({
      where: { ...(id ? { maThanhToan: id } : {}), trangThai: "ChoThanhToan", hetHanLuc: { lte: new Date(now()) } },
      data: { trangThai: "HetHieuLuc" },
    });
  }

  return {
    async createRentalDeposit({ email, diaChiNhan, doiTac, lines }) {
      const db = deps.getDb();
      const khach = await db.khachHang.findUnique({ where: { email }, select: { id: true } });
      if (!khach) throw new Error(`Không tìm thấy khách hàng ${email}.`);

      // KHÔNG vô hiệu hoá QR cũ của khách khi sinh QR mới: QR cũ có thể đã được quét và webhook đang
      // trên đường về — huỷ nó sẽ thành "mất tiền, không có đơn". Nếu hai QR cùng được trả cho một
      // giỏ, kiểm tra BRU-07 ở applyWebhook đảm bảo QR về sau thua và được hoàn tiền vào ví.
      const id = `PAY-${String(await nextSequence(db, "seq_mathanhtoan")).padStart(5, "0")}`;
      const soTien = lines.reduce((sum, l) => sum + l.tienCoc, 0);
      const taoLuc = now();
      const snapshot: SnapshotJson = { lines, diaChiNhan, doiTac, dongHetHang: [] };

      const row = await db.thanhToan.create({
        data: {
          maThanhToan: id,
          khachHangId: khach.id,
          soTien,
          mucDich: "TienCoc",
          trangThai: "ChoThanhToan",
          maQR: `momo://pay?orderId=${id}&amount=${soTien}`,
          taoLuc: new Date(taoLuc),
          hetHanLuc: new Date(taoLuc + THOI_HAN_QR_MS),
          snapshot: JSON.stringify(snapshot),
        },
        include,
      });
      return toPayment(row);
    },

    async get(id) {
      const db = deps.getDb();
      await expireIfDue(db, id);
      const row = await db.thanhToan.findUnique({ where: { maThanhToan: id }, include });
      return row ? toPayment(row) : undefined;
    },

    async expireNow(id) {
      const db = deps.getDb();
      await db.thanhToan.updateMany({
        where: { maThanhToan: id, trangThai: "ChoThanhToan" },
        data: { trangThai: "HetHieuLuc" },
      });
      const row = await db.thanhToan.findUnique({ where: { maThanhToan: id }, include });
      return row ? toPayment(row) : undefined;
    },

    async applyWebhook({ paymentId, transactionId, amount, resultCode }) {
      const db = deps.getDb();

      const result = await db.$transaction(
        async (tx): Promise<WebhookResult> => {
          // Xếp hàng mọi webhook của CÙNG một khoản thanh toán: hai lần gửi lặp song song không thể
          // cùng đi qua bước kiểm tra idempotency bên dưới.
          await lockResource(tx, `pay:${paymentId}`);

          await expireIfDue(tx, paymentId);
          const row = await tx.thanhToan.findUnique({ where: { maThanhToan: paymentId }, include });
          if (!row) return { ok: false, status: 404, error: "Không tìm thấy khoản thanh toán." };

          // Idempotency (theo transactionId, ở mọi trạng thái): MoMo retry cùng một giao dịch → trả
          // lại kết quả cũ, tuyệt đối không tạo thêm đơn / hoàn tiền thêm lần nữa.
          const seen = await tx.giaoDichThanhToan.findUnique({
            where: { thanhToanId_maGiaoDich: { thanhToanId: row.id, maGiaoDich: transactionId } },
          });
          if (seen) return { ok: true, duplicate: true, payment: toPayment(row) };
          await tx.giaoDichThanhToan.create({
            data: { thanhToanId: row.id, maGiaoDich: transactionId, soTien: amount, ketQuaMa: resultCode },
          });

          // UC-10 3b: thất bại → giữ nguyên khoản, không tạo đơn. Trả 200 (không 409) kể cả khi khoản
          // đã hết hạn/đã thanh toán, để MoMo không retry mãi một thông báo vô hại.
          if (resultCode !== 0) {
            if (row.trangThai === "ChoThanhToan") {
              await tx.thanhToan.update({ where: { id: row.id }, data: { ketQua: "ThatBai" } });
            }
            const after = await tx.thanhToan.findUniqueOrThrow({ where: { id: row.id }, include });
            return { ok: true, duplicate: false, payment: toPayment(after) };
          }

          // Từ đây là webhook THÀNH CÔNG, tức MoMo đã thu tiền thật của khách: mọi nhánh không tạo
          // được đơn đều phải hoàn tiền vào ví nội bộ (BR-10/BRU-06) — không được nuốt tiền.
          const email = row.khachHang.email;
          const hoanVi = (soTien: number, lyDo: string) =>
            creditWallet(tx, { email, thanhToanId: row.id, maGiaoDich: transactionId, soTien, lyDo });
          const reload = async (): Promise<WebhookResult> => ({
            ok: true,
            duplicate: false,
            payment: toPayment(await tx.thanhToan.findUniqueOrThrow({ where: { id: row.id }, include })),
          });

          // Thu lần thứ hai trên cùng khoản đã thanh toán (khách quét QR hai lần): lần đầu đã được xử
          // lý, lần này là tiền thừa → hoàn toàn bộ.
          if (row.trangThai === "DaThanhToan") {
            await hoanVi(amount, `Hoàn khoản thu trùng cho ${paymentId}`);
            return { ok: true, duplicate: true, payment: toPayment(row) };
          }

          // UC-10 3a nhưng tiền vẫn về (khách quét sát giờ, hoặc MoMo gửi webhook trễ): QR đã hết hiệu
          // lực nên không xác nhận đơn, hoàn nguyên số tiền đã thu.
          if (row.trangThai === "HetHieuLuc") {
            await hoanVi(amount, `Hoàn tiền: ${paymentId} đã hết hiệu lực khi tiền về`);
            await tx.thanhToan.update({ where: { id: row.id }, data: { ketQua: "HoanQuaHan", soTienHoan: amount } });
            return reload();
          }

          // FR-TTGV-06: QR gắn đúng số tiền cần thu — thu thiếu/thừa thì không xác nhận (không giao
          // hàng thuê sau khi mới trả một phần), hoàn đúng số đã thu.
          if (amount !== Number(row.soTien)) {
            await hoanVi(amount, `Hoàn tiền: số tiền thu (${amount}) khác số cần thu (${Number(row.soTien)}) của ${paymentId}`);
            await tx.thanhToan.update({ where: { id: row.id }, data: { ketQua: "SaiSoTien", soTienHoan: amount } });
            return reload();
          }

          // ---- BRU-07: ưu tiên theo thời điểm thanh toán thành công ----
          // Khoá theo từng sản phẩm (sắp xếp cố định để không deadlock): webhook nào lấy được khoá trước
          // thì kiểm tra "còn khả dụng?" và ghi đơn xong, rồi webhook sau mới thấy trùng lịch và bị
          // hoàn tiền. Khoá giữ đến hết transaction nên không có khoảng hở giữa kiểm tra và ghi.
          const snap = parseSnapshot(row.snapshot);
          const slugs = [...new Set(snap.lines.map((l) => l.productSlug))].sort();
          for (const slug of slugs) await lockResource(tx, `sp:${slug}`);

          const conLai: PaymentLine[] = [];
          const hetHang: PaymentLine[] = [];
          for (const line of snap.lines) {
            const biChiem =
              (await tx.chiTietDonHang.findFirst({
                where: {
                  sanPham: { slug: line.productSlug },
                  ngayBatDau: { lte: toDate(line.endDate) },
                  ngayKetThuc: { gte: toDate(line.startDate) },
                  donHang: { loai: "Thue", trangThai: { in: TRANG_THAI_DANG_GIU } },
                },
                select: { id: true },
              })) !== null ||
              // Cũng so với các dòng cùng khoản đã nhận trước đó: giỏ không cho phép hai dòng trùng lịch
              // cùng sản phẩm, nhưng đây là điểm cuối trước khi ghi đơn nên kiểm lại.
              conLai.some(
                (a) =>
                  a.productSlug === line.productSlug &&
                  rangesOverlap(line.startDate, line.endDate, a.startDate, a.endDate),
              );
            (biChiem ? hetHang : conLai).push(line);
          }

          let donHangId: string | null = null;
          if (conLai.length > 0) {
            const sanPham = await tx.sanPham.findMany({
              where: { slug: { in: conLai.map((l) => l.productSlug) } },
              select: { id: true, slug: true },
            });
            const idOf = new Map(sanPham.map((s) => [s.slug, s.id]));
            const tongTienCoc = conLai.reduce((sum, l) => sum + l.tienCoc, 0);
            const phiShipNhan = tinhPhiShip(uocTinhKhoangCachKm(snap.diaChiNhan)).phiShip;

            const maDon = `DT-${String(await nextSequence(tx, "seq_madon_thue")).padStart(5, "0")}`;
            const order = await tx.donHang.create({
              data: {
                maDon,
                khachHangId: row.khachHangId,
                loai: "Thue",
                trangThai: "Pending",
                chiTiet: {
                  create: conLai.map((l) => ({
                    sanPhamId: idOf.get(l.productSlug)!,
                    soLuong: 1,
                    ngayBatDau: toDate(l.startDate),
                    ngayKetThuc: toDate(l.endDate),
                    tienThue: l.tienThue,
                    tienCoc: l.tienCoc,
                    donGia: l.tienThue,
                    diaChiNhan: snap.diaChiNhan,
                  })),
                },
                datCoc: { create: { soTien: tongTienCoc, phiShipGiu: phiShipNhan * 2 * conLai.length, trangThai: "Held" } },
              },
              select: { id: true },
            });
            donHangId = order.id;
          }

          let soTienHoan = 0;
          if (hetHang.length > 0) {
            // UC-10 4a / UC-04 7b: hoàn đúng phần cọc của những sản phẩm bị chiếm trước vào ví nội bộ.
            soTienHoan = hetHang.reduce((sum, l) => sum + l.tienCoc, 0);
            await hoanVi(
              soTienHoan,
              `Hoàn cọc ${hetHang.map((l) => l.productName).join(", ")} — đã có khách khác thanh toán trước (BRU-07)`,
            );
          }

          const ketQua: KetQuaThanhToan =
            conLai.length === 0 ? "HetHang" : hetHang.length > 0 ? "MotPhanHetHang" : "ThanhCong";
          const nextSnapshot: SnapshotJson = { ...snap, dongHetHang: hetHang.map((l) => l.productName) };
          await tx.thanhToan.update({
            where: { id: row.id },
            data: {
              trangThai: "DaThanhToan",
              ketQua,
              donHangId,
              soTienHoan,
              snapshot: JSON.stringify(nextSnapshot),
            },
          });
          return reload();
        },
        { maxWait: 15_000, timeout: 30_000 },
      );

      // Giỏ thuê đã được khoản thanh toán này "tiêu thụ" (kể cả phần thua race). Chỉ gỡ dòng còn đúng như
      // lúc chụp snapshot — nếu khách đã sửa ngày dòng đó trong lúc chờ thanh toán, lựa chọn mới của họ
      // không được xoá nhầm. Giỏ nằm ngoài DB nên làm sau khi transaction đã commit.
      if (result.ok && !result.duplicate && result.payment.trangThai === "DaThanhToan") {
        const cart = deps.rentalCart();
        const hienTai = await cart.list(result.payment.email);
        for (const line of result.payment.lines) {
          const trongGio = hienTai.find((l) => l.id === line.cartLineId);
          if (trongGio && trongGio.startDate === line.startDate && trongGio.endDate === line.endDate) {
            await cart.removeLine(result.payment.email, line.cartLineId);
          }
        }
      }
      return result;
    },
  };
}
