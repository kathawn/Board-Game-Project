import { Dice5 } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatVND } from "@/lib/products";

const TONE_BG: Record<Product["tone"], string> = {
  amber: "bg-amber",
  forest: "bg-forest",
  wine: "bg-wine",
  sky: "bg-sky",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded bg-card shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)] transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-18px_rgba(42,31,26,0.3)]">
      <div
        className={`relative flex h-48 items-center justify-center ${TONE_BG[product.tone]}/50`}
      >
        <Dice5 className="h-12 w-12 text-ink/70" aria-hidden />
      </div>
      <div className="p-5">
        <h3 className="mb-2 font-heading text-lg">{product.ten}</h3>
        <p className="mb-4 min-h-[42px] text-[13px] font-light leading-relaxed text-ink-soft">
          {product.moTaNgan}
        </p>
        <div className="mb-4 flex items-baseline justify-between border-t border-ink/8 pt-3.5">
          <span className="text-[11px] text-ink-soft">
            {product.soNguoiMin}–{product.soNguoiMax} người
          </span>
          <span className="font-heading text-base font-bold">
            {formatVND(product.giaNiemYet)}
          </span>
        </div>
        <button className="w-full border border-ink/25 py-3 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-ink hover:text-cream">
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}
