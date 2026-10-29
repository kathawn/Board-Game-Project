import { orderStore } from "@/lib/orders/server";
import { rentalOrderStore } from "@/lib/rentals/server";
import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import type { DonHang, LoaiDon } from "@/lib/orders/store";
import type { RentalOrder } from "@/lib/rentals/order-store";

/** FR-CT-05 (UC-04/UC-05): đơn thuê tạo qua giỏ thuê (lib/rentals/order-store.ts)
 * nằm ở store riêng với lịch sử đơn mua/thuê demo của FR-BH-05
 * (lib/orders/store.ts) — khách phải thấy đơn thuê thật của mình ở đây
 * (FR-BH-05 "lịch sử đơn mua/thuê của chính khách"), nên gộp cả hai nguồn
 * khi trả về thay vì chỉ đọc orderStore cũ. */
function rentalOrderToDonHang(order: RentalOrder): DonHang {
  return {
    id: order.id,
    loai: "Thue",
    trangThai: order.trangThai,
    ngayTao: order.ngayTao,
    sanPham: order.lines.map((l) => l.productName).join(", "),
    chiTiet: order.lines.map((l) => `${l.productName} ${l.startDate} → ${l.endDate}`).join("; "),
    tongTien: order.tongTienCoc,
  };
}

export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const url = new URL(request.url);
  const loai = url.searchParams.get("loai") as LoaiDon | null;
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const rentalOrders = rentalOrderStore
    .list()
    .filter((order) => order.email === email)
    .map(rentalOrderToDonHang);

  const orders = [...rentalOrders, ...orderStore.listByEmail(email)].filter((order) => {
    if (loai && order.loai !== loai) return false;
    if (q && !order.sanPham.toLowerCase().includes(q) && !order.id.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return Response.json({ ok: true, orders });
}
