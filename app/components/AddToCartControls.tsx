"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart/CartContext";

/** FR-BH-08: chọn số lượng rồi thêm vào giỏ mua — chỉ áp dụng cho đặt mua, không áp dụng cho đặt thuê. */
export function AddToCartControls({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [soLuong, setSoLuong] = useState(1);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const conHang = product.soLuongTon > 0;

  const [busy, setBusy] = useState(false);

  // Thêm vào giỏ; chưa đăng nhập thì chuyển sang trang đăng nhập thay vì chỉ báo lỗi chữ.
  const themVaoGio = async (): Promise<boolean> => {
    setBusy(true);
    try {
      const result = await addItem(product.slug, soLuong);
      if (result.ok) return true;
      if (/đăng nhập/i.test(result.error)) {
        router.push("/login");
        return false;
      }
      setMessage({ type: "error", text: result.error });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async () => {
    if (await themVaoGio()) {
      setMessage({ type: "ok", text: `Đã thêm ${soLuong} "${product.ten}" vào giỏ.` });
    }
  };

  // "Mua ngay": thêm vào giỏ rồi sang giỏ hàng để thanh toán.
  const handleBuyNow = async () => {
    if (await themVaoGio()) router.push("/cart");
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

        <p className="text-xs text-ink-soft">
          {conHang ? `Còn ${product.soLuongTon} hộp` : "Hết hàng"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!conHang || busy}
          className="flex-1 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Mua ngay
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!conHang || busy}
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
