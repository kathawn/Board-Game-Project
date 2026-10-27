import { orderStore } from "@/lib/orders/server";
import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import type { LoaiDon } from "@/lib/orders/store";

export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const url = new URL(request.url);
  const loai = url.searchParams.get("loai") as LoaiDon | null;
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const orders = orderStore.listByEmail(email).filter((order) => {
    if (loai && order.loai !== loai) return false;
    if (q && !order.sanPham.toLowerCase().includes(q) && !order.id.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return Response.json({ ok: true, orders });
}
