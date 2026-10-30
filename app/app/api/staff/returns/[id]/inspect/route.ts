import { requireStaff } from "@/lib/auth/staff";
import { returnService } from "@/lib/rentals/returns-server";

/** UC-08 (FR-KHO-01, FR-KHO-02): lưu biên bản kiểm đếm một sản phẩm của đơn, đổi trạng thái hộp game
 * (Rented → Checking → Available/Damaged). Body: { chiTietDonId, items: [{ linhKienId, ketQua, soLuongLoi? }], ghiChuNgoai? }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { chiTietDonId, items, ghiChuNgoai } = body;
  if (typeof chiTietDonId !== "string" || !Array.isArray(items)) {
    return Response.json({ error: "Thiếu chiTietDonId hoặc danh sách items." }, { status: 400 });
  }
  const parsed = items.map((it: unknown) => {
    const o = it as Record<string, unknown>;
    return {
      linhKienId: String(o?.linhKienId ?? ""),
      ketQua: o?.ketQua as "Du" | "Loi",
      soLuongLoi: typeof o?.soLuongLoi === "number" ? o.soLuongLoi : undefined,
    };
  });

  const result = await returnService.inspect({
    maDon: id,
    chiTietDonId,
    items: parsed,
    ghiChuNgoai: typeof ghiChuNgoai === "string" ? ghiChuNgoai.slice(0, 500) : "",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, coLoi: result.coLoi, trangThaiHop: result.trangThaiHop });
}
