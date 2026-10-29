import { rentalOrderStore } from "@/lib/rentals/server";

/** FR-CT-05 (UC-05): Staff xác nhận đơn thuê — chuyển Pending → Confirmed.
 * Bước bàn giao cho giao vận (UC-06) nằm ở route ../handover. */
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
