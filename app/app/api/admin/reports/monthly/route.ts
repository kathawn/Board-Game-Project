import { requireStaff } from "@/lib/auth/staff";
import { adminReports } from "@/lib/admin/reports";

const THANG = /^\d{4}-\d{2}$/;

/** UC-16 (FR-ADM-04, BR-07): doanh thu từng tháng trong 12 tháng gần nhất (tính từ `thang`, ngược về trước) —
 * dùng cho danh sách "Chọn tháng" ở Báo cáo chi tiết và biểu đồ 6 tháng ở Dashboard.
 * GET ?thang=yyyy-mm&soThang= (mặc định 12) */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const thang = sp.get("thang") ?? "";
  if (!THANG.test(thang)) return Response.json({ error: "Tháng không hợp lệ." }, { status: 400 });
  const soThang = Math.min(24, Math.max(1, Number(sp.get("soThang")) || 12));

  const [y, m] = thang.split("-").map(Number);
  const months = Array.from({ length: soThang }, (_, i) => {
    const idx = y * 12 + (m - 1) - i;
    return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
  });

  const summaries = await Promise.all(
    months.map(async (mo) => {
      const toDay = new Date(Date.UTC(Number(mo.slice(0, 4)), Number(mo.slice(5, 7)), 0)).toISOString().slice(0, 10);
      const s = await adminReports.rangeSummary(`${mo}-01`, toDay);
      return { thang: mo, ...s };
    }),
  );
  return Response.json({ ok: true, months: summaries });
}
