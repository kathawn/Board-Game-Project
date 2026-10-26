import { createInMemoryCartStore, type CartStore } from "./store";
import { getProductBySlug } from "@/lib/products";

export let cartStore: CartStore = createInMemoryCartStore();

export function resetCartForTests() {
  cartStore = createInMemoryCartStore();
}

/** Giỏ hàng trả về cho client kèm đơn giá hiện tại của từng sản phẩm. */
export function serializeCart(customerId: string) {
  return cartStore.get(customerId).map((item) => ({
    sanPhamId: item.sanPhamId,
    soLuong: item.soLuong,
    donGia: getProductBySlug(item.sanPhamId)?.giaNiemYet ?? 0,
  }));
}
