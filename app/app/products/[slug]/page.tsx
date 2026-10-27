import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Users2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { RentalAddToCart } from "@/components/RentalAddToCart";
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

              {trangThai === "ban" ? (
                <div className="flex flex-wrap gap-4">
                  <button className="flex-1 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep">
                    Mua ngay
                  </button>
                  <button className="flex-1 border border-ink px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream">
                    Thêm vào giỏ
                  </button>
                </div>
              ) : (
                // FR-CT-01 — chọn ngày thuê riêng cho sản phẩm này rồi thêm vào giỏ thuê
                <RentalAddToCart productSlug={product.slug} />
              )}
            </div>
          </Reveal>

          {/* CHECKLIST LINH KIỆN — FR-BH-03 */}
          <Reveal className="mt-16 rounded bg-paper p-6 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)] sm:p-8">
            <h2 className="mb-1 font-heading text-xl">Checklist linh kiện đi kèm</h2>
            <p className="mb-6 text-sm text-ink-soft">
              {product.linhKien.length} linh kiện được khai báo cho sản phẩm này — linh kiện{" "}
              <strong className="font-semibold text-ink">độc bản</strong> được đánh dấu riêng: nếu
              mất/hư hỏng khi trả hàng, khách đền 100% giá trị nguyên bộ sản phẩm; với linh kiện
              không đánh dấu độc bản, khách đền theo giá linh kiện lẻ niêm yết, hoặc 20% giá trị
              nguyên bộ nếu nhà phân phối không bán lẻ linh kiện đó (BRU-04).
            </p>

            <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {product.linhKien.map((item) => (
                <li key={item.ten} className="flex items-start gap-2.5 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  <span className="flex flex-wrap items-center gap-2">
                    {item.ten}
                    {item.docBan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-wine">
                        <AlertTriangle className="h-3 w-3" />
                        Độc bản
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </main>

      <Footer />
    </>
  );
}
