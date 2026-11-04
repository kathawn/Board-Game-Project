"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { StockCheckResult } from "@/lib/products";

export interface CartItem {
  sanPhamId: string;
  soLuong: number;
  donGia: number;
  /** Do server trả kèm từ danh mục hiện tại (FR-ADM-03) để giao diện không tra danh mục tĩnh. */
  ten: string;
  anh: string | null;
  soLuongTon: number;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  addItem: (sanPhamId: string, soLuong: number) => Promise<StockCheckResult>;
  updateQuantity: (sanPhamId: string, soLuong: number) => Promise<StockCheckResult>;
  removeItem: (sanPhamId: string) => Promise<void>;
  /** Số dòng giỏ thuê (FR-CT-01) — để badge Header đếm cả hai loại giỏ. */
  rentalCount: number;
  /** null = đang kiểm tra; true/false = khách đã/chưa đăng nhập (suy ra từ /api/cart/summary). */
  loggedIn: boolean | null;
  /** Tải lại trạng thái đăng nhập + giỏ (gọi sau khi đăng nhập/đăng xuất hoặc khi vào trang có Header). */
  refresh: () => Promise<void>;
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

/** Khu nội bộ (Staff/Admin) dùng phiên riêng, không có giỏ hàng — không cần hỏi giỏ của khách ở đó. */
const isInternalArea = (pathname: string) => pathname.startsWith("/staff") || pathname.startsWith("/admin");

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const internal = isInternalArea(pathname);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalCount, setRentalCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  // Dùng chung một request đang bay: Provider và Header cùng gọi refresh() lúc tải trang vẫn chỉ tốn 1 lần gọi API.
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    // /api/cart/summary luôn trả 200 (khách chưa đăng nhập → loggedIn:false) nên không sinh lỗi 401 trong console.
    const p = fetch("/api/cart/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        setLoggedIn(Boolean(body?.loggedIn));
        setItems(body?.items ?? []);
        setRentalCount(body?.rentalCount ?? 0);
      })
      .catch(() => setLoggedIn(false))
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });
    inFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    if (internal) return;
    void refresh();
  }, [internal, refresh]);

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
    () => ({ items, loading, addItem, updateQuantity, removeItem, rentalCount, loggedIn, refresh, setRentalCount, totalItems, totalAmount }),
    [items, loading, addItem, updateQuantity, removeItem, rentalCount, loggedIn, refresh, totalItems, totalAmount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được dùng trong CartProvider.");
  return ctx;
}
