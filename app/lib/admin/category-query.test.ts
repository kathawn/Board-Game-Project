import { describe, expect, it } from "vitest";
import { queryCategories, foldVi, CATEGORY_PAGE_SIZE } from "./category-query";
import { validateCategoryName } from "./validate";
import type { AdminCategory } from "./types";

const all: AdminCategory[] = [
  { ten: "Chiến thuật", soSanPham: 5, doanhThu: 900 },
  { ten: "Gia đình", soSanPham: 3, doanhThu: 1200 },
  { ten: "Cờ tỷ phú", soSanPham: 0, doanhThu: 0 },
  { ten: "Party", soSanPham: 0, doanhThu: 0 },
];

describe("queryCategories", () => {
  it("tìm không phân biệt dấu/hoa thường", () => {
    expect(foldVi("Đồ Cờ Tỷ Phú")).toBe("do co ty phu");
    const r = queryCategories(all, { q: "co ty", tab: "", sort: "ten", page: 1 });
    expect(r.items.map((c) => c.ten)).toEqual(["Cờ tỷ phú"]);
  });

  it("đếm tab theo từ khoá, lọc tab Trống / Có sản phẩm", () => {
    const r = queryCategories(all, { q: "", tab: "trong", sort: "ten", page: 1 });
    expect(r.counts).toEqual({ all: 4, coSanPham: 2, trong: 2 });
    expect(r.items.map((c) => c.ten)).toEqual(["Cờ tỷ phú", "Party"]);
    const r2 = queryCategories(all, { q: "gia", tab: "co-san-pham", sort: "ten", page: 1 });
    expect(r2.counts).toEqual({ all: 1, coSanPham: 1, trong: 0 });
  });

  it("sắp xếp theo doanh thu giảm dần", () => {
    const r = queryCategories(all, { q: "", tab: "", sort: "doanh-thu", page: 1 });
    expect(r.items[0].ten).toBe("Gia đình");
  });

  it("phân trang kẹp trang hợp lệ", () => {
    const many = Array.from({ length: CATEGORY_PAGE_SIZE + 1 }, (_, i) => ({
      ten: `DM ${String(i).padStart(2, "0")}`,
      soSanPham: 1,
      doanhThu: 0,
    }));
    const r = queryCategories(many, { q: "", tab: "", sort: "ten", page: 99 });
    expect(r.totalPages).toBe(2);
    expect(r.page).toBe(2);
    expect(r.items).toHaveLength(1);
  });
});

describe("validateCategoryName", () => {
  it("gọn khoảng trắng, chặn rỗng và quá dài", () => {
    expect(validateCategoryName("  Cờ   gia đình ")).toEqual({ ok: true, ten: "Cờ gia đình" });
    expect(validateCategoryName("   ").ok).toBe(false);
    expect(validateCategoryName("x".repeat(101)).ok).toBe(false);
    expect(validateCategoryName(5).ok).toBe(false);
  });
});
