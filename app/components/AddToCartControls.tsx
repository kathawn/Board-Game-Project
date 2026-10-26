"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart/CartContext";

/** FR-BH-08: chọn số lượng rồi thêm vào giỏ mua — chỉ áp dụng cho đặt mua, không áp dụng cho đặt thuê. */
export function AddToCartControls({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [soLuong, setSoLuong] = useState(1);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const conHang = product.soLuongTon > 0;

  const handleAdd = async () => {
    const result = await addItem(product.slug, soLuong);
    if (result.ok) {
      setMessage({ type: "ok", text: `Đã thêm ${soLuong} "${product.ten}" vào giỏ.` });
    } else {
      setMessage({ type: "error", text: result.error });
    }
  };

  return (
    <div className="flex-1">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded border border-ink/25">
          <button
            type="button"
            onClick={() => setSoLuong((n) => Math.max(1, n - 1))}
            disabled={!conHang}
            aria-label="Giảm số lượng"
            className="flex h-12 w-12 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink-soft"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold" data-testid="so-luong-chon">
            {soLuong}
          </span>
          <button
            type="button"
            onClick={() => setSoLuong((n) => Math.min(product.soLuongTon, n + 1))}
            disabled={!conHang || soLuong >= product.soLuongTon}
            aria-label="Tăng số lượng"
            className="flex h-12 w-12 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink-soft"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!conHang}
          className="flex-1 border border-ink px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          Thêm vào giỏ
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-3 text-sm ${message.type === "ok" ? "text-forest" : "text-wine"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
