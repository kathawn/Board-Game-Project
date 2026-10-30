import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { paginate, parseListParams } from "@/lib/cart/paginate";
import { dungDongThue, khopThue } from "@/lib/cart/rows";

/** FR-CT-09: danh sách giỏ thuê cho màn hình giỏ hàng — tìm kiếm, lọc và phân
 * trang phía server. `counts` là của TOÀN giỏ; tiền thuê (BRU-02) / tiền cọc (BRU-01)
 * trong `tong` là của các dòng ĐÃ CHỌN để thanh toán, tính trên toàn giỏ chứ không chỉ
 * trang đang xem — khớp đúng số tiền checkout sẽ chụp. Dòng cần xử lý (xếp lên đầu):
 * "quahan" = ngày bắt đầu đã qua; "trunglich" = đã có đơn thuê khác chiếm khoảng ngày
 * (FR-CT-02, cùng phép kiểm tra với checkout); "ngung" = sản phẩm không còn trong catalog. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { q, filter, page } = parseListParams(request.url);
  const { rows: all, giaoNhan } = await dungDongThue(email);
  const chon = all.filter((r) => r.chon);

  const matched = all
    .filter((r) => khopThue(r, q, filter))
    .sort((a, b) => Number(b.canXuLy !== null) - Number(a.canXuLy !== null) || a.startDate.localeCompare(b.startDate));

  const result = paginate(matched, page);

  return Response.json({
    ok: true,
    lines: result.rows,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    soChonKhop: matched.filter((r) => r.chon).length,
    counts: { all: all.length, canxuly: all.filter((r) => r.canXuLy !== null).length },
    tong: {
      soDong: all.length,
      soDongChon: chon.length,
      tienThueChon: chon.reduce((s, r) => s + r.tienThue, 0),
      tienCocChon: chon.reduce((s, r) => s + r.tienCoc, 0),
      coDongChonCanXuLy: chon.some((r) => r.canXuLy !== null),
    },
    giaoNhan,
  });
}
