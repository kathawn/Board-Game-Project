import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { serializeCart } from "@/lib/cart/server";

/** FR-BH-09: xem lại giỏ hàng hiện tại của khách đang đăng nhập. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  return Response.json({ items: serializeCart(email) }, { status: 200 });
}
