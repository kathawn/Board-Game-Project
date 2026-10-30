export const CART_PAGE_SIZE = 8;

export interface PageResult<T> {
  rows: T[];
  total: number;
  page: number;
  totalPages: number;
}

/** Phân trang phía server cho giỏ hàng: kẹp `page` vào [1, totalPages] để
 * xoá bớt dòng ở trang cuối không để lại trang rỗng. */
export function paginate<T>(items: T[], page: number, pageSize = CART_PAGE_SIZE): PageResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), totalPages);
  return {
    rows: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    totalPages,
  };
}

export function parseListParams(url: string): { q: string; filter: string; page: number } {
  const sp = new URL(url).searchParams;
  return {
    q: (sp.get("q") ?? "").trim().toLowerCase(),
    filter: sp.get("filter") ?? "all",
    page: Number(sp.get("page") ?? 1),
  };
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD — dùng để xét ngày thuê đã qua;
 * toISOString() thuần là giờ UTC nên từ 00:00-07:00 sáng sẽ lệch một ngày. */
export function homNayVN(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}
