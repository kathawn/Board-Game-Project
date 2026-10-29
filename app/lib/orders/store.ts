/** FR-BH-05 (BR-08, UC-02): kiểu dữ liệu của lịch sử đơn mua/thuê. Dữ liệu thật đọc từ bảng DonHang
 * (app/api/orders/route.ts); đơn mẫu do prisma/seed.ts nạp. */

import type { Shipment } from "../shipping/types";

export type LoaiDon = "Ban" | "Thue";
export type TrangThaiDon = "Pending" | "Confirmed" | "Active" | "Overdue" | "Completed" | "Closed";

export interface DonHang {
  id: string;
  loai: LoaiDon;
  trangThai: TrangThaiDon;
  ngayTao: string;
  sanPham: string;
  chiTiet: string;
  tongTien: number;
  /** UC-11/UC-12: địa chỉ nhận (mặc định cho địa chỉ lấy hàng trả) và vận đơn hai chiều của đơn thuê. */
  diaChiNhan?: string;
  shipments?: Shipment[];
}
