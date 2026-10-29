import type { PrismaClient } from "../generated/prisma/client";
import type { Tx } from "../db/tx";

/** BRU-06 (BR-16): Ví điện tử nội bộ — mỗi khách một ví (1-1), số dư tăng khi hệ thống hoàn tiền
 * (UC-10 luồng ngoại lệ 4a/7b). Mỗi lần cộng ghi một dòng sổ cái ButToanVi; cặp
 * (thanhToanId, maGiaoDich) là duy nhất nên cùng một giao dịch không thể hoàn hai lần. Rút tiền về
 * ngân hàng (FR-TTGV-09/UC-20) chưa làm trong phạm vi này. */

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
