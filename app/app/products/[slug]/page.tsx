import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Users2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { AddToCartControls } from "@/components/AddToCartControls";
import { getProductBySlug, formatVND, giaThueNgayDau } from "@/lib/products";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ loai?: string }>;
}) {
  const { slug } = await params;
  const { loai } = await searchParams;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const trangThai: "ban" | "thue" = loai === "thue" ? "thue" : "ban";
  const docBanItems = product.linhKien.filter((item) => item.docBan);
  const tieuChuanItems = product.linhKien.filter((item) => !item.docBan);

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/products"
            className="mb-8 inline-block text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-wine"
          >
            ← Quay lại danh sách sản phẩm
          </Link>

          <Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="relative aspect-square w-full overflow-hidden rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
              <Image
                src={product.anh}
                alt={product.ten}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            </div>

            <div>
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                {product.danhMuc}
              </span>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,40px)] font-heading leading-tight">
                {product.ten}
              </h1>

              <div className="mb-6 flex items-center gap-2 text-sm text-ink-soft">
                <Users2 className="h-4 w-4" />
                <span>
                  {product.soNguoiMin}–{product.soNguoiMax} người chơi
                </span>
              </div>

              <div className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-y border-ink/8 py-5">
                {trangThai === "ban" ? (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Giá mua
                    </p>
                    <p className="font-heading text-2xl font-bold">
                      {formatVND(product.giaNiemYet)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Giá thuê
                    </p>
                    <p className="font-heading text-2xl font-bold">
                      {formatVND(giaThueNgayDau(product.giaNiemYet))}
                      <span className="text-sm font-normal text-ink-soft">/ngày</span>
                    </p>
                  </div>
                )}
              </div>

              <p className="mb-8 text-sm font-light leading-relaxed text-ink-soft">
                {product.moTaNgan}
              </p>

              <div className="flex flex-wrap gap-4">
                {trangThai === "ban" ? (
                  <>
                    <button className="flex-1 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep">
                      Mua ngay
                    </button>
                    <AddToCartControls product={product} />
                  </>
                ) : (
                  <>
                    <button className="flex-1 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep">
                      Thuê ngay
                    </button>
                    <button className="flex-1 border border-ink px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream">
                      Thêm vào giỏ
                    </button>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          {/* CHECKLIST LINH KIỆN — FR-BH-03 */}
          <Reveal className="mt-16 overflow-hidden rounded shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Chính sách đền bù — panel tối để tạo tương phản với khối checklist */}
              <div className="relative overflow-hidden bg-wine-deep px-8 py-10 text-cream sm:px-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    background:
                      "radial-gradient(ellipse at 20% 15%, rgba(184,144,63,0.22), transparent 55%)",
                  }}
                />
                <div className="relative">
                  <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    Chính sách đền bù — BRU-04
                  </span>
                  <h2 className="mb-4 font-heading text-2xl leading-tight">
                    Checklist linh kiện đi kèm
                  </h2>
                  <p className="text-sm leading-relaxed text-cream/75">
                    {product.linhKien.length} linh kiện được khai báo cho sản phẩm này. Kiểm đủ
                    khi nhận hàng — đây là căn cứ tính đền bù nếu có thất lạc lúc trả.
                  </p>

                  <div className="mt-8 space-y-5 border-t border-cream/15 pt-6">
                    <div className="flex gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <p className="text-[13px] leading-relaxed text-cream/70">
                        <strong className="font-semibold text-gold">Độc bản</strong> — mất hoặc hư
                        hỏng khi trả hàng: đền 100% giá trị nguyên bộ sản phẩm.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cream/60" />
                      <p className="text-[13px] leading-relaxed text-cream/70">
                        <strong className="font-semibold text-cream">Tiêu chuẩn</strong> — đền theo
                        giá linh kiện lẻ niêm yết, hoặc 20% giá trị nguyên bộ nếu nhà phân phối
                        không bán lẻ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách linh kiện, nhóm theo độc bản / tiêu chuẩn */}
              <div className="bg-paper px-8 py-10 sm:px-10">
                {docBanItems.length > 0 && (
                  <div className={tieuChuanItems.length > 0 ? "mb-9" : undefined}>
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-wine">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Linh kiện độc bản
                      <span className="font-normal normal-case tracking-normal text-ink-soft">
                        ({docBanItems.length})
                      </span>
                    </h3>
                    <ul className="divide-y divide-ink/8">
                      {docBanItems.map((item, i) => (
                        <li key={item.ten} className="flex items-baseline gap-4 py-3">
                          <span className="font-heading text-xs italic text-wine/55">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm text-ink">{item.ten}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tieuChuanItems.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Linh kiện tiêu chuẩn
                      <span className="ml-2 font-normal normal-case tracking-normal">
                        ({tieuChuanItems.length})
                      </span>
                    </h3>
                    <ul className="divide-y divide-ink/8">
                      {tieuChuanItems.map((item, i) => (
                        <li key={item.ten} className="flex items-baseline gap-4 py-3">
                          <span className="font-heading text-xs italic text-ink-soft/55">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm text-ink-soft">{item.ten}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </>
  );
}
