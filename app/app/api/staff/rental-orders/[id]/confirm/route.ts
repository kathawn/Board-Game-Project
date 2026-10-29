import { rentalOrderStore } from "@/lib/rentals/server";

/** FR-CT-05 (UC-05): Staff xác nhận đơn thuê — chuyển Pending → Confirmed.
 * UC-06 (gọi API đối tác giao vận tạo yêu cầu giao hàng, cập nhật Hộp game
 * = Rented) chưa có HopGame/carrier-call trong code nên để ngoài phạm vi
 * này — UC-05 chỉ cần đúng bước chuyển trạng thái đơn. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await rentalOrderStore.confirm(id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true, order: result.order });
}
