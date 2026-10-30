import { cartStore } from "@/lib/cart/server";
import { selectionStore } from "@/lib/cart/selection";
import { homNayVN } from "@/lib/cart/paginate";
import { authService } from "@/lib/auth/server";
import { rentalCartStore, rentalOrderStore } from "@/lib/rentals/server";
import { demHopAvailable } from "@/lib/cart/inventory";
import { getProductBySlug, tinhTienThueNgay } from "@/lib/products";
import { uocTinhKhoangCachKm, tinhPhiShip, tinhTienCocSanPham } from "@/lib/rentals/deposit";

/** Dựng toàn bộ dòng giỏ (kèm trạng thái "cần xử lý" và cờ đã chọn) — dùng chung cho API danh sách,
 * API chọn dòng và checkout để cả ba luôn cùng một cách tính. */

export type TrangThaiMua = "ok" | "vuot" | "het" | "ngung";

export interface DongMua {
  index: number;
  sanPhamId: string;
  ten: string;
  anh: string | null;
  danhMuc: string;
  soLuong: number;
  soLuongTon: number;
  donGia: number;
  thanhTien: number;
  trangThai: TrangThaiMua;
  chon: boolean;
}

/** Tồn kho lấy từ số hộp Available THẬT trong DB (không phải số tĩnh trong catalog), nên sau mỗi đơn mua
 * thành công (hộp → Sold) giỏ phản ánh đúng số còn lại. */
export async function dungDongMua(email: string): Promise<DongMua[]> {
  const items = cartStore.get(email);
  const ton = await demHopAvailable(items.map((i) => i.sanPhamId));
  return items.map((item, index) => {
    const product = getProductBySlug(item.sanPhamId);
    const conLai = ton.get(item.sanPhamId) ?? 0;
    const trangThai: TrangThaiMua = !product
      ? "ngung"
      : conLai === 0
        ? "het"
        : item.soLuong > conLai
          ? "vuot"
          : "ok";
    return {
      index,
      sanPhamId: item.sanPhamId,
      ten: product?.ten ?? item.sanPhamId,
      anh: product?.anh ?? null,
      danhMuc: product?.danhMuc ?? "",
      soLuong: item.soLuong,
      soLuongTon: product ? conLai : 0,
      donGia: product?.giaNiemYet ?? 0,
      thanhTien: (product?.giaNiemYet ?? 0) * item.soLuong,
      trangThai,
      chon: selectionStore.isSelected(email, "mua", item.sanPhamId),
    };
  });
}

export type CanXuLyThue = "quahan" | "trunglich" | "ngung" | null;

export interface DongThue {
  index: number;
  id: string;
  productSlug: string;
  ten: string;
  anh: string | null;
  danhMuc: string;
  startDate: string;
  endDate: string;
  soNgay: number;
  tienThue: number;
  tienCoc: number;
  canXuLy: CanXuLyThue;
  chon: boolean;
}

function soNgay(startDate: string, endDate: string): number {
  return Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000);
}

export async function dungDongThue(email: string) {
  const today = homNayVN();
  const profileResult = await authService.getProfile(email);
  const diaChiNhan = profileResult.ok ? profileResult.profile.diaChi : "";
  const khoangCachKm = uocTinhKhoangCachKm(diaChiNhan);
  const { doiTac } = tinhPhiShip(khoangCachKm);

  const cache = new Map<string, { startDate: string; endDate: string }[]>();
  const reservationsOf = async (slug: string) => {
    if (!cache.has(slug)) cache.set(slug, await rentalOrderStore.listActiveDateRangesForProduct(slug));
    return cache.get(slug)!;
  };

  const rows: DongThue[] = await Promise.all(
    (await rentalCartStore.list(email)).map(async (line, index) => {
      const product = getProductBySlug(line.productSlug);
      const soNgayThue = soNgay(line.startDate, line.endDate);
      let canXuLy: CanXuLyThue = null;
      if (!product) canXuLy = "ngung";
      else if (line.startDate < today) canXuLy = "quahan";
      else if ((await reservationsOf(line.productSlug)).some((r) => line.startDate <= r.endDate && r.startDate <= line.endDate)) {
        canXuLy = "trunglich";
      }
      return {
        index,
        id: line.id,
        productSlug: line.productSlug,
        ten: product?.ten ?? line.productSlug,
        anh: product?.anh ?? null,
        danhMuc: product?.danhMuc ?? "",
        startDate: line.startDate,
        endDate: line.endDate,
        soNgay: soNgayThue,
        // Sản phẩm đã ngừng không đóng góp tiền — checkout từ chối dòng này.
        tienThue: product ? tinhTienThueNgay(product.giaNiemYet, soNgayThue) : 0,
        tienCoc: product ? tinhTienCocSanPham(product.giaNiemYet, khoangCachKm) : 0,
        canXuLy,
        chon: selectionStore.isSelected(email, "thue", line.id),
      };
    }),
  );
  return { rows, giaoNhan: { diaChiNhan, doiTac } };
}

export const khopMua = (r: DongMua, q: string, filter: string) =>
  (q ? r.ten.toLowerCase().includes(q) : true) && (filter === "canxuly" ? r.trangThai !== "ok" : true);

export const khopThue = (r: DongThue, q: string, filter: string) =>
  (q ? r.ten.toLowerCase().includes(q) : true) && (filter === "canxuly" ? r.canXuLy !== null : true);
