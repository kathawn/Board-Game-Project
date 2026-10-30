import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { selectionStore, type LoaiGio } from "@/lib/cart/selection";
import { dungDongMua, dungDongThue, khopMua, khopThue } from "@/lib/cart/rows";

/** Tích chọn / bỏ chọn dòng giỏ để thanh toán (giỏ thuê hoặc giỏ mua). Hai cách chỉ định dòng:
 * `ids` (các dòng cụ thể) hoặc `khop` ({q, filter}) = MỌI dòng khớp tìm kiếm/bộ lọc hiện tại, kể cả
 * ở các trang khác — để "chọn tất cả" hoạt động với giỏ hàng trăm dòng. Server tự xác định dòng,
 * không tin danh sách id đầy đủ từ client. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json();
  const loai: LoaiGio | null = body.loai === "thue" || body.loai === "mua" ? body.loai : null;
  if (!loai || typeof body.chon !== "boolean") {
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  let ids: string[];
  if (Array.isArray(body.ids)) {
    ids = body.ids.filter((x: unknown): x is string => typeof x === "string");
  } else if (body.khop && typeof body.khop === "object") {
    const q = String(body.khop.q ?? "").trim().toLowerCase();
    const filter = String(body.khop.filter ?? "all");
    ids =
      loai === "mua"
        ? (await dungDongMua(email)).filter((r) => khopMua(r, q, filter)).map((r) => r.sanPhamId)
        : (await dungDongThue(email)).rows.filter((r) => khopThue(r, q, filter)).map((r) => r.id);
  } else {
    return Response.json({ error: "Thiếu ids hoặc khop." }, { status: 400 });
  }

  selectionStore.set(email, loai, ids, body.chon);
  return Response.json({ ok: true, soDong: ids.length });
}
