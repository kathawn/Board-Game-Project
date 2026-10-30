import { SALE_STAGES, searchSaleOrders, type SaleStage } from "@/lib/orders/sale-orders";

/** UC-03 (đơn mua) cho Staff: danh sách đơn mua cần giao / đang giao / đã giao, tìm kiếm + lọc + phân trang ở server.
 * Như các route /api/staff khác, chưa có đăng nhập Staff riêng gắn vào route này (UC-13).
 * Query: q, stage (ChoGiao | DangGiao | DaGiao), page, pageSize. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const stageParam = url.searchParams.get("stage");
  const stage: SaleStage = SALE_STAGES.includes(stageParam as SaleStage) ? (stageParam as SaleStage) : "ChoGiao";
  const result = await searchSaleOrders({
    q: url.searchParams.get("q") ?? "",
    stage,
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize")) || 8)),
  });
  return Response.json({ ok: true, ...result });
}
