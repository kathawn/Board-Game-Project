import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { lockResource, type Tx } from "../db/tx";
import { tinhPhiShip, uocTinhKhoangCachKm, type DoiTacGiaoVan } from "../rentals/deposit";
import type { CarrierClient } from "./carrier";
import {
  TRANG_THAI_THEO_CHIEU,
  type ChieuGiaoVan,
  type Shipment,
  type TrangThaiVanChuyen,
} from "./types";

/** Giao vận hai chiều (BR-09, BRU-05), đối tác giả lập:
 *  - UC-06 / FR-TTGV-03: Staff bàn giao đơn Confirmed → tạo yêu cầu giao hàng, hộp game → Rented, đơn → Active.
 *  - UC-11 / FR-TTGV-04: khách yêu cầu lấy hàng trả khi đơn Active/Overdue.
 *  - UC-12 / FR-TTGV-05: webhook đối tác cập nhật trạng thái vận chuyển.
 *
 * Mỗi DÒNG đơn (ChiTietDonHang) có một vận đơn riêng mỗi chiều: bảng GiaoVan gắn với dòng đơn và mã vận đơn là
 * duy nhất, và tiền cọc cũng giữ phí ship theo từng sản phẩm (DatCoc.phiShipGiu). */

export type ShippingResult<T> = ({ ok: true } & T) | { ok: false; status: 400 | 404 | 409 | 502; error: string };

export interface ShipmentWithOrder extends Shipment {
  maDon: string;
}

export interface ShippingService {
  /** UC-06: Staff bàn giao cho giao vận. */
  handover(maDon: string): Promise<ShippingResult<{ shipments: Shipment[] }>>;
  /** UC-11: khách yêu cầu giao vận đến lấy hàng trả. */
  requestPickup(input: { email: string; maDon: string; diaChiTra: string }): Promise<ShippingResult<{ shipments: Shipment[] }>>;
  /** UC-12: webhook trạng thái vận chuyển (đã xác thực chữ ký ở route). */
  applyWebhook(input: { maVanDon: string; trangThai: TrangThaiVanChuyen }): Promise<
    ShippingResult<{ duplicate: boolean; maDon: string; trangThai: TrangThaiVanChuyen }>
  >;
  /** Chỉ dùng cho trang giả lập đối tác (dev). */
  listAll(): Promise<ShipmentWithOrder[]>;
}

/** Lỗi nghiệp vụ ném giữa chừng transaction để ROLLBACK toàn bộ (vd. đối tác lỗi sau khi đã đổi trạng thái đơn). */
class ShippingError extends Error {
  constructor(
    readonly status: 400 | 404 | 409 | 502,
    message: string,
  ) {
    super(message);
  }
}

type GiaoVanRow = Prisma.GiaoVanGetPayload<Record<string, never>>;

export function toShipment(row: GiaoVanRow): Shipment {
  return {
    chieu: row.chieu as ChieuGiaoVan,
    doiTac: row.doiTac as DoiTacGiaoVan,
    maVanDon: row.maVanDon ?? "",
    khoangCachKm: Number(row.khoangCachKm),
    phiShip: Number(row.phiShip),
    trangThai: row.trangThaiVanChuyen as TrangThaiVanChuyen,
  };
}

const TX_OPTIONS = { maxWait: 15_000, timeout: 30_000 };

