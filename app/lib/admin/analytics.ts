import type { RevenueLineRow } from "./types";

/** UC-16 (FR-ADM-04): gom các dòng doanh thu thành dữ liệu cho biểu đồ phân tích — hàm thuần để test không cần DB.
 * Cùng quy ước tiền với lib/admin/reports.ts nên tổng các biểu đồ luôn khớp tổng ở bảng giao dịch. */

export interface MonthPoint {
  thang: string; // yyyy-mm
  ban: number;
  thue: number;
}
export interface RankedRow {
  ten: string;
  doanhThu: number;
}

export interface Analytics {
  monthly: MonthPoint[];
  topSanPham: RankedRow[];
  theoDanhMuc: RankedRow[];
}

/** Mọi tháng yyyy-mm nằm trong [from, to] (kể cả tháng không có doanh thu — để đường không bị đứt). */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const endY = Number(to.slice(0, 4));
  const endM = Number(to.slice(5, 7));
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export const TOP_SAN_PHAM = 8;

export function buildAnalytics(lines: RevenueLineRow[], from: string, to: string): Analytics {
  const monthly = new Map<string, MonthPoint>(monthsBetween(from, to).map((t) => [t, { thang: t, ban: 0, thue: 0 }]));
  const bySp = new Map<string, number>();
  const byDm = new Map<string, number>();

  for (const l of lines) {
    const p = monthly.get(l.ngayTao.slice(0, 7));
    if (p) {
      if (l.loai === "Ban") p.ban += l.tien;
      else p.thue += l.tien;
    }
    bySp.set(l.sanPham, (bySp.get(l.sanPham) ?? 0) + l.tien);
    byDm.set(l.danhMuc, (byDm.get(l.danhMuc) ?? 0) + l.tien);
  }

  const rank = (m: Map<string, number>): RankedRow[] =>
    [...m.entries()]
      .map(([ten, doanhThu]) => ({ ten, doanhThu }))
      .filter((r) => r.doanhThu > 0)
      .sort((a, b) => b.doanhThu - a.doanhThu || a.ten.localeCompare(b.ten, "vi"));

  return { monthly: [...monthly.values()], topSanPham: rank(bySp).slice(0, TOP_SAN_PHAM), theoDanhMuc: rank(byDm) };
}
