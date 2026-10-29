import type { DoiTacGiaoVan } from "../rentals/deposit";

/** FR-TTGV-03/04/05 (BR-09): kiểu dữ liệu dùng chung cho giao vận hai chiều. Giá trị khớp ENUM trong
 * ERD (SRS 3.5) và CHECK ở migration: chieu, doi_tac, trang_thai_vanchuyen. */
export type ChieuGiaoVan = "Nhan" | "Tra";
export type TrangThaiVanChuyen = "DangGiao" | "DaGiao" | "DangLay" | "DaLay";

export interface Shipment {
  chieu: ChieuGiaoVan;
  doiTac: DoiTacGiaoVan;
  maVanDon: string;
  khoangCachKm: number;
  phiShip: number;
  trangThai: TrangThaiVanChuyen;
}

/** Mỗi chiều chỉ có đúng 2 trạng thái, theo thứ tự tiến: chiều giao DangGiao → DaGiao; chiều lấy trả
 * DangLay → DaLay (FR-TTGV-05). Trạng thái đầu của chiều là trạng thái lúc vừa tạo vận đơn. */
export const TRANG_THAI_THEO_CHIEU: Record<ChieuGiaoVan, readonly [TrangThaiVanChuyen, TrangThaiVanChuyen]> = {
  Nhan: ["DangGiao", "DaGiao"],
  Tra: ["DangLay", "DaLay"],
};

export function isTrangThaiVanChuyen(value: unknown): value is TrangThaiVanChuyen {
  return value === "DangGiao" || value === "DaGiao" || value === "DangLay" || value === "DaLay";
}

export const TEN_DOI_TAC: Record<DoiTacGiaoVan, string> = {
  GreenSM: "Green SM",
  ShopeeExpress: "Shopee Express",
};
