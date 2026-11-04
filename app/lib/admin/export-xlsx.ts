import ExcelJS from "exceljs";
import type { Analytics } from "./analytics";
import { DON_LABEL, HOP_LABEL, LOAI_LABEL } from "./labels";
import type { DonRow, HopRow, RangeSummary, RevenueLineRow, TrangThaiDon } from "./types";

/** UC-16 (FR-ADM-04, FR-ADM-05): xuất báo cáo ra file Excel (.xlsx). Mỗi hàm trả Buffer — tách khỏi route để test
 * được bằng cách đọc ngược file. Ô tiền là số thật (định dạng #,##0 "đ") và ngày là kiểu ngày thật, nên Admin còn
 * sắp xếp / lọc / tính tổng tiếp được trong Excel. */

const VND_FMT = '#,##0" đ"';
const DATE_FMT = "dd/mm/yyyy";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A2E3A" } };

type Col = { header: string; key: string; width: number; numFmt?: string; align?: "left" | "right" | "center" };

function newBook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BoardVerse";
  wb.created = new Date();
  return wb;
}

function addTable(wb: ExcelJS.Workbook, name: string, cols: Col[], rows: Record<string, unknown>[], totalKeys: string[] = []) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width, style: { numFmt: c.numFmt, alignment: { horizontal: c.align } } }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = HEADER_FILL;
  head.alignment = { vertical: "middle", horizontal: "center" };
  head.height = 22;
  for (const r of rows) ws.addRow(r);
  if (rows.length > 0) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  if (totalKeys.length > 0 && rows.length > 0) {
    const total: Record<string, unknown> = { [cols[0].key]: "Tổng cộng" };
    for (const k of totalKeys) total[k] = rows.reduce((s, r) => s + Number(r[k] ?? 0), 0);
    const tr = ws.addRow(total);
    tr.font = { bold: true };
    tr.border = { top: { style: "thin" } };
  }
  return ws;
}

/** Sheet 2 cột "Chỉ tiêu | Giá trị" cho thông tin tóm tắt (khoảng ngày, tổng doanh thu…). */
function addInfo(wb: ExcelJS.Workbook, name: string, rows: [string, string | number, string?][]) {
  const ws = wb.addWorksheet(name);
  ws.columns = [{ width: 34 }, { width: 24 }];
  for (const [label, value, fmt] of rows) {
    const r = ws.addRow([label, value]);
    r.getCell(1).font = { bold: true };
    if (fmt) r.getCell(2).numFmt = fmt;
    r.getCell(2).alignment = { horizontal: "right" };
  }
  return ws;
}

const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
const ngayVN = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const thangVN = (m: string) => `${m.slice(5, 7)}/${m.slice(0, 4)}`;

async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const REVENUE_COLS: Col[] = [
  { header: "Mã đơn", key: "maDon", width: 14 },
  { header: "Loại", key: "loai", width: 8, align: "center" },
  { header: "Ngày tạo", key: "ngayTao", width: 13, numFmt: DATE_FMT, align: "center" },
  { header: "Khách hàng", key: "khach", width: 26 },
  { header: "Sản phẩm", key: "sanPham", width: 34 },
  { header: "Danh mục", key: "danhMuc", width: 18 },
  { header: "Doanh thu", key: "tien", width: 16, numFmt: VND_FMT },
];

export async function exportRevenue(opts: { from: string; to: string; summary: RangeSummary; lines: RevenueLineRow[]; filter: string }) {
  const { from, to, summary, lines, filter } = opts;
  const wb = newBook();
  addInfo(wb, "Tổng hợp", [
    ["Khoảng ngày", `${ngayVN(from)} – ${ngayVN(to)}`],
    ["Bộ lọc áp dụng cho sheet Giao dịch", filter || "Không"],
    ["Tổng doanh thu", summary.tong, VND_FMT],
    ["Doanh thu bán", summary.ban.doanhThu, VND_FMT],
    ["Số dòng bán", summary.ban.soDon],
    ["Doanh thu thuê", summary.thue.doanhThu, VND_FMT],
    ["Số dòng thuê", summary.thue.soDon],
    ["Ghi chú", "Không tính tiền cọc, phí ship và khoản hoàn."],
  ]);
  addTable(
    wb,
    "Giao dịch",
    REVENUE_COLS,
    lines.map((l) => ({ ...l, loai: LOAI_LABEL[l.loai], ngayTao: toDate(l.ngayTao) })),
    ["tien"],
  );
  return toBuffer(wb);
}

