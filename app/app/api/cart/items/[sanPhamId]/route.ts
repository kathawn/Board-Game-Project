import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { cartStore, serializeCart } from "@/lib/cart/server";
import { checkStock, getProductBySlug } from "@/lib/products";

/** FR-BH-09: sửa số lượng một sản phẩm trong giỏ trước khi thanh toán. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sanPhamId: string }> },
) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { sanPhamId } = await params;
  const { soLuong } = await request.json();

  const product = getProductBySlug(sanPhamId);
  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const result = checkStock(product, soLuong);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  cartStore.setItem(email, sanPhamId, soLuong);

  return Response.json({ items: serializeCart(email) }, { status: 200 });
}

/** FR-BH-09: xoá một sản phẩm khỏi giỏ trước khi thanh toán. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sanPhamId: string }> },
) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { sanPhamId } = await params;
  cartStore.removeItem(email, sanPhamId);

  return Response.json({ items: serializeCart(email) }, { status: 200 });
}
