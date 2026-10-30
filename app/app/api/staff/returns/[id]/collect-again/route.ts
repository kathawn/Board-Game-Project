import { returnService } from "@/lib/rentals/returns-server";

/** UC-07 4a / UC-10: sinh lại QR thu thêm khi QR cũ đã hết hạn mà khách chưa trả. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await returnService.collectAgain(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, maThanhToan: result.maThanhToan, soTien: result.soTien });
}
