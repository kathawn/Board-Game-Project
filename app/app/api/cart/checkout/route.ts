import { getSessionEmail } from "@/lib/auth/request";
import { authService, sessionStore } from "@/lib/auth/server";
import { paymentService } from "@/lib/payments/server";
import { dungDongMua } from "@/lib/cart/rows";
import { demHopAvailable } from "@/lib/cart/inventory";
import { uocTinhKhoangCachKm, tinhPhiShip } from "@/lib/rentals/deposit";
import { getProductBySlug } from "@/lib/products";

/** UC-03 (FR-BH-04, FR-BH-09, FR-TTGV-02, UC-10): khách xác nhận các dòng giỏ mua ĐÃ CHỌN để thanh toán qua
 * mã QR. Hệ thống kiểm tra còn hàng thật (số hộp Available) cho từng dòng, tính tiền hàng + phí ship một chiều
 * (đối tác chọn theo khoảng cách, BRU-05) rồi "chụp" giá/số lượng vào khoản thanh toán. Đơn "bán" chỉ được tạo,
 * và các hộp game chỉ chuyển sang Sold, khi webhook thanh toán thành công về (FR-TTGV-07) — giỏ giữ nguyên tới lúc đó. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const tatCa = await dungDongMua(email);
  if (tatCa.length === 0) {
    return Response.json({ error: "Giỏ mua đang trống." }, { status: 409 });
  }
  const chon = tatCa.filter((r) => r.chon);
  if (chon.length === 0) {
    return Response.json({ error: "Chưa chọn sản phẩm nào trong giỏ mua để thanh toán." }, { status: 409 });
  }

  // FR-BH-04: từ chối checkout kèm thông báo rõ ràng nếu sản phẩm hết hàng / không đủ số lượng.
  const ton = await demHopAvailable(chon.map((r) => r.sanPhamId));
  for (const r of chon) {
    const product = getProductBySlug(r.sanPhamId);
    if (!product) {
      return Response.json(
        { error: `Sản phẩm ${r.sanPhamId} không còn kinh doanh, vui lòng xoá khỏi giỏ mua hoặc bỏ chọn.` },
        { status: 409 },
      );
    }
    const conLai = ton.get(r.sanPhamId) ?? 0;
    if (conLai === 0) {
      return Response.json({ error: `${product.ten} đã hết hàng, vui lòng xoá khỏi giỏ mua hoặc bỏ chọn.` }, { status: 409 });
    }
    if (r.soLuong > conLai) {
      return Response.json(
        { error: `${product.ten} không đủ số lượng yêu cầu (còn ${conLai}, yêu cầu ${r.soLuong}), vui lòng giảm số lượng.` },
        { status: 409 },
      );
    }
  }

  const profile = await authService.getProfile(email);
  const diaChiNhan = profile.ok ? profile.profile.diaChi : "";
  if (!diaChiNhan) {
    return Response.json({ error: "Chưa có địa chỉ nhận hàng — vào hồ sơ cá nhân để thêm địa chỉ." }, { status: 409 });
  }

  // FR-TTGV-02: một chiều giao, tính theo khoảng cách ước tính từ địa chỉ nhận.
  const { doiTac, phiShip } = tinhPhiShip(uocTinhKhoangCachKm(diaChiNhan));

  const payment = await paymentService.createPurchase({
    email,
    diaChiNhan,
    doiTac,
    phiShip,
    lines: chon.map((r) => ({
      productSlug: r.sanPhamId,
      productName: r.ten,
      soLuong: r.soLuong,
      donGia: r.donGia,
    })),
  });

  return Response.json({ ok: true, paymentId: payment.id });
}
