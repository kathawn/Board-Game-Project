/** Phiếu dán lên thùng hàng cho Staff: đơn thuê ở tab "Chờ bàn giao" và đơn mua ở tab "Chờ giao". Hàm thuần: nhận đơn,
 * trả về HTML khổ A6 (mỗi phiếu một trang, in được nhiều phiếu một lượt). Không đọc thêm dữ liệu nào ngoài đơn — mọi
 * chuỗi do khách nhập (email, tên, địa chỉ) đều được escape vì HTML này được ghi vào iframe in. */

import type { RentalOrder } from "./order-store";
import { tinhPhiShip, uocTinhKhoangCachKm, type DoiTacGiaoVan } from "./deposit";
import { TEN_DOI_TAC } from "../shipping/types";
import type { SaleOrderView } from "../orders/sale-orders";

export interface LabelData {
  id: string;
  loai: "Thue" | "Mua";
  hoTen?: string;
  sdt?: string;
  email: string;
  diaChiNhan: string;
  doiTac: DoiTacGiaoVan;
  items: { ten: string; ghiChu: string }[];
  /** Nhãn + số tiền hiện ở chân phiếu (đơn thuê: tiền cọc đã thu; đơn mua: giá trị đơn). */
  tien: { nhan: string; soTien: number };
  /** Hạn trả (chỉ đơn thuê), yyyy-mm-dd. */
  hanTra?: string;
}

export function rentalLabel(order: RentalOrder): LabelData {
  return {
    id: order.id,
    loai: "Thue",
    hoTen: order.hoTen,
    sdt: order.sdt,
    email: order.email,
    diaChiNhan: order.diaChiNhan,
    doiTac: order.doiTac,
    items: order.lines.map((l) => ({ ten: l.productName, ghiChu: `${ddmmyyyy(l.startDate)} → ${ddmmyyyy(l.endDate)}` })),
    tien: { nhan: "Tiền cọc đã thu", soTien: order.tongTienCoc },
    hanTra: order.lines.map((l) => l.endDate).sort().at(-1),
  };
}

export function saleLabel(order: SaleOrderView): LabelData {
  return {
    id: order.id,
    loai: "Mua",
    hoTen: order.hoTen,
    sdt: order.sdt,
    email: order.email,
    diaChiNhan: order.diaChiNhan,
    // Đơn mua chưa có vận đơn ở tab "Chờ giao": đối tác dự kiến chọn theo khoảng cách như lúc bàn giao.
    doiTac: tinhPhiShip(uocTinhKhoangCachKm(order.diaChiNhan)).doiTac,
    items: order.lines.map((l) => ({ ten: l.productName, ghiChu: `SL ${l.soLuong}${l.maHop ? ` · ${l.maHop}` : ""}` })),
    tien: { nhan: "Giá trị đơn (đã thanh toán)", soTien: order.tongTienHang },
  };
}

const VND = (n: number) => n.toLocaleString("vi-VN") + "đ";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** yyyy-mm-dd → dd/mm/yyyy; chuỗi không đúng dạng thì giữ nguyên. */
function ddmmyyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ---------- Mã vạch Code 39 ---------- */

/** Mỗi ký tự 9 phần tử xen kẽ vạch/khoảng trắng (bắt đầu bằng vạch); w = rộng, n = hẹp. */
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
  F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
  P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
};

/** Danh sách [rộng, là vạch đen] của chuỗi `*TEXT*`; ký tự ngoài bảng Code 39 bị thay bằng "-". */
export function code39Elements(text: string): { w: number; bar: boolean }[] {
  const clean = text.toUpperCase().replace(/[^0-9A-Z\-. ]/g, "-");
  const out: { w: number; bar: boolean }[] = [];
  [..."*" + clean + "*"].forEach((ch, ci) => {
    if (ci > 0) out.push({ w: 1, bar: false }); // khoảng hẹp giữa hai ký tự
    [...CODE39[ch]].forEach((e, i) => out.push({ w: e === "w" ? 3 : 1, bar: i % 2 === 0 }));
  });
  return out;
}

