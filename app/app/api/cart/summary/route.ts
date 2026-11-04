import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { dungDongThue } from "@/lib/cart/rows";
import { serializeCart } from "@/lib/cart/server";

/** Tóm tắt cho Header/badge giỏ hàng: trạng thái đăng nhập + giỏ mua + số dòng giỏ thuê, gói trong MỘT request.
 * Khác /api/cart và /api/rental-cart/list ở chỗ khách chưa đăng nhập vẫn nhận 200 (`loggedIn: false`) thay vì 401 —
 * mỗi trang công khai đều gọi endpoint này khi tải, nên 401 sẽ làm console/Network đầy lỗi đỏ dù không có gì sai. */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) return Response.json({ loggedIn: false, items: [], rentalCount: 0 });

  const [items, thue] = await Promise.all([serializeCart(email), dungDongThue(email)]);
  return Response.json({ loggedIn: true, items, rentalCount: thue.rows.length });
}