export async function exportOrders(rows: DonRow[]) {
  const wb = newBook();
  addTable(
    wb,
    "Đơn hàng",
    [
      { header: "Mã đơn", key: "maDon", width: 14 },
      { header: "Loại", key: "loai", width: 8, align: "center" },
      { header: "Trạng thái", key: "trangThai", width: 16 },
      { header: "Ngày tạo", key: "ngayTao", width: 13, numFmt: DATE_FMT, align: "center" },
      { header: "Khách hàng", key: "khach", width: 26 },
      { header: "Sản phẩm", key: "sanPham", width: 40 },
      { header: "Giá trị", key: "tien", width: 16, numFmt: VND_FMT },
    ],
    rows.map((r) => ({ ...r, loai: LOAI_LABEL[r.loai], trangThai: DON_LABEL[r.trangThai], ngayTao: toDate(r.ngayTao) })),
  );
  return toBuffer(wb);
}

export async function exportBoxes(rows: HopRow[]) {
  const wb = newBook();
  addTable(
    wb,
    "Hộp game",
    [
      { header: "Mã hộp", key: "maHop", width: 20 },
      { header: "Sản phẩm", key: "sanPham", width: 40 },
      { header: "Trạng thái", key: "trangThai", width: 18 },
    ],
    rows.map((r) => ({ ...r, trangThai: HOP_LABEL[r.trangThai] })),
  );
  return toBuffer(wb);
}

export async function exportAnalytics(opts: {
  from: string;
  to: string;
  data: Analytics & { donTheoTrangThai: Record<TrangThaiDon, number> };
}) {
  const { from, to, data } = opts;
  const wb = newBook();
  addInfo(wb, "Thông tin", [
    ["Khoảng ngày", `${ngayVN(from)} – ${ngayVN(to)}`],
    ["Tổng doanh thu", data.monthly.reduce((s, m) => s + m.ban + m.thue, 0), VND_FMT],
  ]);
  addTable(
    wb,
    "Doanh thu theo tháng",
    [
      { header: "Tháng", key: "thang", width: 12, align: "center" },
      { header: "Doanh thu bán", key: "ban", width: 18, numFmt: VND_FMT },
      { header: "Doanh thu thuê", key: "thue", width: 18, numFmt: VND_FMT },
      { header: "Tổng", key: "tong", width: 18, numFmt: VND_FMT },
    ],
    data.monthly.map((m) => ({ thang: thangVN(m.thang), ban: m.ban, thue: m.thue, tong: m.ban + m.thue })),
    ["ban", "thue", "tong"],
  );
  addTable(
    wb,
    "Top sản phẩm",
    [
      { header: "Hạng", key: "hang", width: 8, align: "center" },
      { header: "Sản phẩm", key: "ten", width: 40 },
      { header: "Doanh thu", key: "doanhThu", width: 18, numFmt: VND_FMT },
    ],
    data.topSanPham.map((r, i) => ({ hang: i + 1, ...r })),
  );
  const tong = data.theoDanhMuc.reduce((s, r) => s + r.doanhThu, 0) || 1;
  addTable(
    wb,
    "Theo danh mục",
    [
      { header: "Danh mục", key: "ten", width: 30 },
      { header: "Doanh thu", key: "doanhThu", width: 18, numFmt: VND_FMT },
      { header: "Tỷ trọng", key: "tyTrong", width: 12, numFmt: "0.0%", align: "right" },
    ],
    data.theoDanhMuc.map((r) => ({ ...r, tyTrong: r.doanhThu / tong })),
    ["doanhThu"],
  );
  addTable(
    wb,
    "Đơn theo trạng thái",
    [
      { header: "Trạng thái", key: "trangThai", width: 20 },
      { header: "Số đơn", key: "soDon", width: 12, numFmt: "#,##0" },
    ],
    (Object.keys(DON_LABEL) as TrangThaiDon[]).map((s) => ({ trangThai: DON_LABEL[s], soDon: data.donTheoTrangThai[s] })),
    ["soDon"],
  );
  return toBuffer(wb);
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
