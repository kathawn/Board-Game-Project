import type { AdminCategory, AdminCategoryPage, CategorySort, CategoryTab } from "./types";

/** Tìm/lọc/sắp xếp/phân trang danh mục — hàm thuần để test không cần DB. Danh mục ít (vài chục) nên gom hết rồi
 * lọc trong bộ nhớ ở server; client chỉ nhận đúng một trang. */

export const CATEGORY_PAGE_SIZE = 8;

/** Bỏ dấu + hạ chữ thường để "co ty phu" tìm được "Cờ tỷ phú". */
export function foldVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function queryCategories(
  all: AdminCategory[],
  opts: { q: string; tab: CategoryTab; sort: CategorySort; page: number },
): AdminCategoryPage {
  const k = foldVi(opts.q.trim());
  const matched = k ? all.filter((c) => foldVi(c.ten).includes(k)) : all;
  const counts = {
    all: matched.length,
    coSanPham: matched.filter((c) => c.soSanPham > 0).length,
    trong: matched.filter((c) => c.soSanPham === 0).length,
  };
  const byTab = matched.filter((c) =>
    opts.tab === "co-san-pham" ? c.soSanPham > 0 : opts.tab === "trong" ? c.soSanPham === 0 : true,
  );
  const byName = (a: AdminCategory, b: AdminCategory) => a.ten.localeCompare(b.ten, "vi");
  const sorted = [...byTab].sort(
    opts.sort === "san-pham"
      ? (a, b) => b.soSanPham - a.soSanPham || byName(a, b)
      : opts.sort === "doanh-thu"
        ? (a, b) => b.doanhThu - a.doanhThu || byName(a, b)
        : byName,
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / CATEGORY_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Math.floor(opts.page) || 1));
  return {
    items: sorted.slice((page - 1) * CATEGORY_PAGE_SIZE, page * CATEGORY_PAGE_SIZE),
    total: sorted.length,
    page,
    totalPages,
    counts,
  };
}
