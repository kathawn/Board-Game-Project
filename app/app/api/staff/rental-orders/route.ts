import { rentalOrderStore } from "@/lib/rentals/server";

/** FR-CT-05 (UC-05): Staff xem danh sách đơn thuê để xác nhận. Chưa có tài
 * khoản/đăng nhập Staff riêng (FR-ADM-01/UC-13) trong code — theo phạm vi
 * MVP đã thống nhất, route này tạm không yêu cầu đăng nhập Staff, chỉ demo
 * đúng bước Pending → Confirmed của UC-05. */
export async function GET() {
  return Response.json({ ok: true, orders: await rentalOrderStore.list() });
}
