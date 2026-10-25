import Image from "next/image";
import type { Product } from "@/lib/products";
import { formatVND } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded bg-card shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)] transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-18px_rgba(42,31,26,0.3)]">
      <div className="relative h-48 w-full">
        <Image
          src={product.anh}
          alt={product.ten}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
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
