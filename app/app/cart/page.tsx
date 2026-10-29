"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, CalendarRange, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { getProductBySlug, formatVND } from "@/lib/products";
import type { RentalCartLine } from "@/lib/rentals/store";

interface TienCocInfo {
  diaChiNhan: string;
  doiTac: "GreenSM" | "ShopeeExpress";
  tongTienThue: number;
  tongTienCoc: number;
}

const TEN_DOI_TAC: Record<TienCocInfo["doiTac"], string> = {
  GreenSM: "Green SM",
  ShopeeExpress: "Shopee Express",
};

function soNgay(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000);
}

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<RentalCartLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [dongGia, setDongGia] = useState<{ lineId: string; tienThue: number; tienCoc: number }[]>([]);
  const [coc, setCoc] = useState<TienCocInfo>({
    diaChiNhan: "",
    doiTac: "GreenSM",
    tongTienThue: 0,
    tongTienCoc: 0,
  });

  const reloadCart = async () => {
    const response = await fetch("/api/rental-cart");
    if (!response.ok) {
      router.push("/login");
      return;
    }
    const data = await response.json();
    setLines(data.lines);
    setDongGia(data.coc.dongGia);
    setCoc({
      diaChiNhan: data.coc.diaChiNhan,
      doiTac: data.coc.doiTac,
      tongTienThue: data.coc.tongTienThue,
      tongTienCoc: data.coc.tongTienCoc,
    });
  };

  useEffect(() => {
    (async () => {
      await reloadCart();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleRemove = async (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/rental-cart/${id}`, { method: "DELETE" });
    await reloadCart();
  };

  const startEdit = (line: RentalCartLine) => {
    setEditingId(line.id);
    setEditStart(line.startDate);
    setEditEnd(line.endDate);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    setEditError(null);
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/rental-cart/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startDate: editStart, endDate: editEnd }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      setLines((prev) => prev.map((l) => (l.id === id ? data.line : l)));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const rows = lines
    .map((line) => ({
      line,
      product: getProductBySlug(line.productSlug),
      tienThue: dongGia.find((d) => d.lineId === line.id)?.tienThue ?? 0,
    }))
    .filter(
      (row): row is { line: RentalCartLine; product: NonNullable<ReturnType<typeof getProductBySlug>>; tienThue: number } =>
        Boolean(row.product),
    );

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/rental-cart/checkout", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setCheckoutError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      setCheckoutOrderId(data.order.id);
      await reloadCart();
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-cream px-5 pt-32">
          <p className="text-sm text-ink-soft">Đang tải...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[840px]">
          <Reveal className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Giỏ thuê
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">
              Giỏ thuê của bạn
            </h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Mỗi sản phẩm có thể chọn khoảng ngày thuê riêng (FR-CT-01).
            </p>
          </Reveal>

          {rows.length === 0 ? (
            <Reveal className="rounded bg-paper p-12 text-center text-sm text-ink-soft">
              {checkoutOrderId ? (
                <>
                  Đã tạo đơn thuê <span className="font-semibold text-ink">{checkoutOrderId}</span> ở
                  trạng thái &quot;Chờ xác nhận&quot; (Pending) — chờ nhân viên xác nhận đã thu cọc (FR-CT-05).{" "}
                  <Link href="/orders" className="font-semibold text-wine hover:underline">
                    Xem lịch sử đơn
                  </Link>
                </>
              ) : (
                <>
                  Giỏ thuê đang trống.{" "}
                  <Link href="/products" className="font-semibold text-wine hover:underline">
                    Xem sản phẩm cho thuê
                  </Link>
                </>
              )}
            </Reveal>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {rows.map(({ line, product, tienThue }, i) => (
                  <Reveal key={line.id} delay={i * 60}>
                    <article className="flex flex-col gap-3 rounded bg-paper p-5 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft">
                            <CalendarRange className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-heading text-sm font-semibold text-ink">
                              {product.ten}
                            </h3>
                            <p className="mt-1 text-xs text-ink-soft">
                              Thuê {line.startDate} → {line.endDate} ({soNgay(line.startDate, line.endDate)} ngày)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
                          <span className="font-heading text-sm font-bold text-ink">
                            {formatVND(tienThue)}
                          </span>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => (editingId === line.id ? cancelEdit() : startEdit(line))}
                              aria-label="Sửa ngày thuê"
                              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-wine"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {editingId === line.id ? "Huỷ sửa" : "Sửa ngày"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(line.id)}
                              aria-label="Xoá khỏi giỏ thuê"
                              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-destructive hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xoá
                            </button>
                          </div>
                        </div>
                      </div>

                      {editingId === line.id && (
                        <div className="flex flex-col gap-3 border-t border-ink/8 pt-3.5 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                              Ngày bắt đầu
                            </label>
                            <input
                              type="date"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="w-full rounded border border-ink/18 bg-cream py-2.5 px-3 text-sm text-ink focus:border-wine focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                              Ngày kết thúc
                            </label>
                            <input
                              type="date"
                              value={editEnd}
                              min={editStart}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="w-full rounded border border-ink/18 bg-cream py-2.5 px-3 text-sm text-ink focus:border-wine focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => saveEdit(line.id)}
                            disabled={savingEdit}
                            className="bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
                          >
                            {savingEdit ? "Đang lưu..." : "Lưu"}
                          </button>
                        </div>
                      )}
                      {editingId === line.id && editError && (
                        <p className="text-xs font-medium text-destructive">{editError}</p>
                      )}
                    </article>
                  </Reveal>
                ))}
              </div>

              <Reveal className="mt-8 rounded bg-paper p-6 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                <div className="mb-4 flex items-start justify-between gap-4 text-xs text-ink-soft">
                  <span>
                    Địa chỉ nhận hàng (hồ sơ cá nhân):{" "}
                    <span className="font-semibold text-ink">
                      {coc.diaChiNhan || "Chưa cập nhật — vào hồ sơ cá nhân để thêm địa chỉ."}
                    </span>
                    <br />
                    Đối tác giao vận dự kiến (BRU-05): <span className="font-semibold text-ink">{TEN_DOI_TAC[coc.doiTac]}</span>
                  </span>
                  <Link href="/profile" className="shrink-0 font-semibold text-wine hover:underline">
                    Sửa
                  </Link>
                </div>

                <div className="flex items-center justify-between border-t border-ink/8 pt-4">
                  <span className="text-sm font-semibold uppercase tracking-wider text-ink-soft">
                    Tổng tiền thuê (BRU-02)
                  </span>
                  <span className="font-heading text-lg font-semibold text-ink">
                    {formatVND(coc.tongTienThue)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-ink-soft">
                    Tổng tiền cọc (BRU-01)
                  </span>
                  <span className="font-heading text-xl font-bold text-wine">
                    {formatVND(coc.tongTienCoc)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut || !coc.diaChiNhan}
                  className="mt-5 w-full bg-wine px-5 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
                >
                  {checkingOut ? "Đang xử lý..." : "Xác nhận đặt thuê"}
                </button>
                {!coc.diaChiNhan && (
                  <p className="mt-2 text-center text-xs text-destructive">
                    Cần có địa chỉ nhận hàng (hồ sơ cá nhân) trước khi đặt thuê.
                  </p>
                )}
                {checkoutError && (
                  <p className="mt-2 text-center text-xs font-medium text-destructive">{checkoutError}</p>
                )}
              </Reveal>

              <p className="mt-3 text-center text-xs text-ink-soft">
                Tiền thuê tính theo biểu giá lũy tiến giảm dần của BRU-02 (ngày 1 = 10% giá niêm yết, ngày 2-10 =
                7%/ngày, ngày 11+ = 5%/ngày, FR-CT-04). Tiền cọc = giá niêm yết mỗi sản phẩm + phí ship ước tính chiều
                giao (do {TEN_DOI_TAC[coc.doiTac]} báo giá theo khoảng cách, BRU-05) × 2, dự trù cho cả hai chiều giao
                vận bắt buộc (FR-CT-03). Bấm &quot;Xác nhận đặt thuê&quot; sẽ tạo đơn ở trạng thái chờ nhân viên xác
                nhận (FR-CT-05) — luồng thanh toán QR thật (UC-10) chưa được mô phỏng ở bước này.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
