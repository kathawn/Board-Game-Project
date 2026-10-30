import { requireStaff } from "@/lib/auth/staff";
import { rentalOrderStore } from "@/lib/rentals/server";
import { RENTAL_STAGES, type RentalStage } from "@/lib/rentals/order-store";

/** FR-CT-05 (UC-05) + UC-06 + theo dõi UC-12: danh sách đơn thuê cho Staff, tìm kiếm / lọc giai đoạn / phân trang
 * ở server để dùng được khi có nhiều đơn. Chưa có đăng nhập Staff riêng (UC-13) trong phạm vi route này — sẽ gắn
 * kiểm tra phiên ở bước backend UC-13.
 * Query: q, stage (ChoXacNhan | ChoBanGiao | DangThue), page, pageSize. */
export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const stageParam = url.searchParams.get("stage");
  const stage: RentalStage = RENTAL_STAGES.includes(stageParam as RentalStage)
    ? (stageParam as RentalStage)
    : "ChoXacNhan";
  const result = await rentalOrderStore.search({
    q: url.searchParams.get("q") ?? "",
    stage,
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize")) || 8)),
  });
  return Response.json({ ok: true, ...result });
}
