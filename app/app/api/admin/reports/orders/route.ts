import { requireStaff } from "@/lib/auth/staff";
import { adminReports, DON_STATUSES, type LoaiDon, type TrangThaiDon } from "@/lib/admin/reports";

const LOAI_HOP_LE: LoaiDon[] = ["Ban", "Thue"];

/** UC-16 (FR-ADM-05, BR-13): đơn mua/thuê theo trạng thái, kèm đếm theo trạng thái cho chip bộ lọc.
 * GET ?trangThai=&loai=&q=&page= */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const trangThaiRaw = sp.get("trangThai") ?? "";
  const trangThai = (DON_STATUSES as string[]).includes(trangThaiRaw) ? (trangThaiRaw as TrangThaiDon) : "";
  const loaiRaw = sp.get("loai") ?? "";
  const loai = (LOAI_HOP_LE as string[]).includes(loaiRaw) ? (loaiRaw as LoaiDon) : "";

  const page = await adminReports.queryOrders({
    trangThai,
    loai,
    q: sp.get("q") ?? "",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ok: true, ...page });
}
