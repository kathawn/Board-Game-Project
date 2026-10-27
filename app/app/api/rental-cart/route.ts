import { rentalCartStore } from "@/lib/rentals/server";
import { authService, sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getProductBySlug } from "@/lib/products";
import { uocTinhKhoangCachKm, tinhPhiShip, tinhTienCocSanPham } from "@/lib/rentals/deposit";

/** FR-CT-03 (BR-02, BR-09, UC-04/UC-05): tổng tiền cọc theo BRU-01, tính phía
 * server từ giá niêm yết (nguồn dữ liệu sản phẩm) và địa chỉ nhận hàng trong
 * hồ sơ cá nhân (nguồn dữ liệu tài khoản) — không nhận giá/địa chỉ từ client
 * để tránh khách tự sửa số tiền cọc hiển thị. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const lines = rentalCartStore.list(email);
  const profileResult = await authService.getProfile(email);
  const diaChiNhan = profileResult.ok ? profileResult.profile.diaChi : "";
  const khoangCachKm = uocTinhKhoangCachKm(diaChiNhan);
  const { doiTac } = tinhPhiShip(khoangCachKm);

  // Dòng giỏ thuê trỏ tới sản phẩm không còn tồn tại (đã bị xoá khỏi catalog)
  // không đóng góp tiền cọc ở cả tổng lẫn từng dòng — tránh "cọc ma" chỉ gồm
  // phí ship cho một sản phẩm giá 0 không có thật.
  const dongGia = lines.map((line) => {
    const giaNiemYet = getProductBySlug(line.productSlug)?.giaNiemYet;
    const tienCoc = typeof giaNiemYet === "number" ? tinhTienCocSanPham(giaNiemYet, khoangCachKm) : 0;
    return { lineId: line.id, tienCoc };
  });

  return Response.json({
    ok: true,
    lines,
    coc: {
      diaChiNhan,
      khoangCachKm,
      doiTac,
      dongGia,
      tongTienCoc: dongGia.reduce((sum, d) => sum + d.tienCoc, 0),
    },
  });
}

export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { productSlug, startDate, endDate } = await request.json();

  const product = getProductBySlug(productSlug);
  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const result = rentalCartStore.addLine(email, {
    productSlug,
    productName: product.ten,
    startDate,
    endDate,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true, line: result.line });
}
