import { requireStaff } from "@/lib/auth/staff";
import { shippingService } from "@/lib/shipping/server";

/** UC-06 (FR-TTGV-03, FR-KHO-02): Staff bàn giao đơn Confirmed cho giao vận — gọi đối tác tạo yêu cầu giao hàng,
 * hộp game → Rented, đơn → Active. Như các route /api/staff khác, chưa có đăng nhập Staff riêng (UC-13) trong
 * phạm vi MVP đã thống nhất. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await shippingService.handover(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, shipments: result.shipments });
}
