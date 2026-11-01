import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { rentalOrderStore } from "@/lib/rentals/server";

/** FR-BH-06 (UC-04 luồng thay thế): khách huỷ đơn thuê của chính mình khi còn Pending (chưa được Staff
 * xác nhận, UC-05). Chỉ chủ đơn mới gọi được. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { id } = await params;
  const result = await rentalOrderStore.cancel(id, email);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, order: result.order });
}
