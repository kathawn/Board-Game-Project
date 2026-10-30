"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { StockCheckResult } from "@/lib/products";

export interface CartItem {
  sanPhamId: string;
  soLuong: number;
  donGia: number;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  addItem: (sanPhamId: string, soLuong: number) => Promise<StockCheckResult>;
  updateQuantity: (sanPhamId: string, soLuong: number) => Promise<StockCheckResult>;
  removeItem: (sanPhamId: string) => Promise<void>;
  /** Số dòng giỏ thuê (FR-CT-01) — để badge Header đếm cả hai loại giỏ. */
  rentalCount: number;
  setRentalCount: (n: number) => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

async function parseErrorOrItems(response: Response): Promise<
  { ok: true; items: CartItem[] } | { ok: false; error: string }
> {
  const body = await response.json();
  if (!response.ok) {
    return { ok: false, error: body.error ?? "Có lỗi xảy ra, vui lòng thử lại." };
  }
  return { ok: true, items: body.items };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalCount, setRentalCount] = useState(0);

  useEffect(() => {
    // Chỉ lấy số đếm của giỏ thuê (trang 1), không tải cả giỏ — giỏ có thể rất lớn.
    fetch("/api/rental-cart/list?page=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body?.counts) setRentalCount(body.counts.all);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((body) => {
        if (!cancelled) setItems(body.items ?? []);
      })
      .catch(() => {
        // not logged in / network error — mockup just shows an empty cart
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback(async (sanPhamId: string, soLuong: number): Promise<StockCheckResult> => {
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sanPhamId, soLuong }),
    });
    const result = await parseErrorOrItems(response);
    if (!result.ok) return { ok: false, error: result.error };
    setItems(result.items);
    return { ok: true };
  }, []);

  const updateQuantity = useCallback(async (sanPhamId: string, soLuong: number): Promise<StockCheckResult> => {
    const response = await fetch(`/api/cart/items/${sanPhamId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ soLuong }),
    });
    const result = await parseErrorOrItems(response);
    if (!result.ok) return { ok: false, error: result.error };
    setItems(result.items);
    return { ok: true };
  }, []);

  const removeItem = useCallback(async (sanPhamId: string) => {
    const response = await fetch(`/api/cart/items/${sanPhamId}`, { method: "DELETE" });
    if (!response.ok) return;
    const body = await response.json();
    setItems(body.items);
  }, []);

  // Badge trên Header đếm số dòng (sản phẩm khác nhau) của cả giỏ mua lẫn giỏ thuê,
  // không cộng dồn số lượng từng sản phẩm.
  const totalItems = items.length + rentalCount;
  const totalAmount = items.reduce((sum, i) => sum + i.donGia * i.soLuong, 0);

  const value = useMemo<CartContextValue>(
    () => ({ items, loading, addItem, updateQuantity, removeItem, rentalCount, setRentalCount, totalItems, totalAmount }),
    [items, loading, addItem, updateQuantity, removeItem, rentalCount, totalItems, totalAmount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được dùng trong CartProvider.");
  return ctx;
}
