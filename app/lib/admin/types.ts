// Kiểu dùng chung giữa trang Admin (client) và API — KHÔNG import code phía server ở đây.

/** Một dòng trong danh sách (nhẹ: chỉ đủ để hiển thị 1 dòng). */
export interface AdminProductSummary {
  slug: string;
  ten: string;
  danhMuc: string;
  giaNiemYet: number;
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
