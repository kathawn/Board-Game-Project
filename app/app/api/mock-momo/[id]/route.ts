import { randomUUID } from "node:crypto";
import { paymentService } from "@/lib/payments/server";
import { signMomoWebhook } from "@/lib/payments/momo-signature";
import { POST as momoWebhook } from "@/app/api/webhooks/momo/route";

/** Giả lập phía MoMo (đối tác thứ 3 giả định, CLAUDE.md quy tắc 5): thay cho việc quét
 * QR thật. Đi qua ĐÚNG webhook thật (có ký, có kiểm tra) như MoMo sẽ làm — chỉ là
 * máy chủ này tự gọi thay vì MoMo gọi từ bên ngoài.
 *
 * Body: { action: "success" | "fail" | "expire" | "duplicate" }
 *  - "duplicate": gửi webhook thành công hai lần liền (cùng transactionId) để kiểm tra idempotency. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Không có trong môi trường production." }, { status: 404 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action === "expire") {
    const payment = await paymentService.expireNow(id);
    if (!payment) return Response.json({ error: "Không tìm thấy khoản thanh toán." }, { status: 404 });
    return Response.json({ ok: true, trangThai: payment.trangThai });
  }
  if (action !== "success" && action !== "fail" && action !== "duplicate") {
    return Response.json({ error: "action phải là success | fail | duplicate | expire." }, { status: 400 });
  }

  const payment = await paymentService.get(id);
  if (!payment) return Response.json({ error: "Không tìm thấy khoản thanh toán." }, { status: 404 });

  const payload = {
    paymentId: id,
    transactionId: `MOMO-${randomUUID()}`,
    amount: payment.soTien,
    resultCode: action === "fail" ? 1006 : 0,
  };
  const call = () =>
    momoWebhook(
      new Request("http://internal/api/webhooks/momo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, signature: signMomoWebhook(payload) }),
      }),
    );

  const first = await call();
  if (action === "duplicate") await call();
  return Response.json(await first.json(), { status: first.status });
}
