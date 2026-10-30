"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ShoppingBag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { PurchaseCartTab } from "@/components/cart/PurchaseCartTab";
import { RentalCartTab } from "@/components/cart/RentalCartTab";

type Tab = "thue" | "mua";

function TabButton({
  active,
  count,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  count: number | null;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? "border-wine text-wine" : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {icon}
      {children}
      {/* Chỗ của badge luôn được giữ để tab không nhảy khi số lượng tải xong. */}
      <span
        className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${
          active ? "bg-wine text-paper" : "bg-ink/10 text-ink-soft"
        } ${count === null ? "invisible" : ""}`}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

function CartView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "mua" ? "mua" : "thue";
  const [soThue, setSoThue] = useState<number | null>(null);
  const [soMua, setSoMua] = useState<number | null>(null);

  const onUnauthorized = useCallback(() => router.push("/login"), [router]);

  const setTab = (next: Tab) => router.replace(`/cart?tab=${next}`, { scroll: false });

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <Reveal className="mb-8">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">Giỏ hàng</span>
            <h1 className="font-heading text-3xl font-semibold text-ink">Giỏ hàng của bạn</h1>
            <p className="mt-2 max-w-[560px] text-sm font-light text-ink-soft">
              Giỏ thuê và giỏ mua tách riêng: thuê chọn ngày cho từng sản phẩm (FR-CT-01), mua chọn số lượng (FR-BH-08).
            </p>
          </Reveal>

          <div role="tablist" className="mb-6 flex border-b border-ink/10">
            <TabButton active={tab === "thue"} count={soThue} icon={<CalendarRange className="h-4 w-4" />} onClick={() => setTab("thue")}>
              Giỏ thuê
            </TabButton>
            <TabButton active={tab === "mua"} count={soMua} icon={<ShoppingBag className="h-4 w-4" />} onClick={() => setTab("mua")}>
              Giỏ mua
            </TabButton>
          </div>

          {/* Cả hai tab luôn được mount để badge đếm đúng ngay từ đầu; tab không chọn chỉ bị ẩn. */}
          <div role="tabpanel" hidden={tab !== "thue"}>
            <RentalCartTab onUnauthorized={onUnauthorized} onCount={setSoThue} />
          </div>
          <div role="tabpanel" hidden={tab !== "mua"}>
            <PurchaseCartTab onUnauthorized={onUnauthorized} onCount={setSoMua} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartView />
    </Suspense>
  );
}
