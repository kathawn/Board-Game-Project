import { requireStaff } from "@/lib/auth/staff";
import { returnService } from "@/lib/rentals/returns-server";

/** Chi tiết đầy đủ một đơn trả hàng (checklist, biên bản kiểm đếm, bảng quyết toán). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const order = await returnService.get(id);
  if (!order) return Response.json({ error: "Không tìm thấy đơn thuê." }, { status: 404 });
  return Response.json({ ok: true, order });
}
