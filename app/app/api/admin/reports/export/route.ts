import { requireStaff } from "@/lib/auth/staff";
import { exportAnalytics, exportBoxes, exportOrders, exportRevenue, XLSX_MIME } from "@/lib/admin/export-xlsx";
import { DON_STATUSES, HOP_STATUSES, adminReports } from "@/lib/admin/reports";
import type { LoaiDon, TrangThaiDon, TrangThaiHop } from "@/lib/admin/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** UC-16 (FR-ADM-04, FR-ADM-05): xuất báo cáo ra Excel — chỉ Admin. Xuất đủ mọi dòng khớp bộ lọc (không chỉ trang đang xem).
 * GET ?type=revenue|analytics&from=&to=[&loai=&q=]  |  ?type=orders[&trangThai=&loai=&q=]  |  ?type=boxes[&trangThai=&q=] */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const type = sp.get("type") ?? "";
  const q = sp.get("q") ?? "";
  const loaiRaw = sp.get("loai") ?? "";
  const loai: "" | LoaiDon = loaiRaw === "Ban" || loaiRaw === "Thue" ? loaiRaw : "";
  const stamp = new Date().toISOString().slice(0, 10);

  let body: Buffer;
  let name: string;

  if (type === "revenue" || type === "analytics") {
    const from = sp.get("from") ?? "";
    const to = sp.get("to") ?? "";
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
      return Response.json({ error: "Khoảng ngày không hợp lệ." }, { status: 400 });
    }
    if (type === "revenue") {
      const [summary, lines] = await Promise.all([
        adminReports.rangeSummary(from, to),
        adminReports.allRevenueLines({ from, to, loai, q }),
      ]);
      const filter = [loai && `Loại: ${loai === "Ban" ? "Bán" : "Thuê"}`, q.trim() && `Từ khoá: ${q.trim()}`].filter(Boolean).join("; ");
      body = await exportRevenue({ from, to, summary, lines, filter });
      name = `doanh-thu_${from}_${to}`;
    } else {
      body = await exportAnalytics({ from, to, data: await adminReports.analytics(from, to) });
      name = `phan-tich_${from}_${to}`;
    }
  } else if (type === "orders") {
    const t = sp.get("trangThai") ?? "";
    const trangThai = (DON_STATUSES as string[]).includes(t) ? (t as TrangThaiDon) : "";
    body = await exportOrders(await adminReports.allOrders({ trangThai, loai, q }));
    name = `don-hang_${stamp}`;
  } else if (type === "boxes") {
    const t = sp.get("trangThai") ?? "";
    const trangThai = (HOP_STATUSES as string[]).includes(t) ? (t as TrangThaiHop) : "";
    body = await exportBoxes(await adminReports.allBoxes({ trangThai, q }));
    name = `ton-kho-hop-game_${stamp}`;
  } else {
    return Response.json({ error: "Loại báo cáo không hợp lệ." }, { status: 400 });
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": `attachment; filename="${name}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
