import { requireStaff } from "@/lib/auth/staff";
import { adminReports, HOP_STATUSES, type TrangThaiHop } from "@/lib/admin/reports";

/** UC-16 (FR-ADM-05, BR-13): tồn kho hộp game theo trạng thái, kèm đếm theo trạng thái cho chip bộ lọc.
 * GET ?trangThai=&q=&page= */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const trangThaiRaw = sp.get("trangThai") ?? "";
  const trangThai = (HOP_STATUSES as string[]).includes(trangThaiRaw) ? (trangThaiRaw as TrangThaiHop) : "";

  const page = await adminReports.queryBoxes({
    trangThai,
    q: sp.get("q") ?? "",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ok: true, ...page });
}
