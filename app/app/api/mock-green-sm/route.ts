import { shippingService } from "@/lib/shipping/server";
import { isCarrierDown, setCarrierDown } from "@/lib/shipping/carrier";
import { signShipmentWebhook } from "@/lib/shipping/signature";
import { isTrangThaiVanChuyen } from "@/lib/shipping/types";
import { POST as shipmentWebhook } from "@/app/api/webhooks/giao-van/route";

/** Giả lập phía Green SM (đối tác thứ 3 giả định, CLAUDE.md quy tắc 5). Đi qua ĐÚNG webhook thật như đối tác
 * sẽ làm — chỉ là máy chủ này tự gọi. Chỉ có ở dev.
 *
 * GET  → danh sách vận đơn + trạng thái "đối tác đang lỗi".
 * POST { action: "webhook", maVanDon, trangThai, badSignature? } | { action: "down", down: boolean } */
function devOnly() {
  return process.env.NODE_ENV === "production"
    ? Response.json({ error: "Không có trong môi trường production." }, { status: 404 })
    : null;
}

export async function GET() {
  const blocked = devOnly();
  if (blocked) return blocked;
  return Response.json({ ok: true, down: isCarrierDown(), shipments: await shippingService.listAll() });
}

export async function POST(request: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const body = await request.json();

  if (body.action === "down") {
    setCarrierDown(body.down === true);
    return Response.json({ ok: true, down: isCarrierDown() });
  }

  if (body.action === "webhook") {
    const { maVanDon, trangThai } = body;
    if (typeof maVanDon !== "string" || !isTrangThaiVanChuyen(trangThai)) {
      return Response.json({ error: "Thiếu maVanDon hoặc trangThai không hợp lệ." }, { status: 400 });
    }
    const signature = body.badSignature ? "deadbeef" : signShipmentWebhook({ maVanDon, trangThai });
    const response = await shipmentWebhook(
      new Request("http://internal/api/webhooks/giao-van", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ maVanDon, trangThai, signature }),
      }),
    );
    return Response.json(await response.json(), { status: response.status });
  }

  return Response.json({ error: "action phải là webhook | down." }, { status: 400 });
}
