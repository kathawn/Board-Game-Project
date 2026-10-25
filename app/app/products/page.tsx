"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { PRODUCTS, filterProducts, formatVND, giaThueNgayDau } from "@/lib/products";

type TrangThai = "ban" | "thue";

const DANH_MUC_ALL = "all";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [danhMuc, setDanhMuc] = useState(DANH_MUC_ALL);
  const [trangThai, setTrangThai] = useState<TrangThai>("ban");
  const [giaMin, setGiaMin] = useState("");
  const [giaMax, setGiaMax] = useState("");

  const danhMucList = useMemo(
    () => Array.from(new Set(PRODUCTS.map((p) => p.danhMuc))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const min = giaMin ? Number(giaMin) : undefined;
    const max = giaMax ? Number(giaMax) : undefined;

    return filterProducts(PRODUCTS, {
      q: query,
      danhMuc: danhMuc === DANH_MUC_ALL ? undefined : danhMuc,
      loai: trangThai,
      giaMin: min !== undefined && !Number.isNaN(min) ? min : undefined,
      giaMax: max !== undefined && !Number.isNaN(max) ? max : undefined,
    });
  }, [query, danhMuc, trangThai, giaMin, giaMax]);

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <Reveal className="mb-10">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Bộ sưu tập
            </span>
            <h1 className="mb-3 text-[clamp(28px,3.4vw,42px)] font-heading leading-tight">
              Danh sách sản phẩm
            </h1>
            <p className="max-w-[560px] text-sm font-light leading-relaxed text-ink-soft">
              Tìm theo tên, lọc theo danh mục và khoảng giá — xem giá mua đứt hoặc
              giá thuê ngày đầu cho từng tựa game.
            </p>
          </Reveal>

          {/* FILTER BAR */}
          <Reveal className="mb-10 rounded bg-paper p-5 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  Tìm theo tên
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ví dụ: Catan, Azul..."
                    className="w-full rounded border border-ink/18 bg-cream py-3 pl-10 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:w-[220px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  Danh mục
                </label>
                <select
                  value={danhMuc}
                  onChange={(e) => setDanhMuc(e.target.value)}
                  className="w-full rounded border border-ink/18 bg-cream py-3 px-3.5 text-sm text-ink focus:border-wine focus:outline-none"
                >
                  <option value={DANH_MUC_ALL}>Tất cả danh mục</option>
                  {danhMucList.map((dm) => (
                    <option key={dm} value={dm}>
                      {dm}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:w-[260px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  Khoảng giá (VNĐ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={giaMin}
                    onChange={(e) => setGiaMin(e.target.value)}
                    placeholder="Từ"
                    className="w-full rounded border border-ink/18 bg-cream py-3 px-3.5 text-sm text-ink focus:border-wine focus:outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    value={giaMax}
                    onChange={(e) => setGiaMax(e.target.value)}
                    placeholder="Đến"
                    className="w-full rounded border border-ink/18 bg-cream py-3 px-3.5 text-sm text-ink focus:border-wine focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  Trạng thái
                </label>
                <div className="flex rounded border border-ink/18 bg-cream p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTrangThai("ban");
                      setGiaMin("");
                      setGiaMax("");
                    }}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      trangThai === "ban" ? "bg-wine text-paper" : "text-ink-soft"
                    }`}
                  >
                    Bán
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrangThai("thue");
                      setGiaMin("");
                      setGiaMax("");
                    }}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      trangThai === "thue" ? "bg-wine text-paper" : "text-ink-soft"
                    }`}
                  >
                    Thuê/ngày
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* RESULT */}
          <p className="mb-6 text-xs font-medium uppercase tracking-wider text-ink-soft">
            {filtered.length} sản phẩm khớp điều kiện
          </p>

          {filtered.length === 0 ? (
            <Reveal className="rounded bg-paper p-12 text-center text-sm text-ink-soft">
              Không tìm thấy sản phẩm phù hợp. Thử đổi từ khoá hoặc khoảng giá.
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((product, i) => (
                <Reveal key={product.slug} delay={(i % 4) * 60}>
                  <ProductCard product={product} />
                  {trangThai === "thue" && (
                    <p className="mt-2 text-center text-xs text-ink-soft">
                      Từ {formatVND(giaThueNgayDau(product.giaNiemYet))}/ngày
                    </p>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