export function code39Svg(text: string): string {
  const els = code39Elements(text);
  const total = els.reduce((s, e) => s + e.w, 0);
  let x = 0;
  const rects: string[] = [];
  for (const e of els) {
    if (e.bar) rects.push(`<rect x="${x}" y="0" width="${e.w}" height="40"/>`);
    x += e.w;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 40" preserveAspectRatio="none" shape-rendering="crispEdges" style="width:100%;height:11mm;display:block" role="img" aria-label="Mã vạch ${escapeHtml(text)}">${rects.join("")}</svg>`;
}

/* ---------- HTML phiếu ---------- */

const STYLE = `
  @page { size: A6; margin: 6mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11px; line-height: 1.35; }
  .page { page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .label { border: 1.5px solid #000; padding: 4mm; }
  .head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #000; padding-bottom: 2mm; }
  .brand { font-weight: 700; font-size: 13px; }
  .tag { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
  .code { font-size: 26px; font-weight: 800; letter-spacing: .03em; margin: 2.5mm 0 1mm; }
  .bar { margin: 0 0 1mm; padding: 0 1mm; }
  .k { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; margin-top: 2mm; }
  .v { font-size: 12px; font-weight: 600; }
  .carrier { display: inline-block; border: 1.5px solid #000; padding: 1mm 2.5mm; font-weight: 800; font-size: 13px; margin-top: 1mm; }
  table { width: 100%; border-collapse: collapse; margin-top: 1mm; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #000; padding: 1mm 0; }
  td { padding: 1.2mm 0; border-bottom: 1px dotted #777; vertical-align: top; }
  .nowrap { white-space: nowrap; padding-left: 2mm; }
  .foot { display: flex; justify-content: space-between; gap: 4mm; margin-top: 3mm; border-top: 1.5px solid #000; padding-top: 2mm; font-size: 10px; }
  .box { display: inline-block; width: 3.2mm; height: 3.2mm; border: 1px solid #000; vertical-align: -0.5mm; margin-right: 1mm; }
  .warn { margin-top: 2mm; font-size: 9.5px; font-weight: 700; text-align: center; border: 1px dashed #000; padding: 1mm; }
`;

function labelBody(d: LabelData, printedAt: Date): string {
  const rows = d.items
    .map((i) => `<tr><td>${escapeHtml(i.ten)}</td><td class="nowrap">${escapeHtml(i.ghiChu)}</td></tr>`)
    .join("");
  const nguoiNhan = [d.hoTen, d.sdt].filter(Boolean).map((s) => escapeHtml(s as string)).join(" · ");
  return `<div class="label">
    <div class="head"><span class="brand">BoardVerse</span><span class="tag">${d.loai === "Thue" ? "Đơn thuê" : "Đơn mua"} · Giao hàng</span></div>
    <div class="code">${escapeHtml(d.id)}</div>
    <div class="bar">${code39Svg(d.id)}</div>

    <div class="k">Người nhận</div>
    <div class="v">${nguoiNhan || "(chưa có tên / SĐT)"}</div>
    <div class="k">Giao tới</div>
    <div class="v">${escapeHtml(d.diaChiNhan)}</div>
    <div class="k">Email</div>
    <div>${escapeHtml(d.email)}</div>
    <div class="k">Đơn vị giao vận</div>
    <div class="carrier">${escapeHtml(TEN_DOI_TAC[d.doiTac])}</div>

    <div class="k">${d.loai === "Thue" ? "Sản phẩm thuê" : "Sản phẩm"} (${d.items.length})</div>
    <table>
      <thead><tr><th>Tên game</th><th class="nowrap">${d.loai === "Thue" ? "Thời gian thuê" : "Số lượng"}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="foot">
      <div>
        <div><span class="box"></span>Đã kiểm đủ linh kiện</div>
        <div style="margin-top:1mm"><span class="box"></span>Đã niêm phong hộp</div>
      </div>
      <div style="text-align:right">
        <div class="k" style="margin-top:0">${escapeHtml(d.tien.nhan)}</div>
        <div class="v">${VND(d.tien.soTien)}</div>
        ${d.hanTra ? `<div class="k">Hạn trả</div><div class="v">${ddmmyyyy(d.hanTra)}</div>` : ""}
      </div>
    </div>
    <div class="warn">${d.loai === "Thue" ? "Không bóc phiếu · Giữ nguyên hộp để kiểm đếm khi trả" : "Hàng dễ vỡ · Không bóc phiếu"}</div>
    <div style="margin-top:1.5mm;font-size:8px;text-align:right">In lúc ${printedAt.toLocaleString("vi-VN")}</div>
  </div>`;
}

/** Một hoặc nhiều phiếu trong cùng tài liệu; mỗi phiếu một trang A6. */
export function buildLabelsHtml(labels: LabelData[], printedAt: Date = new Date()): string {
  const title = labels.length === 1 ? `Phiếu ${escapeHtml(labels[0].id)}` : `${labels.length} phiếu giao hàng`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
${labels.map((d) => `<div class="page">${labelBody(d, printedAt)}</div>`).join("\n")}
</body>
</html>`;
}

/** Mở hộp thoại in trong một iframe ẩn (không mở tab mới, không đụng giao diện trang Staff). */
export function printLabels(labels: LabelData[]): void {
  if (labels.length === 0) return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.srcdoc = buildLabelsHtml(labels);
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // Giữ iframe đủ lâu để hộp thoại in đọc xong nội dung rồi mới gỡ.
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
}
