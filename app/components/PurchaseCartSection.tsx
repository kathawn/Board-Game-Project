"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useCart } from "@/lib/cart/CartContext";
import { formatVND } from "@/lib/products";

/** FR-BH-09: xem lại giỏ mua, sửa số lượng hoặc xoá bớt sản phẩm trước khi thanh toán. */
export function PurchaseCartSection() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();

  return (
    <section className="mt-16">
      <Reveal className="mb-6 text-center">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Giỏ mua
        </span>
        <h2 className="font-heading text-3xl font-semibold text-ink">Giỏ mua của bạn</h2>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Sửa số lượng hoặc xoá sản phẩm trước khi xác nhận thanh toán.
        </p>
      </Reveal>

      {items.length === 0 ? (
            <Reveal className="rounded bg-paper p-12 text-center text-sm text-ink-soft">
              Giỏ hàng trống.{" "}
              <Link href="/products" className="font-semibold text-wine hover:underline">
                Xem danh sách sản phẩm
              </Link>
            </Reveal>
          ) : (
            <Reveal className="rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
              <ul>
                {items.map((item) => {
                  // Dữ liệu sản phẩm do server trả kèm mỗi dòng giỏ; anh = null nghĩa là sản phẩm không còn trong danh mục.
                  if (!item.anh) return null;
                  const product = {
                    slug: item.sanPhamId,
                    ten: item.ten,
                    anh: item.anh,
                    giaNiemYet: item.donGia,
                    soLuongTon: item.soLuongTon,
                  };

                  return (
                    <li
                      key={item.sanPhamId}
                      className="flex flex-wrap items-center gap-4 border-b border-ink/8 p-5 last:border-b-0 sm:p-6"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-cream">
                        <Image
                          src={product.anh}
                          alt={product.ten}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      <div className="min-w-[160px] flex-1">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-heading text-base hover:text-wine"
                        >
                          {product.ten}
                        </Link>
                        <p className="mt-1 text-sm text-ink-soft">{formatVND(product.giaNiemYet)}</p>
                      </div>

                      <div className="flex items-center rounded border border-ink/25">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sanPhamId, item.soLuong - 1)}
                          disabled={item.soLuong <= 1}
                          aria-label={`Giảm số lượng ${product.ten}`}
                          className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink-soft"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold">{item.soLuong}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sanPhamId, item.soLuong + 1)}
                          disabled={item.soLuong >= product.soLuongTon}
                          aria-label={`Tăng số lượng ${product.ten}`}
                          className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink-soft"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="w-28 shrink-0 text-right font-heading text-base font-bold">
                        {formatVND(product.giaNiemYet * item.soLuong)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.sanPhamId)}
                        aria-label={`Xoá ${product.ten} khỏi giỏ`}
                        className="text-ink-soft transition-colors hover:text-wine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/8 p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                    Tổng tiền hàng
                  </p>
                  <p className="font-heading text-2xl font-bold" data-testid="tong-tien-gio">
                    {formatVND(totalAmount)}
                  </p>
                </div>
                <button className="bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep">
                  Tiến hành thanh toán
                </button>
              </div>
            </Reveal>
          )}
    </section>
  );
}
