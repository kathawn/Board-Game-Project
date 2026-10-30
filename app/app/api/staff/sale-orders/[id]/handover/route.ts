import { requireStaff } from "@/lib/auth/staff";
import { shippingService } from "@/lib/shipping/server";

/** UC-03 / FR-TTGV-02..03: Staff giao đơn mua (Confirmed) cho giao vận — tạo yêu cầu giao hàng MỘT chiều. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await shippingService.handoverSale(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, shipments: result.shipments });
}
