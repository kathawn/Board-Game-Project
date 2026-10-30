import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { lockResource, nextSequence, toDate, TRANG_THAI_DANG_GIU, type Tx } from "../db/tx";
import type { RentalOrder, RentalOrderLine } from "../rentals/order-store";
import type { RentalCartStore } from "../rentals/store";
import type { CartStore } from "../cart/store";
import { tinhPhiShip, uocTinhKhoangCachKm } from "../rentals/deposit";
import { creditWallet } from "./wallet";
import { demHopCoTheBan } from "../cart/inventory";

/** UC-10 (FR-TTGV-06/07, BR-10, BRU-06, BRU-07): thanh toán tiền cọc đơn thuê qua mã QR, xác nhận
 * bằng webhook. Lưu ở bảng ThanhToan (SQL Server).
 *
 * Phạm vi: "TienCoc" (đơn thuê, UC-04), "TienHang" (đơn mua, UC-03) và "ThuThem" (UC-07). */

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

/** Một dòng đơn mua trong snapshot khoản thanh toán (UC-03): giá/số lượng được chốt lúc sinh QR. */
export interface MuaLine {
  productSlug: string;
  productName: string;
  soLuong: number;
  /** Đơn giá niêm yết tại lúc sinh QR (thành tiền = donGia × soLuong). */
  donGia: number;
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
  /** UC-03: các dòng của khoản "TienHang" (rỗng với khoản cọc/thu thêm). */
  muaLines: MuaLine[];
  /** UC-03: phí ship (FR-TTGV-02) đã cộng vào số tiền cần thu của khoản "TienHang". */
  phiShip: number;
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
  /** UC-03 bước 5: sinh QR thu TIỀN HÀNG + phí ship cho các dòng giỏ mua đã chọn. */
  createPurchase(input: {
    email: string;
    diaChiNhan: string;
    doiTac: RentalOrder["doiTac"];
    phiShip: number;
    lines: MuaLine[];
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
  muaLines?: MuaLine[];
  phiShip?: number;
}

function parseSnapshot(raw: string): SnapshotJson {
  const parsed = JSON.parse(raw) as SnapshotJson | PaymentLine[];
  // Dữ liệu seed lưu "[]" (không có giỏ) — chấp nhận cả dạng mảng.
  if (Array.isArray(parsed)) return { lines: parsed, diaChiNhan: "", doiTac: "GreenSM", dongHetHang: [], muaLines: [], phiShip: 0 };
  return {
    lines: parsed.lines ?? [],
    diaChiNhan: parsed.diaChiNhan ?? "",
    doiTac: parsed.doiTac ?? "GreenSM",
    dongHetHang: parsed.dongHetHang ?? [],
    muaLines: parsed.muaLines ?? [],
    phiShip: parsed.phiShip ?? 0,
  };
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
    muaLines: snap.muaLines ?? [],
    phiShip: snap.phiShip ?? 0,
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
  /** Giỏ mua (UC-03): các dòng đã được thanh toán thành công sẽ được gỡ khỏi giỏ. */
  purchaseCart: () => CartStore;
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

  // KHÔNG vô hiệu hoá QR cũ của khách khi sinh QR mới: QR cũ có thể đã được quét và webhook đang
  // trên đường về — huỷ nó sẽ thành "mất tiền, không có đơn". Với đơn THUÊ, nếu hai QR cùng được trả cho một
  // giỏ thì kiểm tra trùng lịch (BRU-07) ở applyWebhook làm QR về sau thua và được hoàn ví. Với đơn MUA thì
  // kiểm tra tồn kho KHÔNG chặn được việc mua hai lần khi kho còn dư, nên createPurchase tái sử dụng QR đang
  // chờ có cùng nội dung thay vì sinh QR thứ hai (bấm đúp / F5 không tạo hai khoản thu).
  async function taoKhoanThanhToan(input: {
    email: string;
    mucDich: MucDichThanhToan;
    soTien: number;
    snapshot: SnapshotJson;
  }): Promise<Payment> {
    const db = deps.getDb();
    const khach = await db.khachHang.findUnique({ where: { email: input.email }, select: { id: true } });
    if (!khach) throw new Error(`Không tìm thấy khách hàng ${input.email}.`);

    const id = `PAY-${String(await nextSequence(db, "seq_mathanhtoan")).padStart(5, "0")}`;
    const taoLuc = now();
    const row = await db.thanhToan.create({
      data: {
        maThanhToan: id,
        khachHangId: khach.id,
        soTien: input.soTien,
        mucDich: input.mucDich,
        trangThai: "ChoThanhToan",
        maQR: `momo://pay?orderId=${id}&amount=${input.soTien}`,
        taoLuc: new Date(taoLuc),
        hetHanLuc: new Date(taoLuc + THOI_HAN_QR_MS),
        snapshot: JSON.stringify(input.snapshot),
      },
      include,
    });
    return toPayment(row);
  }

  return {
    async createRentalDeposit({ email, diaChiNhan, doiTac, lines }) {
      return taoKhoanThanhToan({
        email,
        mucDich: "TienCoc",
        soTien: lines.reduce((sum, l) => sum + l.tienCoc, 0),
        snapshot: { lines, diaChiNhan, doiTac, dongHetHang: [] },
      });
    },

    async createPurchase({ email, diaChiNhan, doiTac, phiShip, lines }) {
      // Tái sử dụng khoản TienHang còn hiệu lực có cùng nội dung (cùng sản phẩm/số lượng/đơn giá/ship/địa chỉ).
      const khoaNoiDung = (ls: MuaLine[], ship: number, diaChi: string) =>
        JSON.stringify({ l: ls.map((x) => [x.productSlug, x.soLuong, x.donGia]).sort(), ship, diaChi });
      const dangCho = await deps.getDb().thanhToan.findMany({
        where: {
          khachHang: { email },
          mucDich: "TienHang",
          trangThai: "ChoThanhToan",
          hetHanLuc: { gt: new Date(now()) },
        },
        include,
      });
      const khoa = khoaNoiDung(lines, phiShip, diaChiNhan);
      for (const r of dangCho) {
        const sn = parseSnapshot(r.snapshot);
        if (khoaNoiDung(sn.muaLines ?? [], sn.phiShip ?? 0, sn.diaChiNhan) === khoa) return toPayment(r);
      }

      // UC-03 bước 4: tổng cần thu = tiền hàng + phí ship (một chiều giao, FR-TTGV-02).
      const tienHang = lines.reduce((sum, l) => sum + l.donGia * l.soLuong, 0);
      return taoKhoanThanhToan({
        email,
        mucDich: "TienHang",
        soTien: tienHang + phiShip,
        snapshot: { lines: [], diaChiNhan, doiTac, dongHetHang: [], muaLines: lines, phiShip },
      });
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

          // UC-07 / UC-10: khoản THU THÊM khi quyết toán hoàn cọc — khách đã trả phần còn thiếu, nên đóng đơn
          // (Completed → Closed). Không có giỏ/tồn kho để kiểm tra nên không qua BRU-07.
          if (row.mucDich === "ThuThem") {
            // Cùng khoá với settle/collectAgain (lib/rentals/returns.ts) để không xen kẽ với việc sinh QR mới.
            if (row.donHang) await lockResource(tx, `ht:${row.donHang.maDon}`);

            const daTraKhoanKhac = row.donHangId
              ? await tx.thanhToan.findFirst({
                  where: { donHangId: row.donHangId, mucDich: "ThuThem", trangThai: "DaThanhToan", id: { not: row.id } },
                  select: { id: true },
                })
              : null;
            const don = row.donHangId
              ? await tx.donHang.findUnique({ where: { id: row.donHangId }, select: { trangThai: true } })
              : null;
            // Khoản nợ đã được trả bởi QR khác (hoặc đơn không còn ở Completed): tiền này là tiền thừa → hoàn ví,
            // tuyệt đối không để khách trả nợ hai lần mà không được hoàn.
            if (daTraKhoanKhac || !don || don.trangThai !== "Completed") {
              await hoanVi(amount, `Hoàn khoản thu thêm trùng cho ${paymentId} (nợ đã được thanh toán)`);
              await tx.thanhToan.update({
                where: { id: row.id },
                data: { trangThai: "DaThanhToan", ketQua: "HoanQuaHan", soTienHoan: amount },
              });
              return reload();
            }

            await tx.thanhToan.update({ where: { id: row.id }, data: { trangThai: "DaThanhToan", ketQua: "ThanhCong" } });
            await tx.donHang.updateMany({ where: { id: row.donHangId!, trangThai: "Completed" }, data: { trangThai: "Closed" } });
            return reload();
          }

          // UC-03 bước 6: khoản TIỀN HÀNG của đơn mua. Cùng nguyên tắc BRU-07 như đơn thuê (ai thanh toán
          // thành công trước thì được hàng): kiểm tra tồn kho THẬT (số hộp Available) dưới khoá theo sản phẩm,
          // dòng nào đủ hàng thì chốt đơn "bán" Confirmed và chuyển đúng số hộp sang Sold; dòng hết hàng thì
          // hoàn tiền vào ví nội bộ (kèm phí ship nếu không còn dòng nào để giao).
          if (row.mucDich === "TienHang") {
            const snapMua = parseSnapshot(row.snapshot);
            const dongMua = snapMua.muaLines ?? [];
            const slugsMua = [...new Set(dongMua.map((l) => l.productSlug))].sort();
            for (const slug of slugsMua) await lockResource(tx, `sp:${slug}`);

            const spMua = await tx.sanPham.findMany({
              where: { slug: { in: slugsMua } },
              select: { id: true, slug: true },
            });
            const idCuaSp = new Map(spMua.map((s) => [s.slug, s.id]));

            // Tồn kho "có thể bán" = hộp Available trừ các dòng đơn thuê đang chờ bàn giao (xem demHopCoTheBan) — không
            // bán nốt hộp mà một đơn thuê đã trả cọc cần để xuất kho (UC-06). Chiếm hộp ngay trong vòng lặp và đọc lại
            // tồn kho cho dòng kế tiếp, nên hai dòng cùng sản phẩm không thể cùng lấy một hộp.
            const duHang: { line: MuaLine; hops: { id: string; maHop: string }[] }[] = [];
            const khongDuHang: MuaLine[] = [];
            for (const line of dongMua) {
              const spId = idCuaSp.get(line.productSlug);
              const conBan = spId ? ((await demHopCoTheBan(tx, [line.productSlug])).get(line.productSlug) ?? 0) : 0;
              // Chỉ bán TRỌN số lượng đã chọn, không bán một phần (cùng quy tắc với bước checkout).
              const hops =
                spId && conBan >= line.soLuong
                  ? await tx.hopGame.findMany({
                      where: { sanPhamId: spId, trangThai: "Available" },
                      select: { id: true, maHop: true },
                      orderBy: { maHop: "asc" },
                      take: line.soLuong,
                    })
                  : [];
              if (hops.length < line.soLuong) {
                khongDuHang.push(line);
                continue;
              }
              // Chiếm từng hộp bằng UPDATE có điều kiện. Nếu có hộp bị đổi trạng thái ngoài dự kiến thì trả lại đúng
              // những hộp ĐÃ chiếm và coi dòng này hết hàng (hoàn ví) — không ném lỗi, để tiền MoMo đã thu không bao
              // giờ rơi vào trạng thái "không có đơn, không có hoàn".
              const daChiem: typeof hops = [];
              for (const h of hops) {
                const moved = await tx.hopGame.updateMany({ where: { id: h.id, trangThai: "Available" }, data: { trangThai: "Sold" } });
                if (moved.count === 1) daChiem.push(h);
              }
              if (daChiem.length < line.soLuong) {
                if (daChiem.length > 0) {
                  await tx.hopGame.updateMany({ where: { id: { in: daChiem.map((h) => h.id) }, trangThai: "Sold" }, data: { trangThai: "Available" } });
                }
                khongDuHang.push(line);
                continue;
              }
              duHang.push({ line, hops: daChiem });
            }

            let donMuaId: string | null = null;
            if (duHang.length > 0) {
              const maDon = `DH-${String(await nextSequence(tx, "seq_madon_ban")).padStart(5, "0")}`;
              const don = await tx.donHang.create({
                data: {
                  maDon,
                  khachHangId: row.khachHangId,
                  loai: "Ban",
                  trangThai: "Confirmed",
                  chiTiet: {
                    create: duHang.map(({ line, hops }) => ({
                      sanPhamId: idCuaSp.get(line.productSlug)!,
                      soLuong: line.soLuong,
                      donGia: line.donGia * line.soLuong,
                      diaChiNhan: snapMua.diaChiNhan,
                      // Ghi đúng các hộp đã bán (truy vết/bảo hành): với đơn mua một dòng có thể nhiều hộp nên lưu danh sách.
                      maHop: hops.map((h) => h.maHop).join(", "),
                    })),
                  },
                },
                select: { id: true },
              });
              donMuaId = don.id;
            }

            let tienHoan = khongDuHang.reduce((sum, l) => sum + l.donGia * l.soLuong, 0);
            if (duHang.length === 0) tienHoan += snapMua.phiShip ?? 0; // không còn gì để giao → hoàn cả phí ship
            if (tienHoan > 0) {
              await hoanVi(
                tienHoan,
                `Hoàn tiền ${khongDuHang.map((l) => l.productName).join(", ") || "đơn mua"} — hết hàng khi thanh toán thành công (BRU-07)`,
              );
            }

            const ketQuaMua: KetQuaThanhToan =
              duHang.length === 0 ? "HetHang" : khongDuHang.length > 0 ? "MotPhanHetHang" : "ThanhCong";
            await tx.thanhToan.update({
              where: { id: row.id },
              data: {
                trangThai: "DaThanhToan",
                ketQua: ketQuaMua,
                donHangId: donMuaId,
                soTienHoan: tienHoan,
                snapshot: JSON.stringify({ ...snapMua, dongHetHang: khongDuHang.map((l) => l.productName) }),
              },
            });
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
      if (result.ok && !result.duplicate && result.payment.trangThai === "DaThanhToan" && result.payment.mucDich === "TienHang") {
        // Giỏ mua: chỉ trừ các dòng đã chốt thành đơn (không đụng dòng hết hàng — khách còn thấy và xử lý được).
        // Trừ đúng số lượng đã mua (theo snapshot) thay vì xoá cả dòng: nếu khách đổi số lượng trong lúc chờ
        // thanh toán thì phần dư vẫn ở lại trong giỏ, và không còn dòng nào bị mua lặp ngoài ý muốn.
        const gio = deps.purchaseCart();
        for (const line of result.payment.muaLines) {
          if (result.payment.dongHetHang.includes(line.productName)) continue;
          const trongGio = gio.get(result.payment.email).find((i) => i.sanPhamId === line.productSlug);
          if (!trongGio) continue;
          const conLai = trongGio.soLuong - line.soLuong;
          if (conLai > 0) gio.setItem(result.payment.email, line.productSlug, conLai);
          else gio.removeItem(result.payment.email, line.productSlug);
        }
      } else if (result.ok && !result.duplicate && result.payment.trangThai === "DaThanhToan") {
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
