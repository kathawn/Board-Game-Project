// Kiểu dùng chung giữa trang Admin (client) và API — KHÔNG import code phía server ở đây.

/** Một dòng trong danh sách (nhẹ: chỉ đủ để hiển thị 1 dòng, kèm ảnh thumbnail). */
export interface AdminProductSummary {
  slug: string;
  ten: string;
  danhMuc: string;
  giaNiemYet: number;
  anh: string | null;
}

/** Chi tiết một sản phẩm (chỉ tải cho sản phẩm đang chọn). */
export interface AdminProduct extends AdminProductSummary {
  moTaNgan: string;
  soNguoiMin: number;
  soNguoiMax: number;
  /** Chỉ đọc — số hộp Available / tổng số hộp (quản lý hộp ở UC-09). */
  soHopSan: number;
  soHopTong: number;
  /** Chỉ đọc — số dòng đơn đã tham chiếu sản phẩm; > 0 thì không xoá được. */
  soDonLienQuan: number;
  /** Chỉ đọc — số linh kiện trong checklist. */
  soLinhKien: number;
  /** Đường dẫn ảnh hiện tại (null = chưa có ảnh, dùng ảnh mặc định). */
  anh: string | null;
}

/** Trường Admin được phép nhập khi thêm/sửa. */
export interface AdminProductInput {
  slug: string;
  ten: string;
  danhMuc: string;
  giaNiemYet: number;
  moTaNgan: string;
  soNguoiMin: number;
  soNguoiMax: number;
}

/** Một danh mục tổng hợp từ SanPham.danhMuc (xem lib/admin/categories.ts) — không phải một bảng riêng. */
export interface AdminCategory {
  ten: string;
  soSanPham: number;
  doanhThu: number;
}

export interface AdminProductPage {
  items: AdminProductSummary[];
  total: number;
  page: number;
  totalPages: number;
  /** Đếm theo danh mục trên kết quả đã áp dụng từ khoá (chưa áp dụng bộ lọc danh mục), để chip hiện số. */
  categoryCounts: Record<string, number>;
  totalAll: number;
  categories: string[];
}

// ===== UC-16 (FR-ADM-04, FR-ADM-05) — Báo cáo chi tiết, dùng chung client/API (xem lib/admin/reports.ts) =====

export type LoaiDon = "Ban" | "Thue";
export type TrangThaiDon = "Pending" | "Confirmed" | "Active" | "Overdue" | "Completed" | "Closed";
export type TrangThaiHop = "Available" | "Reserved" | "Rented" | "Checking" | "Damaged" | "Sold";

export interface RevenueLineRow {
  maDon: string;
  loai: LoaiDon;
  ngayTao: string;
  khach: string;
  sanPham: string;
  tien: number;
}
export interface DonRow {
  maDon: string;
  loai: LoaiDon;
  trangThai: TrangThaiDon;
  ngayTao: string;
  khach: string;
  sanPham: string;
  tien: number;
}
export interface HopRow {
  maHop: string;
  sanPham: string;
  trangThai: TrangThaiHop;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
export interface RangeSummary {
  ban: { soDon: number; doanhThu: number };
  thue: { soDon: number; doanhThu: number };
  tong: number;
  soDon: number;
}
export interface MonthSummary extends RangeSummary {
  thang: string;
}
