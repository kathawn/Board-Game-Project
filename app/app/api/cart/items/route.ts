import { getSessionEmail } from "@/lib/auth/request";
import { sessionStore } from "@/lib/auth/server";
import { cartStore, serializeCart } from "@/lib/cart/server";
import { selectionStore } from "@/lib/cart/selection";
import { kiemTraTonKho } from "@/lib/cart/inventory";
import { catalog } from "@/lib/catalog/server";

/** FR-BH-08: thêm sản phẩm (hoặc tăng số lượng nếu đã có) vào giỏ mua; số lượng không vượt quá tồn kho Available. */
export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { sanPhamId, soLuong } = await request.json();
  const product = await catalog.get(sanPhamId);
  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const existing = cartStore.get(email).find((i) => i.sanPhamId === sanPhamId);
  const newSoLuong = (existing?.soLuong ?? 0) + soLuong;

  const result = await kiemTraTonKho(sanPhamId, newSoLuong);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  cartStore.setItem(email, sanPhamId, newSoLuong);
  // Sản phẩm vừa được thêm vào giỏ luôn ở trạng thái đã chọn, kể cả khi trước đó từng bị bỏ chọn rồi xoá.
  if (!existing) selectionStore.set(email, "mua", [sanPhamId], true);

  return Response.json({ items: await serializeCart(email) }, { status: 200 });
}
