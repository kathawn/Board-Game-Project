import { requireStaff } from "@/lib/auth/staff";
import { returnService } from "@/lib/rentals/returns-server";
import { RETURN_STAGES, type ReturnStage } from "@/lib/rentals/returns";

/** UC-07/UC-08: danh sách đơn thuê đang chờ nhận hàng trả / kiểm đếm / quyết toán hoàn cọc, có tìm kiếm, lọc theo
 * giai đoạn và phân trang để dùng được khi có nhiều đơn. Như các route /api/staff khác, chưa có đăng nhập Staff riêng
 * (UC-13) trong phạm vi MVP đã thống nhất.
 * Query: q, stage (all | ChoVeKho | ChoKiemDem | ChoQuyetToan | ChoThuThem), page, pageSize. */
export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const stageParam = url.searchParams.get("stage");
  const stage = RETURN_STAGES.includes(stageParam as ReturnStage) ? (stageParam as ReturnStage) : "all";
  const result = await returnService.list({
    q: url.searchParams.get("q") ?? "",
    stage,
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 10,
  });
  return Response.json({ ok: true, ...result });
}
