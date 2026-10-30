import { rentalCartStore, rentalOrderStore } from "@/lib/rentals/server";
import { paymentService } from "@/lib/payments/server";
import { authService, sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { homNayVN } from "@/lib/cart/paginate";
import { selectionStore } from "@/lib/cart/selection";
import { coHopDeThue } from "@/lib/cart/inventory";
import { tinhTienThueNgay } from "@/lib/products";
import { catalog } from "@/lib/catalog/server";
import { uocTinhKhoangCachKm, tinhPhiShip, tinhTienCocSanPham } from "@/lib/rentals/deposit";

function soNgay(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000);
}

/** FR-CT-05 (UC-04 bước 7, UC-10): khách xác nhận giỏ thuê để thanh toán cọc
 * qua mã QR — tiền thuê (FR-CT-04/BRU-02) và tiền cọc (FR-CT-03/BRU-01) được
 * tính và "chụp" lại tại thời điểm này cho từng dòng. Đơn thuê Pending chỉ
 * được tạo sau khi webhook thanh toán thành công (xem lib/payments/service.ts). */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  // Khách có thể chỉ thanh toán một phần giỏ: chỉ các dòng đã tích chọn (lưu phía server) được chụp vào
  // khoản thanh toán; dòng chưa chọn ở lại trong giỏ (dịch vụ thanh toán chỉ gỡ đúng dòng trong snapshot).
  const tatCaDong = await rentalCartStore.list(email);
  if (tatCaDong.length === 0) {
    return Response.json({ error: "Giỏ thuê đang trống." }, { status: 409 });
  }
  const cartLines = tatCaDong.filter((l) => selectionStore.isSelected(email, "thue", l.id));
  if (cartLines.length === 0) {
    return Response.json({ error: "Chưa chọn dòng nào trong giỏ thuê để thanh toán." }, { status: 409 });
  }

  // UC-04 bước 4/luồng ngoại lệ 4a (FR-CT-02): kiểm tra lại tồn kho theo
  // khoảng ngày ngay trước khi tạo đơn — giỏ hàng có thể đã nằm một thời
  // gian từ lúc thêm (FR-CT-01) đến lúc xác nhận (bước này), trong lúc đó
  // một đơn khác có thể đã chiếm cùng khoảng ngày.
  // FR-ADM-03: giá và tên lấy từ danh mục hiện tại (Admin có thể vừa đổi giá hoặc xoá sản phẩm sau khi khách thêm vào giỏ).
  const products = await catalog.getMany(cartLines.map((l) => l.productSlug));
  const today = homNayVN();
  const coHop = await coHopDeThue(cartLines.map((l) => l.productSlug));
  for (const line of cartLines) {
    // FR-CT-01: dòng chỉ hợp lệ với sản phẩm còn bán và khoảng ngày chưa qua — màn giỏ đã
    // đánh dấu "cần xử lý" các dòng này; chặn ở đây để không tính cọc "ma" (giá 0) hay đặt thuê quá khứ.
    if (!products.has(line.productSlug)) {
      return Response.json(
        { error: `Sản phẩm ${line.productSlug} không còn kinh doanh, vui lòng xoá khỏi giỏ thuê.` },
        { status: 409 },
      );
    }
    if (!coHop.has(line.productSlug)) {
      return Response.json(
        { error: `${products.get(line.productSlug)!.ten} hiện chưa có hộp game để cho thuê, vui lòng xoá khỏi giỏ thuê.` },
        { status: 409 },
      );
    }
    if (line.startDate < today) {
      return Response.json(
        { error: `${products.get(line.productSlug)!.ten} có ngày bắt đầu đã qua, vui lòng sửa lại ngày thuê.` },
        { status: 409 },
      );
    }
    const conflict = (await rentalOrderStore.listActiveDateRangesForProduct(line.productSlug)).some((r) => line.startDate <= r.endDate && r.startDate <= line.endDate);
    if (conflict) {
      const product = products.get(line.productSlug);
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
    const product = products.get(line.productSlug)!;
    const giaNiemYet = product.giaNiemYet;
    const soNgayThue = soNgay(line.startDate, line.endDate);
    return {
      cartLineId: line.id,
      productSlug: line.productSlug,
      productName: product.ten,
      // Giá niêm yết tại thời điểm chốt giỏ: đơn được tạo sau (webhook) vẫn ghi đúng giá này dù Admin đổi giá giữa chừng.
      giaNiemYet,
      startDate: line.startDate,
      endDate: line.endDate,
      tienThue: tinhTienThueNgay(giaNiemYet, soNgayThue),
      tienCoc: tinhTienCocSanPham(giaNiemYet, khoangCachKm),
    };
  });

  // UC-10 (FR-TTGV-06): sinh khoản thanh toán + mã QR cho tiền cọc. Đơn thuê KHÔNG
  // được tạo ở đây — chỉ tạo khi webhook thành công về (FR-TTGV-07, BRU-07). Giỏ
  // thuê cũng được giữ nguyên cho đến lúc đó, để QR hết hạn/thất bại thì khách
  // thử lại được mà không phải chọn lại sản phẩm.
  const payment = await paymentService.createRentalDeposit({ email, diaChiNhan, doiTac, lines });

  return Response.json({ ok: true, paymentId: payment.id });
}
