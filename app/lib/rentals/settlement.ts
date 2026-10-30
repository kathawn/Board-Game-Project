/** Quy tắc tính tiền khi trả hàng (UC-07/UC-08) — hàm thuần, không đụng DB, dùng chung cho server và giao diện
 * kiểm đếm của Staff (xem trước tổng đền bù khi đang đánh dấu).
 *
 *  - BRU-03 / FR-CT-06: phạt trễ hạn 15% giá niêm yết mỗi ngày trễ, trần 100% giá niêm yết của sản phẩm.
 *  - BRU-04 / FR-CT-07: đền bù linh kiện thiếu/hư hỏng — độc bản: 100% giá nguyên bộ; phụ kiện bán lẻ: giá lẻ niêm
 *    yết × số lượng; phụ kiện nhà phân phối không bán lẻ: 20% giá bộ × số lượng. Tổng đền bù một sản phẩm không
 *    vượt 100% giá bộ (SRS không nêu trần này; đặt trần để đền bù không bao giờ lớn hơn giá trị cả bộ).
 *  - FR-TTGV-08: chênh lệch phí ship = phần ship CHIỀU TRẢ đã giữ trong cọc − phí ship chiều trả thực tế
 *    (dương = hoàn thêm cho khách, âm = thu thêm). Cọc giữ ship chiều giao × 2 (BRU-01) nên phần giữ cho chiều trả
 *    của mỗi sản phẩm bằng phiShipGiu / (2 × số dòng đơn).
 *  - FR-CT-07: hoàn cọc = cọc đã thu − phạt − đền bù + chênh lệch ship. Âm thì không trừ âm: khách phải trả thêm
 *    (UC-07 luồng ngoại lệ 4a), thu qua QR (UC-10). */

export type KetQuaKiemDem = "Du" | "Loi";

export const TY_LE_PHAT_MOI_NGAY = 0.15;
export const TY_LE_DEN_BU_PHU_KIEN_KHONG_BAN_LE = 0.2;

/** Một linh kiện trong checklist gốc của tựa game (bảng LinhKien). */
export interface LinhKienChecklist {
  id: string;
  ten: string;
  docBan: boolean;
  soLuong: number;
  /** Giá lẻ niêm yết; null = nhà phân phối không bán lẻ. */
  giaLe: number | null;
}

/** Kết quả kiểm đếm một linh kiện, lưu trong BienBanKiemDem.ketQua (JSON). */
export interface MucKiemDem {
  linhKienId: string;
  ten: string;
  docBan: boolean;
  soLuong: number;
  ketQua: KetQuaKiemDem;
  /** Số lượng thiếu/hư hỏng (0 khi Du; độc bản luôn 1 = mất cả bộ). */
  soLuongLoi: number;
  /** Đơn giá đền bù chốt tại thời điểm kiểm đếm. */
  donGiaDenBu: number;
}

export interface BienBanKiemDemJson {
  /** Mã hộp game vật lý đã kiểm đếm (để trả hộp Damaged → Available sau khi đền bù xong). */
  maHop: string | null;
  items: MucKiemDem[];
  /** UC-08 luồng ngoại lệ 2a: linh kiện ngoài checklist gốc, nhân viên ghi chú thủ công. */
  ghiChuNgoai: string;
  /** Có linh kiện thiếu/hư hỏng -> hộp game chuyển Damaged, ngược lại Available. */
  coLoi: boolean;
}

export function donGiaPhatMoiNgay(giaNiemYet: number): number {
  return Math.round(giaNiemYet * TY_LE_PHAT_MOI_NGAY);
}

/** BRU-03. */
export function tinhPhatTreHan(giaNiemYet: number, soNgayTre: number): number {
  if (soNgayTre <= 0) return 0;
  return Math.min(giaNiemYet, donGiaPhatMoiNgay(giaNiemYet) * soNgayTre);
}

/** BRU-04: đơn giá đền bù cho MỘT đơn vị linh kiện. */
export function donGiaDenBu(giaNiemYet: number, lk: Pick<LinhKienChecklist, "docBan" | "giaLe">): number {
  if (lk.docBan) return giaNiemYet;
  return lk.giaLe ?? Math.round(giaNiemYet * TY_LE_DEN_BU_PHU_KIEN_KHONG_BAN_LE);
}

