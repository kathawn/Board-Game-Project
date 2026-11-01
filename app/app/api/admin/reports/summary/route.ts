import { requireStaff } from "@/lib/auth/staff";
import { adminReports } from "@/lib/admin/reports";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** UC-16 (FR-ADM-04, BR-07): tổng doanh thu bán/thuê trong khoảng ngày cho Admin.
 * GET ?from=yyyy-mm-dd&to=yyyy-mm-dd (bao gồm cả hai đầu). */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
    return Response.json({ error: "Khoảng ngày không hợp lệ." }, { status: 400 });
  }

  const summary = await adminReports.rangeSummary(from, to);
  return Response.json({ ok: true, ...summary });
}
