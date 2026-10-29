import { shippingService } from "@/lib/shipping/server";
import { verifyShipmentWebhook } from "@/lib/shipping/signature";
import { isTrangThaiVanChuyen } from "@/lib/shipping/types";

/** UC-12 (FR-TTGV-05): webhook đối tác giao vận (giả lập) báo trạng thái vận đơn. Máy gọi máy nên không dùng
 * cookie đăng nhập; xác thực bằng chữ ký HMAC. Idempotent: gửi lặp trả 200 với duplicate=true. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { maVanDon, trangThai, signature } = body;
  if (typeof maVanDon !== "string" || typeof trangThai !== "string") {
    return Response.json({ error: "Thiếu hoặc sai kiểu maVanDon/trangThai." }, { status: 400 });
  }
  // Xác thực chữ ký TRƯỚC khi nhìn vào nội dung khác, để kẻ không có secret không dò được mã vận đơn nào tồn tại.
  if (!verifyShipmentWebhook({ maVanDon, trangThai }, signature)) {
    return Response.json({ error: "Chữ ký webhook không hợp lệ." }, { status: 401 });
  }
  if (!isTrangThaiVanChuyen(trangThai)) {
    return Response.json({ error: "trangThai phải là DangGiao | DaGiao | DangLay | DaLay." }, { status: 400 });
  }

  const result = await shippingService.applyWebhook({ maVanDon, trangThai });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, duplicate: result.duplicate, maDon: result.maDon, trangThai: result.trangThai });
}
