import { requireStaff } from "@/lib/auth/staff";
import { adminReports, type LoaiDon } from "@/lib/admin/reports";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOAI_HOP_LE: LoaiDon[] = ["Ban", "Thue"];

/** UC-16 (FR-ADM-04, BR-07): từng dòng giao dịch trong khoảng ngày, đối chiếu với số liệu ở /summary.
 * GET ?from=&to=&loai=&q=&page= */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
    return Response.json({ error: "Khoảng ngày không hợp lệ." }, { status: 400 });
  }
  const loaiRaw = sp.get("loai") ?? "";
  const loai = (LOAI_HOP_LE as string[]).includes(loaiRaw) ? (loaiRaw as LoaiDon) : "";

  const page = await adminReports.queryRevenueLines({
    from,
    to,
    loai,
    q: sp.get("q") ?? "",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ok: true, ...page });
}
