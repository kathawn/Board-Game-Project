import { describe, expect, it } from "vitest";
import { buildAnalytics, monthsBetween, TOP_SAN_PHAM } from "./analytics";
import type { RevenueLineRow } from "./types";

const line = (o: Partial<RevenueLineRow>): RevenueLineRow => ({
  maDon: "M1",
  loai: "Ban",
  ngayTao: "2026-10-05",
  khach: "A",
  sanPham: "Catan",
  danhMuc: "Chiến thuật",
  tien: 100,
  ...o,
});

describe("monthsBetween", () => {
  it("liệt kê đủ tháng, qua năm mới", () => {
    expect(monthsBetween("2026-11-01", "2027-02-28")).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
  });
});

describe("buildAnalytics", () => {
  const lines = [
    line({ tien: 300 }),
    line({ loai: "Thue", tien: 50, ngayTao: "2026-09-10", sanPham: "Codenames", danhMuc: "Party" }),
    line({ tien: 70, ngayTao: "2026-10-20", sanPham: "Codenames", danhMuc: "Party" }),
  ];
  const a = buildAnalytics(lines, "2026-08-01", "2026-10-31");

  it("tổng theo tháng tách Bán / Thuê và giữ tháng trống", () => {
    expect(a.monthly).toEqual([
      { thang: "2026-08", ban: 0, thue: 0 },
      { thang: "2026-09", ban: 0, thue: 50 },
      { thang: "2026-10", ban: 370, thue: 0 },
    ]);
  });

  it("xếp hạng sản phẩm và danh mục giảm dần; tổng khớp tổng dòng", () => {
    expect(a.topSanPham).toEqual([
      { ten: "Catan", doanhThu: 300 },
      { ten: "Codenames", doanhThu: 120 },
    ]);
    expect(a.theoDanhMuc.map((r) => r.ten)).toEqual(["Chiến thuật", "Party"]);
    expect(a.theoDanhMuc.reduce((s, r) => s + r.doanhThu, 0)).toBe(420);
  });

  it("chỉ lấy tối đa TOP_SAN_PHAM sản phẩm", () => {
    const many = Array.from({ length: TOP_SAN_PHAM + 3 }, (_, i) => line({ sanPham: `SP${i}`, tien: 10 + i }));
    expect(buildAnalytics(many, "2026-10-01", "2026-10-31").topSanPham).toHaveLength(TOP_SAN_PHAM);
  });
});
