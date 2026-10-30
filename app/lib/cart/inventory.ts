import { getPrisma } from "@/lib/db/client";
import type { Tx } from "@/lib/db/tx";
import { checkStock, getProductBySlug, type StockCheckResult } from "@/lib/products";

type Db = Pick<Tx, "hopGame" | "chiTietDonHang" | "sanPham">;

/** Số hộp game của từng sản phẩm có thể BÁN ngay (FR-BH-04/FR-BH-08): số hộp đang Available trừ đi số dòng đơn
 * thuê còn chờ bàn giao (Pending/Confirmed). Đơn thuê chỉ giữ chỗ theo ngày, chưa chuyển hộp sang Reserved, nên nếu
 * không trừ thì bán hết hộp Available có thể làm một đơn thuê đã trả cọc không còn hộp để xuất kho (UC-06).
 * Dùng chung cho kiểm tra lúc thêm giỏ/checkout và cho webhook thanh toán (truyền transaction để đọc dưới khoá). */
export async function demHopCoTheBan(db: Db, slugs: string[]): Promise<Map<string, number>> {
  const uniq = [...new Set(slugs)];
  const result = new Map<string, number>(uniq.map((s) => [s, 0]));
  if (uniq.length === 0) return result;

  const sanPham = await db.sanPham.findMany({ where: { slug: { in: uniq } }, select: { id: true, slug: true } });
  const slugOf = new Map(sanPham.map((s) => [s.id, s.slug]));
  const ids = sanPham.map((s) => s.id);

  const [available, camKetThue] = await Promise.all([
    db.hopGame.groupBy({ by: ["sanPhamId"], where: { trangThai: "Available", sanPhamId: { in: ids } }, _count: { _all: true } }),
    db.chiTietDonHang.groupBy({
      by: ["sanPhamId"],
      where: { sanPhamId: { in: ids }, donHang: { loai: "Thue", trangThai: { in: ["Pending", "Confirmed"] } } },
      _count: { _all: true },
    }),
  ]);
  const thue = new Map(camKetThue.map((r) => [r.sanPhamId, r._count._all]));
  for (const r of available) {
    const slug = slugOf.get(r.sanPhamId);
    if (slug) result.set(slug, Math.max(0, r._count._all - (thue.get(r.sanPhamId) ?? 0)));
  }
  return result;
}

export async function demHopAvailable(slugs: string[]): Promise<Map<string, number>> {
  return demHopCoTheBan(getPrisma(), slugs);
}

/** checkStock (FR-BH-04) nhưng dựa trên tồn kho thật trong DB. */
export async function kiemTraTonKho(slug: string, soLuong: number): Promise<StockCheckResult> {
  const product = getProductBySlug(slug);
  if (!product) return { ok: false, error: "Không tìm thấy sản phẩm." };
  const ton = (await demHopAvailable([slug])).get(slug) ?? 0;
  return checkStock({ ...product, soLuongTon: ton }, soLuong);
}
