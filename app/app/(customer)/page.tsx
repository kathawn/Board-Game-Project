import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { Suspense } from "react";
import { formatVND, giaThueNgayDau } from "@/lib/products";
import { catalog } from "@/lib/catalog/server";

// Danh mục đọc từ bảng SanPham (FR-ADM-03) nên là dữ liệu runtime → bọc trong Suspense (cacheComponents).
export default function CustomerHome() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const PRODUCTS = await catalog.list();
  // Sản phẩm nổi bật = top 5 bán chạy nhất (theo số hộp ở các đơn mua chưa huỷ).
  const TOP = await catalog.topSelling(5);
  // Ảnh nền hero: 6 hộp game đầu bảng (sắp theo tên), ghép mờ phía sau lớp phủ rượu vang.
  const HERO_COVERS = PRODUCTS.filter((p) => p.anh !== "/images/placeholder.jpg").slice(0, 6);

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-wine-deep text-center">
        <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-6" aria-hidden>
          {HERO_COVERS.map((p) => (
            <div key={p.slug} className="relative">
              <Image src={p.anh} alt="" fill priority sizes="(min-width: 768px) 17vw, 34vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-wine-deep/80" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(42,31,26,0.3) 0%, rgba(42,31,26,0.62) 75%, rgba(42,31,26,0.78) 100%)",
          }}
        />
        <div className="relative z-10 max-w-[680px] px-6 text-cream">
          <span className="mb-4.5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            BoardVerse — Cầu Giấy, Hà Nội
          </span>
          <h1 className="mb-2 font-script text-[clamp(72px,11vw,150px)] font-normal leading-none text-paper">
            BoardVerse
          </h1>
          <p className="mx-auto mb-9 max-w-[460px] text-[17px] font-light leading-relaxed text-cream/82">
            Một buổi tối, một ván cờ, những người bạn cũ.
            <br />
            Board game chọn lọc — mua đứt hoặc thuê theo ngày.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#collection"
              className="inline-flex items-center justify-center gap-2 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep"
            >
              Khám phá sản phẩm
            </a>
            <a
              href="#featured"
              className="inline-flex items-center justify-center border border-cream/50 px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-cream transition-all hover:border-cream hover:bg-cream/10"
            >
              Xem sản phẩm nổi bật
            </a>
          </div>
        </div>
        <div className="absolute bottom-9 left-1/2 z-10 -translate-x-1/2 text-[11px] uppercase tracking-[0.16em] text-cream/60">
          cuộn để khám phá
        </div>
      </section>

      {/* FEATURED — top 5 bán chạy nhất */}
      <section id="featured" className="bg-paper py-24 sm:py-36">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mx-auto mb-16 max-w-[620px] text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Sản phẩm nổi bật
            </span>
            <h2 className="mb-5 text-[clamp(30px,3.6vw,44px)] font-heading leading-tight">
              Top 5 board game
              <br />
              bán chạy nhất
            </h2>
            <p className="mx-auto max-w-[460px] text-base font-light leading-relaxed text-ink-soft">
              Những hộp game được khách chọn nhiều nhất tại BoardVerse — kèm vài
              dòng giới thiệu để bạn chọn đúng tựa cho buổi chơi.
            </p>
          </Reveal>

          <div className="flex flex-col gap-8">
            {TOP.map((p, i) => (
              <Reveal key={p.slug}>
                <article className="grid grid-cols-1 gap-6 rounded bg-cream p-5 shadow-[0_30px_60px_-30px_rgba(42,31,26,0.25)] sm:grid-cols-[200px_1fr] sm:gap-8 sm:p-6 lg:grid-cols-[240px_1fr_auto]">
                  <Link
                    href={`/products/${p.slug}`}
                    className="relative block aspect-[4/3] overflow-hidden rounded bg-amber/40 sm:aspect-square"
                  >
                    <Image
                      src={p.anh}
                      alt={p.ten}
                      fill
                      sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 90vw"
                      className="object-cover"
                    />
                    <span className="absolute left-0 top-0 bg-wine px-3 py-1.5 font-heading text-sm italic text-paper">
                      #{i + 1}
                    </span>
                  </Link>

                  <div className="flex flex-col justify-center">
                    <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gold">
                      {p.danhMuc}
                    </span>
                    <h3 className="mb-3 font-script text-3xl font-normal leading-tight text-wine sm:text-4xl">
                      {p.ten}
                    </h3>
                    <p className="mb-4 max-w-[520px] text-[15px] font-light leading-relaxed text-ink-soft">
                      {p.moTaNgan}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {p.soNguoiMin}–{p.soNguoiMax} người chơi · {p.linhKien.length} loại linh kiện
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-3 sm:col-span-2 lg:col-span-1 lg:items-end lg:text-right">
                    <div>
                      <span className="block font-heading text-2xl font-bold">
                        {formatVND(p.giaNiemYet)}
                      </span>
                      <span className="block text-[11px] text-ink-soft">
                        hoặc thuê từ {formatVND(giaThueNgayDau(p.giaNiemYet))}/ngày
                      </span>
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="inline-flex items-center justify-center bg-wine px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="bg-cream py-24 sm:py-36">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mx-auto mb-16 max-w-[620px] text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Sản phẩm
            </span>
            <h2 className="mb-5 text-[clamp(30px,3.6vw,44px)] font-heading leading-tight">
              Mỗi hộp game,
              <br />
              một tông màu riêng
            </h2>
            <p className="mx-auto max-w-[440px] text-base font-light leading-relaxed text-ink-soft">
              Từ chiến thuật sâu sắc đến giải trí nhẹ nhàng — chọn theo cảm xúc
              bạn muốn mang đến bàn chơi.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product, i) => (
              <Reveal key={product.slug} delay={(i % 4) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14 text-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep"
            >
              Xem toàn bộ sản phẩm
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-paper py-24 sm:py-36">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-18">
          <Reveal>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Ghé thăm
            </span>
            <h2 className="mb-5 text-[clamp(30px,3.6vw,44px)] font-heading leading-tight">
              Hẹn gặp bạn
              <br />
              tại BoardVerse
            </h2>
            <p className="max-w-[440px] text-base font-light leading-relaxed text-ink-soft">
              Cầu Giấy, Hà Nội
              <br />
              09:00 – 22:00, tất cả các ngày trong tuần
              <br />
              Hotline: 0909 123 456
            </p>
          </Reveal>
          <Reveal>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
