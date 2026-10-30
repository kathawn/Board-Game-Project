import { getSessionEmail } from "@/lib/auth/request";
import { authService, sessionStore } from "@/lib/auth/server";
import { paginate, parseListParams } from "@/lib/cart/paginate";
import { dungDongMua, khopMua } from "@/lib/cart/rows";
import { uocTinhKhoangCachKm, tinhPhiShip } from "@/lib/rentals/deposit";

/** FR-BH-09: danh sách giỏ mua cho màn hình giỏ hàng — tìm kiếm, lọc và phân
 * trang phía server. `counts` luôn là của TOÀN giỏ; `tong` là của các dòng ĐÃ CHỌN
 * (khách có thể chỉ mua một phần giỏ), cũng tính trên toàn giỏ chứ không chỉ trang
 * đang xem. Trạng thái dòng: "vuot"/"het" = số lượng vượt tồn kho Available
 * (FR-BH-04) / hết hàng; "ngung" = sản phẩm không còn trong catalog (vẫn hiện để
 * khách xoá, không tính tiền). Dòng cần xử lý xếp lên đầu. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { q, filter, page } = parseListParams(request.url);
  const all = await dungDongMua(email);
  const chon = all.filter((r) => r.chon);

  const matched = all
    .filter((r) => khopMua(r, q, filter))
    .sort((a, b) => Number(b.trangThai !== "ok") - Number(a.trangThai !== "ok") || b.index - a.index);

  const result = paginate(matched, page);

  // FR-TTGV-02: địa chỉ nhận mặc định từ hồ sơ, đối tác + phí ship MỘT chiều (đơn mua không có chiều trả).
  const profile = await authService.getProfile(email);
  const diaChiNhan = profile.ok ? profile.profile.diaChi : "";
  const { doiTac, phiShip } = tinhPhiShip(uocTinhKhoangCachKm(diaChiNhan));
  const tienHangChon = chon.filter((r) => r.trangThai !== "ngung").reduce((s, r) => s + r.thanhTien, 0);

  return Response.json({
    ok: true,
    lines: result.rows,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    soChonKhop: matched.filter((r) => r.chon).length,
    counts: { all: all.length, canxuly: all.filter((r) => r.trangThai !== "ok").length },
    tong: {
      soDong: all.length,
      soDongChon: chon.length,
      soLuongChon: chon.reduce((s, r) => s + r.soLuong, 0),
      tienHangChon,
      phiShip: chon.length > 0 ? phiShip : 0,
      tongThanhToan: chon.length > 0 ? tienHangChon + phiShip : 0,
      coDongChonCanXuLy: chon.some((r) => r.trangThai !== "ok"),
    },
    giaoNhan: { diaChiNhan, doiTac },
  });
}
