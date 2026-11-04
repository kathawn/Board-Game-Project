import { describe, expect, test } from "vitest";
import { buildLabelsHtml, code39Elements, code39Svg, escapeHtml, rentalLabel, saleLabel } from "./label";
import { ngayMaiVN, type RentalOrder } from "./order-store";
import type { SaleOrderView } from "../orders/sale-orders";

const order: RentalOrder = {
  id: "DT-00007",
  email: "khach@example.com",
  hoTen: "Nguyễn Văn An",
  sdt: "0901234567",
  trangThai: "Confirmed",
  ngayTao: "2026-11-01",
  diaChiNhan: "12 Xuân Thủy, Cầu Giấy, Hà Nội",
  doiTac: "GreenSM",
  lines: [
    { productSlug: "catan", productName: "Catan", startDate: "2026-11-05", endDate: "2026-11-08", tienThue: 100000, tienCoc: 500000 },
    { productSlug: "uno", productName: "UNO", startDate: "2026-11-05", endDate: "2026-11-10", tienThue: 50000, tienCoc: 200000 },
  ],
  tongTienThue: 150000,
  tongTienCoc: 700000,
  shipments: [],
};

const sale: SaleOrderView = {
  id: "DH-00231",
  email: "khach@example.com",
  hoTen: "Trần Thị Bình",
  sdt: "0987654321",
  ngayTao: "2026-11-02",
  diaChiNhan: "5 Cầu Giấy, Hà Nội",
  stage: "ChoGiao",
  lines: [{ productName: "UNO", soLuong: 2, thanhTien: 100000, maHop: "UNO-001" }],
  tongTienHang: 100000,
  shipments: [],
};

describe("phiếu dán đơn thuê", () => {
  test("hiển thị mã đơn, người nhận, địa chỉ, đối tác, từng sản phẩm, tổng cọc và hạn trả muộn nhất", () => {
    const html = buildLabelsHtml([rentalLabel(order)], new Date("2026-11-04T08:00:00Z"));
    expect(html).toContain("DT-00007");
    expect(html).toContain("Nguyễn Văn An · 0901234567");
    expect(html).toContain("12 Xuân Thủy, Cầu Giấy, Hà Nội");
    expect(html).toContain("Catan");
    expect(html).toContain("UNO");
    expect(html).toContain("05/11/2026 → 08/11/2026");
    expect(html).toContain("700.000đ");
    expect(html).toContain("10/11/2026");
    expect(html).toContain("<svg");
  });

  test("khách chưa có tên/SĐT thì phiếu ghi rõ thay vì để trống", () => {
    const html = buildLabelsHtml([rentalLabel({ ...order, hoTen: undefined, sdt: undefined })]);
    expect(html).toContain("(chưa có tên / SĐT)");
  });

  test("escape chuỗi do khách nhập để không chèn được HTML vào phiếu", () => {
    const html = buildLabelsHtml([rentalLabel({ ...order, diaChiNhan: '<img src=x onerror="alert(1)">', hoTen: "<b>x</b>" })]);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>x");
    expect(html).toContain("&lt;img");
    expect(escapeHtml(`a&b<'">`)).toBe("a&amp;b&lt;&#39;&quot;&gt;");
  });
});

describe("in nhiều phiếu / phiếu đơn mua", () => {
  test("mỗi phiếu một trang A6", () => {
    const html = buildLabelsHtml([rentalLabel(order), saleLabel(sale)]);
    expect(html.match(/class="page"/g)).toHaveLength(2);
    expect(html).toContain("2 phiếu giao hàng");
  });

  test("phiếu đơn mua có số lượng, mã hộp, giá trị đơn và không có hạn trả", () => {
    const html = buildLabelsHtml([saleLabel(sale)]);
    expect(html).toContain("Đơn mua");
    expect(html).toContain("SL 2 · UNO-001");
    expect(html).toContain("100.000đ");
    expect(html).not.toContain("Hạn trả");
  });
});

describe("mã vạch Code 39", () => {
  test("bọc * ở hai đầu, mỗi ký tự 9 phần tử (3 rộng), có 1 khoảng hẹp giữa các ký tự", () => {
    const els = code39Elements("DT-1");
    // 6 ký tự (*,D,T,-,1,*) × 9 phần tử + 5 khoảng giữa
    expect(els).toHaveLength(6 * 9 + 5);
    const rongTrongKyTu = els.filter((e) => e.w === 3).length;
    expect(rongTrongKyTu).toBe(6 * 3);
    // ký tự đầu/cuối của chuỗi luôn là vạch đen
    expect(els[0].bar).toBe(true);
    expect(els.at(-1)!.bar).toBe(true);
  });

  test("ký tự đầu '*' đúng mẫu chuẩn nwnnwnwnn", () => {
    const els = code39Elements("");
    // "*" + "*" → 9 + 1 + 9 phần tử; 9 phần tử đầu = mẫu của '*'
    const mau = els.slice(0, 9).map((e) => (e.w === 3 ? "w" : "n")).join("");
    expect(mau).toBe("nwnnwnwnn");
  });

  test("SVG nhúng được mã đơn, ký tự lạ bị thay bằng '-'", () => {
    expect(code39Svg("DT-00001")).toContain("<rect");
    expect(code39Elements("a_b").length).toBe(code39Elements("A-B").length);
  });
});

describe("mốc giao gấp", () => {
  test("ngày mai theo giờ Việt Nam (UTC+7)", () => {
    // 20:00 UTC ngày 4/11 = 03:00 ngày 5/11 giờ VN → ngày mai là 6/11
    expect(ngayMaiVN(new Date("2026-11-04T20:00:00Z"))).toBe("2026-11-06");
    expect(ngayMaiVN(new Date("2026-11-04T05:00:00Z"))).toBe("2026-11-05");
  });
});
