import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { cartStore, serializeCart } from "@/lib/cart/server";
import { checkStock, getProductBySlug } from "@/lib/products";

/** FR-BH-08: thêm sản phẩm (hoặc tăng số lượng nếu đã có) vào giỏ mua; số lượng không vượt quá tồn kho Available. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { sanPhamId, soLuong } = await request.json();
  const product = getProductBySlug(sanPhamId);
  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const existing = cartStore.get(email).find((i) => i.sanPhamId === sanPhamId);
  const newSoLuong = (existing?.soLuong ?? 0) + soLuong;

  const result = checkStock(product, newSoLuong);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  cartStore.setItem(email, sanPhamId, newSoLuong);

  return Response.json({ items: serializeCart(email) }, { status: 200 });
}
