import { createHmac, timingSafeEqual } from "node:crypto";

/** FR-TTGV-07: webhook chỉ được tin khi có chữ ký hợp lệ từ cổng thanh toán —
 * nếu không, bất kỳ ai gọi được URL webhook đều tự "xác nhận" được thanh toán
 * (trái với "không chấp nhận xác nhận thủ công"). MoMo thật ký bằng HMAC-SHA256
 * với secret của merchant; đây là bản giả lập cùng cơ chế (DP-04 là giả định). */
/** Production mà thiếu secret thì fail closed — không bao giờ rơi về secret mặc định
 * (đã nằm trong repo), nếu không ai đọc repo cũng tự ký được webhook "thành công". */
function getSecret(): string {
  const secret = process.env.MOMO_MOCK_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("MOMO_MOCK_SECRET chưa được cấu hình — từ chối ký/xác thực webhook.");
  }
  return "boardverse-dev-momo-secret";
}

export interface MomoWebhookPayload {
  paymentId: string;
  transactionId: string;
  /** Số tiền MoMo thực thu (như IPN thật của MoMo) — phải khớp số tiền cần thu của khoản thanh toán. */
  amount: number;
  /** 0 = thành công, khác 0 = thất bại (theo quy ước resultCode của MoMo). */
  resultCode: number;
}

function raw(payload: MomoWebhookPayload): string {
  return `${payload.paymentId}|${payload.transactionId}|${payload.amount}|${payload.resultCode}`;
}

export function signMomoWebhook(payload: MomoWebhookPayload): string {
  return createHmac("sha256", getSecret()).update(raw(payload)).digest("hex");
}

export function verifyMomoWebhook(payload: MomoWebhookPayload, signature: unknown): boolean {
  if (typeof signature !== "string") return false;
  const expected = Buffer.from(signMomoWebhook(payload), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
