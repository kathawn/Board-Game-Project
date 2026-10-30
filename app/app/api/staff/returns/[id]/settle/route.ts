import { returnService } from "@/lib/rentals/returns-server";

/** UC-07 (FR-CT-06, FR-CT-07, FR-TTGV-08): Staff xác nhận hoàn cọc. Số tiền do server tính lại từ DB, request không
 * mang số tiền. Dư → cộng Ví điện tử nội bộ (BRU-06); thiếu → sinh QR thu thêm (UC-10). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await returnService.settle(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({
    ok: true,
    xuLy: result.xuLy,
    quyetToan: result.quyetToan,
    maThanhToanThuThem: result.maThanhToanThuThem,
  });
}
