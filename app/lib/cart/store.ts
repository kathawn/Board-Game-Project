export type CartLineItem = {
  sanPhamId: string;
  soLuong: number;
};

export interface CartStore {
  get(customerId: string): CartLineItem[];
  setItem(customerId: string, sanPhamId: string, soLuong: number): void;
  removeItem(customerId: string, sanPhamId: string): void;
}

export function createInMemoryCartStore(): CartStore {
  const carts = new Map<string, CartLineItem[]>();

  return {
    get(customerId) {
      return carts.get(customerId) ?? [];
    },
    setItem(customerId, sanPhamId, soLuong) {
      const items = carts.get(customerId) ?? [];
      const existing = items.find((i) => i.sanPhamId === sanPhamId);
      if (existing) {
        existing.soLuong = soLuong;
      } else {
        items.push({ sanPhamId, soLuong });
      }
      carts.set(customerId, items);
    },
    removeItem(customerId, sanPhamId) {
      const items = carts.get(customerId);
      if (!items) return;
      carts.set(
        customerId,
        items.filter((i) => i.sanPhamId !== sanPhamId),
      );
    },
  };
}
