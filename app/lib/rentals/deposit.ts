/** FR-CT-03 (BR-02, BR-09, UC-04/UC-05): tính tiền cọc theo BRU-01 — tiền cọc
 * mỗi sản phẩm = giá niêm yết (100%) + phí giao vận ước tính chiều giao × 2
 * (dự trù cho cả chiều giao và chiều lấy hàng trả, vì cả hai chiều đều bắt
 * buộc qua giao vận). Thuật toán chọn đối tác + tính phí theo SDD mục 15
 * (bản đồng bộ lại theo SRS/BRU-05: chọn đối tác theo khoảng cách thực tế —
 * Green SM nếu ≤ 20km, Shopee Express nếu > 20km — không phải theo khu vực
 * hành chính). Chưa có geocoding thật (FR-TTGV-02 chưa làm) nên khoảng cách
 * được ước tính tạm từ địa chỉ nhận hàng của khách. */

export type DoiTacGiaoVan = "GreenSM" | "ShopeeExpress";

/** Báo giá giả lập của từng đối tác (giả định, dùng tạm cho đến khi tích hợp
 * API thật của Green SM/Shopee Express). */
const BANG_GIA_DOI_TAC: Record<DoiTacGiaoVan, { phiCoDinh: number; phiMoiKm: number }> = {
  GreenSM: { phiCoDinh: 15000, phiMoiKm: 1000 },
  ShopeeExpress: { phiCoDinh: 25000, phiMoiKm: 800 },
};

/** BRU-05: khoảng cách ≤ 20km dùng Green SM, > 20km dùng Shopee Express. */
export function chonDoiTacGiaoVan(khoangCachKm: number): DoiTacGiaoVan {
  return khoangCachKm <= 20 ? "GreenSM" : "ShopeeExpress";
}

export function tinhPhiShip(khoangCachKm: number): { doiTac: DoiTacGiaoVan; phiShip: number } {
  const doiTac = chonDoiTacGiaoVan(khoangCachKm);
  const gia = BANG_GIA_DOI_TAC[doiTac];
  return { doiTac, phiShip: gia.phiCoDinh + gia.phiMoiKm * khoangCachKm };
}

/** Kho hàng đặt tại Hà Nội (giả định, dùng làm điểm xuất phát mọi chiều giao
 * vận). */
export const DIA_CHI_KHO = "74 Ngõ 435 Xuân Đỉnh, Bắc Từ Liêm, Hà Nội";

/** 17 huyện + 1 thị xã ngoại thành Hà Nội (theo địa giới hành chính hiện hành) —
 * dùng để nhận diện địa chỉ ngoại thành ngay cả khi khách không viết chữ
 * "huyện"/"thị xã" (cách viết địa chỉ phổ biến trong thực tế). */
const HUYEN_NGOAI_THANH_HA_NOI = [
  "ba vì", "chương mỹ", "đan phượng", "đông anh", "gia lâm", "hoài đức",
  "mê linh", "mỹ đức", "phú xuyên", "phúc thọ", "quốc oai", "sóc sơn",
  "thạch thất", "thanh oai", "thanh trì", "thường tín", "ứng hoà", "sơn tây",
];

/** Chuẩn hoá chuỗi về NFC + lowercase trước khi so khớp từ khoá — địa chỉ
 * tiếng Việt có thể được lưu ở dạng NFD (tổ hợp dấu rời) tuỳ nguồn nhập, nhìn
 * giống hệt NFC nhưng so sánh chuỗi/includes() sẽ không khớp nếu không chuẩn
 * hoá cùng một dạng trước. */
function chuanHoa(value: string): string {
  return value.normalize("NFC").toLowerCase();
}

/** Ước tính khoảng cách (km) từ kho đến địa chỉ khách khi chưa có geocoding
 * thật (FR-TTGV-02 chưa hiện thực): nội thành Hà Nội ước tính trong bán kính
 * Green SM (~8km); ngoại thành Hà Nội ước tính vượt ngưỡng 20km một chút
 * (~25km, chuyển sang Shopee Express); ngoài Hà Nội ước tính xa (~120km). */
export function uocTinhKhoangCachKm(diaChiKhach: string): number {
  const normalized = chuanHoa(diaChiKhach);
  if (!normalized.includes("hà nội") && !normalized.includes("ha noi")) {
    return 120;
  }
  const coTuKhoaHuyen =
    normalized.includes("huyện") || normalized.includes("huyen") || normalized.includes("thị xã");
  const coTenHuyenNgoaiThanh = HUYEN_NGOAI_THANH_HA_NOI.some((huyen) => normalized.includes(huyen));
  if (coTuKhoaHuyen || coTenHuyenNgoaiThanh) {
    return 25;
  }
  return 8;
}

/** BRU-01: coc = gia niem yet + phi ship chieu giao x 2 (du tru ca 2 chieu). */
export function tinhTienCocSanPham(giaNiemYet: number, khoangCachKm: number): number {
  return giaNiemYet + tinhPhiShip(khoangCachKm).phiShip * 2;
}

export function tinhTongTienCoc(giaNiemYetList: number[], khoangCachKm: number): number {
  return giaNiemYetList.reduce((sum, giaNiemYet) => sum + tinhTienCocSanPham(giaNiemYet, khoangCachKm), 0);
}