export function createShippingService(deps: { getDb: () => PrismaClient; carrier: CarrierClient }): ShippingService {
  /** FR-TTGV-02 + FR-TTGV-03/04: tính khoảng cách/đối tác/phí cho một chiều rồi gọi đối tác tạo yêu cầu. */
  async function taoVanDon(
    tx: Tx,
    created: string[],
    input: { maDon: string; chiTietDonId: string; chieu: ChieuGiaoVan; diaChi: string },
  ): Promise<Shipment> {
    const khoangCachKm = uocTinhKhoangCachKm(input.diaChi);
    const { doiTac, phiShip } = tinhPhiShip(khoangCachKm);

    let maVanDon: string;
    try {
      ({ maVanDon } = await deps.carrier.createShipment({
        maDon: input.maDon,
        chieu: input.chieu,
        diaChi: input.diaChi,
        doiTac,
        khoangCachKm,
        phiShip,
      }));
    } catch {
      throw new ShippingError(502, "Đối tác giao vận không khả dụng. Vui lòng thử lại sau.");
    }
    created.push(maVanDon);

    const row = await tx.giaoVan.create({
      data: {
        chiTietDonId: input.chiTietDonId,
        chieu: input.chieu,
        doiTac,
        khoangCachKm,
        phiShip,
        maVanDon,
        // Trạng thái đầu của chiều: đang giao (chiều nhận) / đang lấy (chiều trả).
        trangThaiVanChuyen: TRANG_THAI_THEO_CHIEU[input.chieu][0],
      },
    });
    return toShipment(row);
  }

  /** Chạy một transaction có gọi đối tác bên ngoài. Cuộc gọi đối tác không rollback được cùng DB, nên nếu bất kỳ
   * bước nào thất bại sau khi đã tạo vận đơn, huỷ các vận đơn đó ở đối tác trước khi ném lỗi (DB tự rollback). */
  async function withCompensation<T>(run: (created: string[]) => Promise<T>): Promise<T> {
    const created: string[] = [];
    try {
      return await run(created);
    } catch (e) {
      await Promise.allSettled(created.map((ma) => deps.carrier.cancelShipment(ma)));
      throw e;
    }
  }

  async function guard<T>(run: () => Promise<ShippingResult<T>>): Promise<ShippingResult<T>> {
    try {
      return await run();
    } catch (e) {
      if (e instanceof ShippingError) return { ok: false, status: e.status, error: e.message };
      throw e;
    }
  }

  return {
    handover: (maDon) =>
      guard(() =>
        withCompensation((created) => deps.getDb().$transaction(async (tx) => {
          const order = await tx.donHang.findUnique({
            where: { maDon },
            include: { chiTiet: { include: { sanPham: { select: { id: true, slug: true, ten: true } }, giaoVan: true } } },
          });
          if (!order || order.loai !== "Thue") throw new ShippingError(404, "Không tìm thấy đơn thuê.");

          // Khoá theo sản phẩm (cùng khoá với webhook thanh toán) để hai đơn không cùng lấy một hộp game.
          for (const slug of [...new Set(order.chiTiet.map((c) => c.sanPham.slug))].sort()) {
            await lockResource(tx, `sp:${slug}`);
          }

          // Một câu UPDATE có điều kiện: hai Staff bấm bàn giao cùng lúc thì chỉ một người đi tiếp.
          const claimed = await tx.donHang.updateMany({
            where: { id: order.id, trangThai: "Confirmed" },
            data: { trangThai: "Active" },
          });
          if (claimed.count === 0) {
            throw new ShippingError(409, "Đơn thuê không ở trạng thái Đã xác nhận nên không thể bàn giao.");
          }

          // FR-KHO-02 / UC-06 bước 4: xuất kho TRƯỚC khi gọi đối tác, để thiếu hộp game thì dừng sớm mà chưa tạo
          // vận đơn nào ở đối tác. Ưu tiên hộp đã Reserved cho đơn.
          for (const line of order.chiTiet) {
            const hop = await tx.hopGame.findFirst({
              where: { sanPhamId: line.sanPhamId, trangThai: { in: ["Reserved", "Available"] } },
              orderBy: { trangThai: "desc" }, // "Reserved" > "Available"
              select: { id: true, maHop: true },
            });
            const rented = hop
              ? await tx.hopGame.updateMany({
                  where: { id: hop.id, trangThai: { in: ["Reserved", "Available"] } },
                  data: { trangThai: "Rented" },
                })
              : { count: 0 };
            if (!hop || rented.count === 0) {
              throw new ShippingError(409, `Không còn hộp game "${line.sanPham.ten}" để xuất kho.`);
            }
            // Ghi hộp nào đi theo dòng đơn này để lúc trả hàng (UC-08) biết chính xác hộp cần kiểm đếm.
            await tx.chiTietDonHang.update({ where: { id: line.id }, data: { maHop: hop.maHop } });
          }

          // UC-06 bước 2 / FR-TTGV-03. Lỗi ở dòng sau sẽ huỷ vận đơn đã tạo ở dòng trước (withCompensation)
          // và rollback cả đơn lẫn hộp game.
          const shipments: Shipment[] = [];
          for (const line of order.chiTiet) {
            shipments.push(
              await taoVanDon(tx, created, {
                maDon,
                chiTietDonId: line.id,
                chieu: "Nhan",
                diaChi: line.diaChiNhan,
              }),
            );
          }
          return { ok: true as const, shipments };
        }, TX_OPTIONS)),
      ),

    requestPickup: ({ email, maDon, diaChiTra }) =>
      guard<{ shipments: Shipment[] }>(() => {
        const diaChi = diaChiTra.trim();
        if (!diaChi) return Promise.resolve({ ok: false as const, status: 400 as const, error: "Vui lòng nhập địa chỉ lấy hàng trả." });

        return withCompensation((created) => deps.getDb().$transaction(async (tx) => {
          // Chặn hai lần bấm đồng thời cùng tạo hai yêu cầu lấy hàng cho một đơn.
          await lockResource(tx, `gv:${maDon}`);

          const order = await tx.donHang.findUnique({
            where: { maDon },
            include: {
              khachHang: { select: { email: true } },
              chiTiet: { include: { giaoVan: true } },
            },
          });
          // Đơn của người khác trả về 404 như đơn không tồn tại, không để lộ mã đơn.
          if (!order || order.loai !== "Thue" || order.khachHang.email !== email) {
            throw new ShippingError(404, "Không tìm thấy đơn thuê.");
          }
          if (order.trangThai !== "Active" && order.trangThai !== "Overdue") {
            throw new ShippingError(409, "Chỉ yêu cầu lấy hàng trả được khi đơn đang thuê hoặc quá hạn trả.");
          }
          if (order.chiTiet.some((c) => c.giaoVan.some((g) => g.chieu === "Tra"))) {
            throw new ShippingError(409, "Đơn này đã có yêu cầu lấy hàng trả.");
          }
          // Chưa nhận được hàng thì chưa có gì để trả: mọi dòng đơn phải có vận đơn chiều giao ở trạng thái Đã giao.
          const chuaNhanHang = order.chiTiet.some(
            (c) => !c.giaoVan.some((g) => g.chieu === "Nhan" && g.trangThaiVanChuyen === "DaGiao"),
          );
          if (chuaNhanHang) {
            throw new ShippingError(409, "Hàng chưa được giao tới bạn nên chưa thể yêu cầu lấy hàng trả.");
          }

          const shipments: Shipment[] = [];
          for (const line of order.chiTiet) {
            await tx.chiTietDonHang.update({ where: { id: line.id }, data: { diaChiTra: diaChi } });
            shipments.push(await taoVanDon(tx, created, { maDon, chiTietDonId: line.id, chieu: "Tra", diaChi }));
          }
          return { ok: true as const, shipments };
        }, TX_OPTIONS));
      }),

    applyWebhook: ({ maVanDon, trangThai }) =>
      guard<{ duplicate: boolean; maDon: string; trangThai: TrangThaiVanChuyen }>(async () => {
        const db = deps.getDb();
        const row = await db.giaoVan.findUnique({
          where: { maVanDon },
          include: { chiTietDon: { select: { donHang: { select: { maDon: true } } } } },
        });
        if (!row) return { ok: false as const, status: 404 as const, error: "Không tìm thấy vận đơn." };

        const maDon = row.chiTietDon.donHang.maDon;
        const [dau, cuoi] = TRANG_THAI_THEO_CHIEU[row.chieu as ChieuGiaoVan];
        if (trangThai !== dau && trangThai !== cuoi) {
          return {
            ok: false as const,
            status: 409 as const,
            error: `Trạng thái ${trangThai} không hợp lệ cho vận đơn chiều ${row.chieu === "Nhan" ? "giao hàng" : "lấy hàng trả"}.`,
          };
        }

        // Chiều chỉ có một bước tiến (đầu → cuối). UPDATE có điều kiện nên webhook gửi lặp hoặc đến muộn
        // (vd. "đang giao" đến sau "đã giao") không bao giờ làm trạng thái lùi lại và không xử lý hai lần.
        let duplicate = true;
        if (trangThai === cuoi) {
          const moved = await db.giaoVan.updateMany({
            where: { maVanDon, trangThaiVanChuyen: dau },
            // hoanTatLuc: với chiều trả (DaLay) là ngày hàng về kho -> số ngày trễ hạn (BRU-03, UC-07).
            data: { trangThaiVanChuyen: cuoi, hoanTatLuc: new Date() },
          });
          duplicate = moved.count === 0;
        }

        const hienTai = await db.giaoVan.findUnique({ where: { maVanDon }, select: { trangThaiVanChuyen: true } });
        return {
          ok: true as const,
          duplicate,
          maDon,
          trangThai: (hienTai?.trangThaiVanChuyen ?? trangThai) as TrangThaiVanChuyen,
        };
      }),

    async listAll() {
      const rows = await deps.getDb().giaoVan.findMany({
        where: { maVanDon: { not: null } },
        include: { chiTietDon: { select: { donHang: { select: { maDon: true } } } } },
        orderBy: { maVanDon: "desc" },
      });
      return rows.map((r) => ({ ...toShipment(r), maDon: r.chiTietDon.donHang.maDon }));
    },
  };
}
