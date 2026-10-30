// MOCKUP UC-15 — dữ liệu giả trong bộ nhớ để duyệt giao diện (Gate 1). Sau khi mockup được duyệt, file này
// bị thay bằng API thật đọc/ghi bảng SanPham (FR-ADM-03). Hàm queryProducts mô phỏng đúng hợp đồng của API
// phía server: tìm kiếm / lọc danh mục / phân trang chạy ở "server", client chỉ nhận một trang tóm tắt.
import { PRODUCTS, type LinhKien } from "@/lib/products";

export interface AdminProduct {
  slug: string;
  ten: string;
  danhMuc: string;
  giaNiemYet: number;
  moTaNgan: string;
  soNguoiMin: number;
  soNguoiMax: number;
  linhKien: LinhKien[];
  /** Số hộp game ở trạng thái Available / tổng số hộp (chỉ đọc — quản lý hộp ở UC-09). */
  soHopSan: number;
  soHopTong: number;
  /** Số dòng đơn hàng đã tham chiếu sản phẩm — > 0 thì không xoá cứng được. */
  soDonLienQuan: number;
}

const DANH_MUC_DEMO = [
  "Chiến thuật - Xây dựng",
  "Party - Từ vựng",
  "Bài - Gia đình",
  "Suy luận - Xã hội",
  "Nhập vai - Chiến thuật",
];

function build(): AdminProduct[] {
  const real: AdminProduct[] = PRODUCTS.map((p, i) => ({
    slug: p.slug,
    ten: p.ten,
    danhMuc: p.danhMuc,
    giaNiemYet: p.giaNiemYet,
    moTaNgan: p.moTaNgan,
    soNguoiMin: p.soNguoiMin,
    soNguoiMax: p.soNguoiMax,
    linhKien: p.linhKien.map((l) => ({ ...l })),
    soHopSan: p.soLuongTon,
    soHopTong: Math.max(p.soLuongTon, 2),
    soDonLienQuan: i % 3 === 0 ? 4 : 0,
  }));
  // Thêm ~32 sản phẩm demo để duyệt layout khi danh mục dài (xoá khi làm backend thật).
  const extra: AdminProduct[] = Array.from({ length: 32 }, (_, i) => {
    const n = i + 1;
    return {
      slug: `demo-game-${n}`,
      ten: `Demo Game ${String(n).padStart(2, "0")}`,
      danhMuc: DANH_MUC_DEMO[i % DANH_MUC_DEMO.length],
      giaNiemYet: 150000 + (i % 9) * 85000,
      moTaNgan: "Sản phẩm mẫu để xem giao diện khi danh mục có nhiều bản ghi.",
      soNguoiMin: 2,
      soNguoiMax: 2 + (i % 5),
      linhKien: [
        { ten: "Bộ thẻ bài", docBan: true },
        { ten: "Xúc xắc", docBan: false, soLuong: 2, giaLe: 8000 },
      ],
      soHopSan: i % 7 === 0 ? 0 : 2,
      soHopTong: 2,
      soDonLienQuan: i % 4 === 0 ? 2 : 0,
    };
  });
  return [...real, ...extra];
}

let db: AdminProduct[] = build();

export const PAGE_SIZE = 10;

export interface ProductPage {
  items: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
  /** Đếm theo danh mục trên kết quả đã áp dụng từ khoá (không áp dụng bộ lọc danh mục), để chip hiện số. */
  categoryCounts: Record<string, number>;
  totalAll: number;
}

export function queryProducts(opts: { q: string; danhMuc: string; page: number }): ProductPage {
  const q = opts.q.trim().toLowerCase();
  const byKeyword = db.filter((p) => !q || p.ten.toLowerCase().includes(q) || p.slug.includes(q));
  const categoryCounts: Record<string, number> = {};
  for (const p of byKeyword) categoryCounts[p.danhMuc] = (categoryCounts[p.danhMuc] ?? 0) + 1;

  const filtered = byKeyword.filter((p) => !opts.danhMuc || p.danhMuc === opts.danhMuc);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page), totalPages);
  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    totalPages,
    categoryCounts,
    totalAll: byKeyword.length,
  };
}

export function getProduct(slug: string): AdminProduct | undefined {
  return db.find((p) => p.slug === slug);
}

export function saveProduct(p: AdminProduct, isNew: boolean): { ok: true } | { ok: false; error: string } {
  if (isNew && db.some((x) => x.slug === p.slug)) return { ok: false, error: "Slug đã tồn tại." };
  db = isNew ? [p, ...db] : db.map((x) => (x.slug === p.slug ? p : x));
  return { ok: true };
}

export function deleteProduct(slug: string): { ok: true } | { ok: false; error: string } {
  const p = getProduct(slug);
  if (!p) return { ok: false, error: "Không tìm thấy sản phẩm." };
  if (p.soDonLienQuan > 0) {
    return {
      ok: false,
      error: `Không thể xoá: sản phẩm đã có ${p.soDonLienQuan} dòng đơn hàng. Hãy giữ lại để bảo toàn lịch sử đơn.`,
    };
  }
  db = db.filter((x) => x.slug !== slug);
  return { ok: true };
}

export function allCategories(): string[] {
  return Array.from(new Set(db.map((p) => p.danhMuc))).sort();
}
