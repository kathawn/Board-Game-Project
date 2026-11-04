import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getPrisma } from "@/lib/db/client";
import { getWalletLedger } from "@/lib/payments/wallet";

/** BRU-06 (BR-16): số dư + sổ cái ví điện tử nội bộ của chính khách đang đăng nhập — nơi nhận hoàn cọc/hoàn tiền
 * (huỷ đơn Pending FR-BH-06, quyết toán khi trả hàng UC-07, hoàn tiền thanh toán lỗi UC-10). Phân trang phía server. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const nhom = sp.get("nhom");
  return Response.json(
    await getWalletLedger(getPrisma(), email, {
      page: Number(sp.get("page") ?? 1),
      nhom: nhom === "coc" || nhom === "tien" || nhom === "rut" ? nhom : undefined,
      q: sp.get("q") ?? undefined,
    }),
  );
}
