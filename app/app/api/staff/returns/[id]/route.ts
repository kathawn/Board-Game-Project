import { returnService } from "@/lib/rentals/returns-server";

/** Chi tiết đầy đủ một đơn trả hàng (checklist, biên bản kiểm đếm, bảng quyết toán). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await returnService.get(id);
  if (!order) return Response.json({ error: "Không tìm thấy đơn thuê." }, { status: 404 });
  return Response.json({ ok: true, order });
}
