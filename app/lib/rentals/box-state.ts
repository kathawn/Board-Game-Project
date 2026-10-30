import type { Tx } from "../db/tx";

/** FR-KHO-02 (UC-09): vòng đời hộp game vật lý theo State Machine SRS 3.6 (Hình 3.7). Mọi thay đổi trạng thái
 * hộp game phải đi qua đây để chỉ các cung hợp lệ mới được phép. */

export type TrangThaiHopGame = "Available" | "Reserved" | "Rented" | "Checking" | "Damaged" | "Sold";

export const TRANG_THAI_HOP_GAME: readonly TrangThaiHopGame[] = [
  "Available",
  "Reserved",
  "Rented",
  "Checking",
  "Damaged",
  "Sold",
];

export const CHUYEN_HOP_LE: Record<TrangThaiHopGame, readonly TrangThaiHopGame[]> = {
  Available: ["Reserved", "Sold"], // đơn thuê mới đặt / khách mua
  Reserved: ["Rented", "Available"], // bàn giao giao vận / đơn huỷ trước khi xuất kho
  Rented: ["Checking"], // giao vận lấy hàng về kho, bắt đầu kiểm đếm (UC-08)
  Checking: ["Available", "Damaged"], // đủ linh kiện / thiếu hoặc hư hỏng
  Damaged: ["Available"], // đã xử lý đền bù (BRU-04)
  Sold: [], // rời kho vĩnh viễn
};

export function isTrangThaiHopGame(value: unknown): value is TrangThaiHopGame {
  return typeof value === "string" && (TRANG_THAI_HOP_GAME as readonly string[]).includes(value);
}

export function chuyenHopLe(from: TrangThaiHopGame, to: TrangThaiHopGame): boolean {
  return CHUYEN_HOP_LE[from].includes(to);
}

export type DoiTrangThaiHopResult =
  | { ok: true; maHop: string; tu: TrangThaiHopGame; den: TrangThaiHopGame }
  | { ok: false; status: 400 | 404 | 409; error: string };

/** Damaged → Available nghĩa là "Đã xử lý đền bù (BRU-04)": chỉ cho phép khi đơn gắn với biên bản kiểm đếm cuối của
 * hộp này đã quyết toán xong (hoàn ví xong, hoặc khách đã trả khoản thu thêm). Trả về lý do chặn, hoặc null. */
async function lyDoChanGiaiPhongHop(db: Pick<Tx, "bienBanKiemDem">, maHop: string): Promise<string | null> {
  const bienBan = await db.bienBanKiemDem.findFirst({
    where: { ketQua: { contains: `"maHop":${JSON.stringify(maHop)}` } },
    orderBy: { ngayLap: "desc" },
    select: {
      chiTietDon: {
        select: {
          donHang: { select: { maDon: true, trangThai: true, thanhToan: { select: { mucDich: true, trangThai: true } } } },
        },
      },
    },
  });
  // Hộp bị đánh dấu Damaged ngoài luồng trả hàng (không có biên bản) thì không có khoản đền bù nào để chờ.
  if (!bienBan) return null;

  const don = bienBan.chiTietDon.donHang;
  if (don.trangThai === "Active" || don.trangThai === "Overdue") {
    return `Đơn ${don.maDon} chưa quyết toán hoàn cọc nên chưa xử lý xong đền bù (BRU-04).`;
  }
  if (don.trangThai === "Completed" && !don.thanhToan.some((t) => t.mucDich === "ThuThem" && t.trangThai === "DaThanhToan")) {
    return `Khách chưa thanh toán khoản thu thêm của đơn ${don.maDon} nên chưa xử lý xong đền bù (BRU-04).`;
  }
  return null;
}

/** Đổi trạng thái một hộp game theo mã hộp. UPDATE có điều kiện trên trạng thái vừa đọc nên hai Staff thao tác cùng
 * lúc thì chỉ một người đổi được. */
export async function doiTrangThaiHop(
  db: Pick<Tx, "hopGame" | "bienBanKiemDem">,
  maHop: string,
  den: TrangThaiHopGame,
): Promise<DoiTrangThaiHopResult> {
  const hop = await db.hopGame.findUnique({ where: { maHop }, select: { id: true, trangThai: true } });
  if (!hop) return { ok: false, status: 404, error: `Không tìm thấy hộp game ${maHop}.` };

  const tu = hop.trangThai as TrangThaiHopGame;
  if (tu === "Damaged" && den === "Available") {
    const lyDo = await lyDoChanGiaiPhongHop(db, maHop);
    if (lyDo) return { ok: false, status: 409, error: lyDo };
  }
  if (!chuyenHopLe(tu, den)) {
    const duocPhep = CHUYEN_HOP_LE[tu];
    return {
      ok: false,
      status: 409,
      error: `Không thể chuyển hộp ${maHop} từ ${tu} sang ${den}.${
        duocPhep.length ? ` Trạng thái tiếp theo hợp lệ: ${duocPhep.join(", ")}.` : " Hộp đã bán, không còn trạng thái tiếp theo."
      }`,
    };
  }

  const moved = await db.hopGame.updateMany({ where: { id: hop.id, trangThai: tu }, data: { trangThai: den } });
  if (moved.count === 0) {
    return { ok: false, status: 409, error: `Hộp ${maHop} vừa được người khác đổi trạng thái, vui lòng tải lại.` };
  }
  return { ok: true, maHop, tu, den };
}
