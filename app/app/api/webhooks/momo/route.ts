import { paymentService } from "@/lib/payments/server";
import { verifyMomoWebhook } from "@/lib/payments/momo-signature";

/** FR-TTGV-07 (UC-10 bước 3): webhook MoMo (giả lập) báo kết quả thanh toán. Đây là
 * CÁCH DUY NHẤT để một khoản thanh toán chuyển sang DaThanhToan — không có API
 * hay nút nào xác nhận thủ công. Không dùng cookie đăng nhập (MoMo là máy gọi
 * máy); thay vào đó xác thực bằng chữ ký HMAC.
 *
 * Idempotent: gửi lại cùng webhook trả 200 với duplicate=true, không xử lý lại. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { paymentId, transactionId, amount, resultCode, signature } = body;
  if (
    typeof paymentId !== "string" ||
    typeof transactionId !== "string" ||
    typeof amount !== "number" ||
    typeof resultCode !== "number"
  ) {
    return Response.json(
      { error: "Thiếu hoặc sai kiểu paymentId/transactionId/amount/resultCode." },
      { status: 400 },
    );
  }

  if (!verifyMomoWebhook({ paymentId, transactionId, amount, resultCode }, signature)) {
    return Response.json({ error: "Chữ ký webhook không hợp lệ." }, { status: 401 });
  }

  const result = await paymentService.applyWebhook({ paymentId, transactionId, amount, resultCode });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    ok: true,
    duplicate: result.duplicate,
    trangThai: result.payment.trangThai,
    ketQua: result.payment.ketQua,
  });
}
