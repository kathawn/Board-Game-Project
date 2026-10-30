import { createInMemoryCartStore, type CartStore } from "./store";
import { catalog } from "@/lib/catalog/server";

export let cartStore: CartStore = createInMemoryCartStore();

export function resetCartForTests() {
  cartStore = createInMemoryCartStore();
}

/** Giỏ hàng trả về cho client kèm đơn giá HIỆN TẠI của từng sản phẩm (FR-ADM-03: Admin đổi giá thì giỏ thấy ngay)
 * và đủ thông tin hiển thị (tên, ảnh, tồn kho), để giao diện không phải tra danh mục tĩnh. `anh` = null nghĩa là sản
 * phẩm không còn trong danh mục. */
export async function serializeCart(customerId: string) {
  const items = cartStore.get(customerId);
  const products = await catalog.getMany(items.map((i) => i.sanPhamId));
  return items.map((item) => {
    const product = products.get(item.sanPhamId);
    return {
      sanPhamId: item.sanPhamId,
      soLuong: item.soLuong,
      donGia: product?.giaNiemYet ?? 0,
      ten: product?.ten ?? item.sanPhamId,
      anh: product?.anh ?? null,
      soLuongTon: product?.soLuongTon ?? 0,
    };
  });
}
