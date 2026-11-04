import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getPrisma } from "@/lib/db/client";
import { rutTienVi, validateRutTien } from "@/lib/payments/wallet";

/** UC-20 / FR-TTGV-09 (BR-16): khách rút tiền từ ví điện tử nội bộ về tài khoản ngân hàng của mình. Chỉ thành công khi số
 * dư đủ; số dư giảm đúng số tiền đã rút ngay khi yêu cầu được xác nhận. Việc chuyển tiền thật qua MoMo là giả lập. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = validateRutTien(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const result = await rutTienVi(getPrisma(), email, parsed.value);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, soDuMoi: result.soDuMoi, maGiaoDich: result.maGiaoDich });
}