/** Số lượng lỗi hợp lệ: 0 khi đủ; độc bản luôn 1; còn lại kẹp trong [1, soLuong]. */
export function soLuongLoiHopLe(
  lk: Pick<LinhKienChecklist, "docBan" | "soLuong">,
  ketQua: KetQuaKiemDem,
  yeuCau: number | undefined,
): number {
  if (ketQua === "Du") return 0;
  if (lk.docBan) return 1;
  const n = Number.isFinite(yeuCau) ? Math.trunc(yeuCau as number) : 1;
  return Math.min(lk.soLuong, Math.max(1, n));
}

export function tinhDenBuSanPham(giaNiemYet: number, items: Pick<MucKiemDem, "soLuongLoi" | "donGiaDenBu">[]) {
  const tongTho = items.reduce((sum, i) => sum + i.soLuongLoi * i.donGiaDenBu, 0);
  return { tongTho, denBu: Math.min(giaNiemYet, tongTho) };
}

/** Số ngày trễ: ngày trả thực tế (hàng về kho) sau ngày hết hạn của sản phẩm. Hai tham số là ngày ISO yyyy-mm-dd. */
export function tinhSoNgayTre(ngayKetThucIso: string, ngayTraIso: string): number {
  const ms = Date.parse(`${ngayTraIso}T00:00:00Z`) - Date.parse(`${ngayKetThucIso}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Ngày theo giờ Việt Nam (UTC+7) dạng yyyy-mm-dd, để "ngày trả" không lệch một ngày so với ngày khách thấy. */
export function ngayVietNam(d: Date): string {
  return new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

export interface DongQuyetToanInput {
  tenSanPham: string;
  giaNiemYet: number;
  soNgayTre: number;
  items: Pick<MucKiemDem, "soLuongLoi" | "donGiaDenBu">[];
  shipGiuChieuTra: number;
  phiShipTraThucTe: number;
}

export interface DongQuyetToan {
  tenSanPham: string;
  giaNiemYet: number;
  soNgayTre: number;
  donGiaPhatMoiNgay: number;
  phat: number;
  denBuTho: number;
  denBu: number;
  shipGiuChieuTra: number;
  phiShipTraThucTe: number;
  chenhShip: number;
}

export interface QuyetToan {
  tongCocDaThu: number;
  dong: DongQuyetToan[];
  tongPhat: number;
  tongDenBu: number;
  tongChenhShip: number;
  /** Cọc − phạt − đền bù + chênh lệch ship; có thể âm. */
  ketQuaCuoi: number;
  /** Phần dương của ketQuaCuoi: cộng vào ví (BRU-06). */
  soTienHoan: number;
  /** Phần âm của ketQuaCuoi, đổi dấu: khách phải trả thêm qua QR (UC-10). */
  soTienThuThem: number;
}

export function tinhQuyetToan(input: { tongCocDaThu: number; dong: DongQuyetToanInput[] }): QuyetToan {
  const dong: DongQuyetToan[] = input.dong.map((d) => {
    const { tongTho, denBu } = tinhDenBuSanPham(d.giaNiemYet, d.items);
    return {
      tenSanPham: d.tenSanPham,
      giaNiemYet: d.giaNiemYet,
      soNgayTre: d.soNgayTre,
      donGiaPhatMoiNgay: donGiaPhatMoiNgay(d.giaNiemYet),
      phat: tinhPhatTreHan(d.giaNiemYet, d.soNgayTre),
      denBuTho: tongTho,
      denBu,
      shipGiuChieuTra: d.shipGiuChieuTra,
      phiShipTraThucTe: d.phiShipTraThucTe,
      chenhShip: Math.round(d.shipGiuChieuTra - d.phiShipTraThucTe),
    };
  });
  const tongPhat = dong.reduce((s, r) => s + r.phat, 0);
  const tongDenBu = dong.reduce((s, r) => s + r.denBu, 0);
  const tongChenhShip = dong.reduce((s, r) => s + r.chenhShip, 0);
  const ketQuaCuoi = input.tongCocDaThu - tongPhat - tongDenBu + tongChenhShip;
  return {
    tongCocDaThu: input.tongCocDaThu,
    dong,
    tongPhat,
    tongDenBu,
    tongChenhShip,
    ketQuaCuoi,
    soTienHoan: Math.max(0, ketQuaCuoi),
    soTienThuThem: Math.max(0, -ketQuaCuoi),
  };
}
