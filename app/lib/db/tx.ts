import type { Prisma } from "../generated/prisma/client";

export type Tx = Prisma.TransactionClient;

export const toDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
export const toIso = (d: Date) => d.toISOString().slice(0, 10);

/** Khoá ứng dụng của SQL Server, sống đến hết transaction hiện tại. Dùng để xếp hàng các webhook
 * cùng tranh một sản phẩm (BRU-07) — webhook nào lấy được khoá trước thì kiểm tra "còn khả dụng"
 * và ghi đơn xong rồi mới đến lượt webhook sau, nên không thể cả hai cùng thấy "còn trống".
 * Luôn khoá theo thứ tự cố định (caller sắp xếp) để không deadlock. */
export async function lockResource(tx: Tx, resource: string): Promise<void> {
  const rows = await tx.$queryRaw<{ r: number }[]>`
    DECLARE @r INT;
    EXEC @r = sp_getapplock @Resource = ${resource}, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 15000;
    SELECT @r AS r`;
  if (Number(rows[0]?.r) < 0) {
    throw new Error(`Không lấy được khoá ${resource} (mã ${rows[0]?.r}).`);
  }
}

export async function nextSequence(tx: Tx | { $queryRaw: Tx["$queryRaw"] }, name: "seq_madon_thue" | "seq_mathanhtoan"): Promise<number> {
  const rows =
    name === "seq_madon_thue"
      ? await tx.$queryRaw<{ n: bigint | number }[]>`SELECT NEXT VALUE FOR dbo.seq_madon_thue AS n`
      : await tx.$queryRaw<{ n: bigint | number }[]>`SELECT NEXT VALUE FOR dbo.seq_mathanhtoan AS n`;
  return Number(rows[0].n);
}

/** Đơn thuê còn "giữ" sản phẩm trong khoảng ngày (FR-CT-02/BR-05). Gồm cả Pending: đơn vừa tạo từ
 * webhook thanh toán thành công vẫn đang chiếm chỗ (BRU-07 ưu tiên theo thời điểm thanh toán). */
export const TRANG_THAI_DANG_GIU = ["Pending", "Confirmed", "Active", "Overdue"];
