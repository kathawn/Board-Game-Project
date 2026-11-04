import { Dice5, Gamepad2, Users2, HeartHandshake, Gift, PartyPopper } from "lucide-react";
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

const OCCASIONS = [
  { icon: Users2, label: "Gia đình chủ nhật" },
  { icon: HeartHandshake, label: "Hẹn hò nhẹ nhàng" },
  { icon: PartyPopper, label: "Tiệc đông bạn bè" },
  { icon: Gamepad2, label: "Đêm chiến thuật" },
  { icon: Dice5, label: "Team building" },
  { icon: Gift, label: "Quà tặng" },
];

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
  // Nổi bật ưu tiên Cờ Tỷ Phú, nhưng nếu hết hàng thì chuyển sang sản phẩm còn hàng đầu tiên.
  const FEATURED =
    PRODUCTS.find((p) => p.slug === "co-ty-phu" && p.soLuongTon > 0) ??
    PRODUCTS.find((p) => p.soLuongTon > 0) ??
    PRODUCTS[0];
  if (!FEATURED) return null;
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
            BoardVerse — Quận 1, TP. Hồ Chí Minh
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
              Khám phá bộ sưu tập
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

      {/* FEATURED */}
      <section id="featured" className="overflow-hidden bg-paper py-24 sm:py-36">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal className="relative min-h-[320px] lg:min-h-[480px]">
            <div className="relative h-full min-h-[320px] w-[88%] overflow-hidden rounded bg-amber/40 shadow-[0_40px_80px_-30px_rgba(42,31,26,0.35)] lg:min-h-[480px]">
              <Image
                src={FEATURED.anh}
                alt={FEATURED.ten}
                fill
                sizes="(min-width: 1024px) 45vw, 88vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-2 bottom-[-20px] w-[260px] rotate-2 rounded border border-ink/12 bg-paper p-6 shadow-[0_30px_60px_-20px_rgba(42,31,26,0.3)] sm:bottom-[-40px] sm:w-[300px]">
              <span className="mb-2.5 block text-[10px] uppercase tracking-wider text-gold">
                {FEATURED.danhMuc}
              </span>
              <h3 className="mb-4.5 font-script text-3xl font-normal leading-tight text-wine">
                {FEATURED.ten}
              </h3>
              <div className="mb-3.5">
                <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-ink-soft">
                  Số người chơi
                </span>
                <span className="block font-heading text-sm italic">
                  {FEATURED.soNguoiMin}–{FEATURED.soNguoiMax} người
                </span>
              </div>
              <div className="mb-3.5">
                <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-ink-soft">
                  Linh kiện đi kèm
                </span>
                <span className="block font-heading text-sm italic">
                  {FEATURED.linhKien.length} món, kiểm đếm đầy đủ khi trả
                </span>
              </div>
              <div className="mt-4.5 border-t border-ink/10 pt-3.5 text-[10px] uppercase tracking-wider text-ink-soft">
                Chọn lọc tại BoardVerse, TP.HCM
              </div>
            </div>
          </Reveal>

          <Reveal className="pt-10 lg:pt-0">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Sản phẩm nổi bật tuần này
            </span>
            <h2 className="mb-5 text-[clamp(30px,3.6vw,44px)] font-heading leading-tight">
              Một buổi chiều
              <br />
              không vội vàng
            </h2>
            <p className="mb-9 max-w-[440px] text-base font-light leading-relaxed text-ink-soft">
              {FEATURED.ten} — {FEATURED.moTaNgan} Chỉ cần một cái bàn và những
              người bạn sẵn sàng ngồi lại cùng nhau.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="inline-flex overflow-hidden rounded border border-ink/20">
                <Link
                  href={`/products/${FEATURED.slug}?loai=ban`}
                  className="bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream"
                >
                  Mua
                </Link>
                <Link
                  href={`/products/${FEATURED.slug}?loai=thue`}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:bg-ink/5"
                >
                  Thuê/ngày
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <span className="block font-heading text-2xl font-bold">
                    {formatVND(FEATURED.giaNiemYet)}
                  </span>
                  <span className="block text-[11px] text-ink-soft">
                    hoặc thuê từ {formatVND(giaThueNgayDau(FEATURED.giaNiemYet))}/ngày · còn{" "}
                    {FEATURED.soLuongTon} hộp
                  </span>
                </div>
                <Link
                  href={`/products/${FEATURED.slug}?loai=ban`}
                  className="bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep"
                >
                  Xem &amp; thêm vào giỏ
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="bg-cream py-24 sm:py-36">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mx-auto mb-16 max-w-[620px] text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Bộ sưu tập
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

      {/* OCCASIONS */}
      <section
        id="occasions"
        className="relative overflow-hidden bg-wine-deep py-24 text-cream sm:py-36"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(184,144,63,0.25), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(122,34,48,0.5), transparent 60%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mx-auto mb-16 max-w-[560px] text-center">
            <h2 className="mb-5 text-[clamp(30px,3.6vw,44px)] font-heading leading-tight text-cream">
              Phù hợp cho{" "}
              <span className="font-script text-[1.5em] font-normal text-gold">
                mọi dịp
              </span>
            </h2>
            <p className="mx-auto max-w-[440px] text-base font-light leading-relaxed text-cream/75">
              Không phải lúc nào cũng cần một chiến thuật gia. Chọn theo không
              khí bạn muốn.
            </p>
          </Reveal>

          <div className="mb-14 grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-6">
            {OCCASIONS.map((occasion, i) => {
              const Icon = occasion.icon;
              return (
                <Reveal
                  key={occasion.label}
                  delay={i * 60}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <span className="font-heading text-xs italic text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-cream/25">
                    <Icon className="h-6 w-6 text-cream/80" aria-hidden />
                  </div>
                  <span className="text-xs font-medium tracking-wide text-cream/85">
                    {occasion.label}
                  </span>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center bg-ink px-8.5 py-4 text-[13px] font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-black"
            >
              Đặt combo trải nghiệm — 890.000đ
            </a>
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
              Quận 1, Thành phố Hồ Chí Minh
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
