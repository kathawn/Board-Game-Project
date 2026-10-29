import { paymentService } from "@/lib/payments/server";
import { getWalletBalance } from "@/lib/payments/wallet";
import { getPrisma } from "@/lib/db/client";
import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";

/** UC-10: trang thanh toán poll route này để biết khi nào webhook đã về. Chỉ chủ
 * khoản thanh toán mới xem được. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const payment = await paymentService.get(id);
  // 404 (không phải 403) cho khoản của người khác — không lộ việc mã đó có tồn tại.
  if (!payment || payment.email !== email) {
    return Response.json({ error: "Không tìm thấy khoản thanh toán." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    payment: {
      id: payment.id,
      mucDich: payment.mucDich,
      soTien: payment.soTien,
      trangThai: payment.trangThai,
      ketQua: payment.ketQua,
      maQr: payment.maQr,
      hetHanLuc: payment.hetHanLuc,
      lines: payment.lines.map((l) => ({
        productName: l.productName,
        startDate: l.startDate,
        endDate: l.endDate,
        tienCoc: l.tienCoc,
      })),
      orderId: payment.orderId,
      soTienHoan: payment.soTienHoan,
      dongHetHang: payment.dongHetHang,
    },
    soDuVi: await getWalletBalance(getPrisma(), email),
  });
}
