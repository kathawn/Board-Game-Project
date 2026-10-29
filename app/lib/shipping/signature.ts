import { createHmac, timingSafeEqual } from "node:crypto";

/** FR-TTGV-05: webhook giao vận là bề mặt gọi từ bên ngoài không có cookie đăng nhập, nên chỉ được tin khi
 * có chữ ký hợp lệ — nếu không, ai gọi được URL cũng tự "đã giao"/"đã lấy" được đơn của người khác. Đối tác
 * thật ký bằng HMAC-SHA256 với secret thoả thuận; đây là bản giả lập cùng cơ chế (Green SM là giả định). */
function getSecret(): string {
  const secret = process.env.GREENSM_MOCK_SECRET;
  if (secret) return secret;
  // Production thiếu secret thì fail closed, không rơi về secret mặc định đã nằm trong repo.
  if (process.env.NODE_ENV === "production") {
    throw new Error("GREENSM_MOCK_SECRET chưa được cấu hình — từ chối ký/xác thực webhook giao vận.");
  }
  return "boardverse-dev-greensm-secret";
}

export interface ShipmentWebhookPayload {
  maVanDon: string;
  trangThai: string;
}

function raw(payload: ShipmentWebhookPayload): string {
  return `${payload.maVanDon}|${payload.trangThai}`;
}

export function signShipmentWebhook(payload: ShipmentWebhookPayload): string {
  return createHmac("sha256", getSecret()).update(raw(payload)).digest("hex");
}

export function verifyShipmentWebhook(payload: ShipmentWebhookPayload, signature: unknown): boolean {
  if (typeof signature !== "string") return false;
  const expected = Buffer.from(signShipmentWebhook(payload), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
