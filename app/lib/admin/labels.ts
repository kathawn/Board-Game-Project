import type { TrangThaiDon, TrangThaiHop } from "./types";

/** Nhãn tiếng Việt cho trạng thái đơn / hộp game — dùng chung giữa trang Báo cáo và file Excel xuất ra. */

export const DON_LABEL: Record<TrangThaiDon, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Active: "Đang thuê",
  Overdue: "Quá hạn",
  Completed: "Hoàn tất trả",
  Closed: "Đã đóng",
  Cancelled: "Đã huỷ",
};

export const HOP_LABEL: Record<TrangThaiHop, string> = {
  Available: "Sẵn sàng",
  Reserved: "Đã đặt giữ",
  Rented: "Đang cho thuê",
  Checking: "Đang kiểm đếm",
  Damaged: "Hư hỏng",
  Sold: "Đã bán",
};

export const LOAI_LABEL = { Ban: "Bán", Thue: "Thuê" } as const;
