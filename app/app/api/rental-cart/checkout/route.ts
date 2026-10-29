import { rentalCartStore, rentalOrderStore } from "@/lib/rentals/server";
import { authService, sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getProductBySlug, tinhTienThueNgay } from "@/lib/products";
import { uocTinhKhoangCachKm, tinhPhiShip, tinhTienCocSanPham } from "@/lib/rentals/deposit";

function soNgay(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000);
}

/** FR-CT-05 (UC-04 bước 7-8, UC-05): khách xác nhận giỏ thuê để tạo đơn
 * thuê trạng thái Pending — tiền thuê (FR-CT-04/BRU-02) và tiền cọc
 * (FR-CT-03/BRU-01) được tính và "chụp" lại tại thời điểm này cho từng
 * dòng. Bước thanh toán QR/webhook thật (UC-10, FR-TTGV-06/07) chưa làm
 * trong phạm vi này — đơn được tạo Pending ngay để Staff có đơn để xác
 * nhận (UC-05), nêu rõ đây là rút gọn tạm. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const cartLines = rentalCartStore.list(email);
  if (cartLines.length === 0) {
    return Response.json({ error: "Giỏ thuê đang trống." }, { status: 409 });
  }

  // UC-04 bước 4/luồng ngoại lệ 4a (FR-CT-02): kiểm tra lại tồn kho theo
  // khoảng ngày ngay trước khi tạo đơn — giỏ hàng có thể đã nằm một thời
  // gian từ lúc thêm (FR-CT-01) đến lúc xác nhận (bước này), trong lúc đó
  // một đơn khác có thể đã chiếm cùng khoảng ngày.
  for (const line of cartLines) {
    const conflict = rentalOrderStore
      .listActiveDateRangesForProduct(line.productSlug)
      .some((r) => line.startDate <= r.endDate && r.startDate <= line.endDate);
    if (conflict) {
      const product = getProductBySlug(line.productSlug);
      return Response.json(
        {
          error: `${product?.ten ?? line.productSlug} đã có đơn thuê khác còn hiệu lực trùng ngày trong khoảng đã chọn, vui lòng sửa lại giỏ thuê.`,
        },
        { status: 409 },
      );
    }
  }

  const profileResult = await authService.getProfile(email);
  const diaChiNhan = profileResult.ok ? profileResult.profile.diaChi : "";
  if (!diaChiNhan) {
    return Response.json(
      { error: "Chưa có địa chỉ nhận hàng — vào hồ sơ cá nhân để thêm địa chỉ." },
      { status: 409 },
    );
  }

  const khoangCachKm = uocTinhKhoangCachKm(diaChiNhan);
  const { doiTac } = tinhPhiShip(khoangCachKm);

  const lines = cartLines.map((line) => {
    const product = getProductBySlug(line.productSlug);
    const giaNiemYet = product?.giaNiemYet ?? 0;
    const soNgayThue = soNgay(line.startDate, line.endDate);
    return {
      productSlug: line.productSlug,
      productName: product?.ten ?? line.productSlug,
      startDate: line.startDate,
      endDate: line.endDate,
      tienThue: tinhTienThueNgay(giaNiemYet, soNgayThue),
      tienCoc: tinhTienCocSanPham(giaNiemYet, khoangCachKm),
    };
  });

  const order = rentalOrderStore.create({
    email,
    diaChiNhan,
    doiTac,
    lines,
    tongTienThue: lines.reduce((sum, l) => sum + l.tienThue, 0),
    tongTienCoc: lines.reduce((sum, l) => sum + l.tienCoc, 0),
  });

  rentalCartStore.clear(email);

  return Response.json({ ok: true, order });
}
