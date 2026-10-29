import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { shippingService } from "@/lib/shipping/server";

/** UC-11 (FR-TTGV-04): khách yêu cầu giao vận đến lấy hàng trả. Body: { diaChiTra }. Chỉ chủ đơn mới gọi được. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });

  let body: { diaChiTra?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  if (typeof body.diaChiTra !== "string") {
    return Response.json({ error: "Thiếu địa chỉ lấy hàng trả." }, { status: 400 });
  }

  const { id } = await params;
  const result = await shippingService.requestPickup({ email, maDon: id, diaChiTra: body.diaChiTra });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, shipments: result.shipments });
}
