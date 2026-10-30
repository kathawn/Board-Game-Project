"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, MapPin, PackageCheck, Search, Truck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatVND } from "@/lib/products";
import type { RentalOrder, RentalOrderPage, RentalStage } from "@/lib/rentals/order-store";
import { TEN_DOI_TAC, type TrangThaiVanChuyen } from "@/lib/shipping/types";

/** UC-05 (xác nhận cọc) + UC-06 (bàn giao cho giao vận) + theo dõi vận chuyển (UC-12) cho Staff. Mỗi giai đoạn là
 * một tab có số đếm; danh sách bên trái tìm kiếm / lọc / phân trang ở server (8 đơn/trang), chi tiết + nút thao tác
 * của đơn đang chọn nằm bên phải. Chưa có đăng nhập Staff riêng gắn vào trang này (UC-13 làm ở bước backend). */

const TABS: { key: RentalStage; label: string; hint: string }[] = [
  { key: "ChoXacNhan", label: "Chờ xác nhận", hint: "Đơn vừa thanh toán cọc, chờ Staff xác nhận đã thu cọc (UC-05)." },
  { key: "ChoBanGiao", label: "Chờ bàn giao", hint: "Đơn đã xác nhận, chờ bàn giao hộp game cho giao vận (UC-06)." },
  { key: "DangThue", label: "Đang thuê", hint: "Đơn đã bàn giao — theo dõi vận đơn hai chiều (UC-12). Đơn quá hạn xếp trước." },
];

const TRANG_THAI_VC: Record<TrangThaiVanChuyen, { label: string; className: string }> = {
  DangGiao: { label: "Đang giao", className: "bg-gold/15 text-gold" },
  DaGiao: { label: "Đã giao", className: "bg-forest/15 text-forest" },
  DangLay: { label: "Đang lấy", className: "bg-gold/15 text-gold" },
  DaLay: { label: "Đã lấy", className: "bg-forest/15 text-forest" },
};

const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const btnPrimary =
  "flex items-center justify-center gap-2 whitespace-nowrap bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60";

function summary(order: RentalOrder): string {
  const first = order.lines[0]?.productName ?? "";
  return order.lines.length > 1 ? `${first} +${order.lines.length - 1} sản phẩm` : first;
}

export default function StaffRentalOrdersPage() {
  const [stage, setStage] = useState<RentalStage>("ChoXacNhan");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RentalOrderPage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ q: qApplied, stage, page: String(page) });
    const response = await fetch(`/api/staff/rental-orders?${params}`);
    const result: RentalOrderPage = await response.json();
    setData(result);
    // Giữ đơn đang chọn nếu còn trong trang; không thì chọn đơn đầu tiên (đơn cần xử lý trước).
    setSelectedId((cur) => (cur && result.orders.some((o) => o.id === cur) ? cur : (result.orders[0]?.id ?? null)));
  }, [qApplied, stage, page]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const onSearch = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQApplied(v.trim());
      setPage(1);
    }, 300);
  };

  const act = async (order: RentalOrder, action: "confirm" | "handover") => {
    const key = `${action}:${order.id}`;
    setError((p) => ({ ...p, [order.id]: "" }));
    setBusy(key);
    try {
      const response = await fetch(`/api/staff/rental-orders/${order.id}/${action}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setError((p) => ({ ...p, [order.id]: result.error ?? "Đã có lỗi xảy ra." }));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const selected = data?.orders.find((o) => o.id === selectedId) ?? null;
  const tab = TABS.find((t) => t.key === stage)!;

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-6">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Nội bộ — Nhân viên
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">Đơn thuê</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">{tab.hint}</p>
          </div>

          {/* Tab theo giai đoạn, có số đếm. */}
          <div className="mb-5 flex flex-wrap gap-1 border-b border-ink/12">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setStage(t.key);
                  setPage(1);
                  setSelectedId(null);
                }}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  stage === t.key ? "border-wine text-wine" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${
                    stage === t.key ? "bg-wine text-paper" : "bg-ink/10"
                  }`}
                >
                  {data ? data.counts[t.key] : "–"}
                </span>
              </button>
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
            {/* ===== DANH SÁCH ===== */}
            <section className={`${card} p-5`}>
              <label className="mb-3 flex items-center gap-2 border-b border-ink/20 py-1.5 focus-within:border-wine">
                <Search className="h-4 w-4 shrink-0 text-ink-soft" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Tìm mã đơn, email khách, tên game…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
                />
              </label>

              {/* Chiều cao cố định cho 8 dòng để đổi tab / trang không làm trang nhảy. */}
              <ul className="min-h-[512px] divide-y divide-cream">
                {data?.orders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className={`grid h-16 w-full grid-cols-[minmax(0,1fr)_92px] items-center gap-3 px-2 text-left transition-colors ${
                        selectedId === o.id ? "bg-cream" : "hover:bg-cream/60"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{o.id}</span>
                          {o.trangThai === "Overdue" && (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                              Quá hạn
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-ink-soft">{o.email}</span>
                        <span className="block truncate text-[11px] text-ink-soft">{summary(o)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block whitespace-nowrap text-sm tabular-nums text-ink">
                          {formatVND(o.tongTienCoc)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-ink-soft">tiền cọc</span>
                      </span>
                    </button>
                  </li>
                ))}
                {data && data.orders.length === 0 && (
                  <li className="py-16 text-center text-sm text-ink-soft">
                    {qApplied ? "Không có đơn nào khớp từ khoá." : "Không có đơn nào ở giai đoạn này."}
                  </li>
                )}
              </ul>

              {data && (
                <div className="flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
                  <span>{data.total} đơn</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={data.page <= 1}
                      onClick={() => setPage(data.page - 1)}
                      aria-label="Trang trước"
                      className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="tabular-nums">
                      Trang {data.page}/{data.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setPage(data.page + 1)}
                      aria-label="Trang sau"
                      className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              )}
            </section>

            {/* ===== CHI TIẾT ===== */}
            <section className={`${card} p-6 lg:sticky lg:top-24`}>
              {!selected ? (
                <p className="py-24 text-center text-sm text-ink-soft">Chọn một đơn ở danh sách để xem chi tiết.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-xl text-ink">{selected.id}</h2>
                      <p className="mt-1 text-xs text-ink-soft">
                        {selected.email} · tạo ngày {selected.ngayTao}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wider text-ink-soft">Tổng cọc</p>
                      <p className="font-heading text-xl font-bold tabular-nums text-wine">
                        {formatVND(selected.tongTienCoc)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="hidden grid-cols-[minmax(0,1fr)_170px_96px_96px] gap-3 border-b border-cream pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft md:grid">
                      <span>Sản phẩm</span>
                      <span>Thời gian thuê</span>
                      <span className="text-right">Tiền thuê</span>
                      <span className="text-right">Tiền cọc</span>
                    </div>
                    <ul className="divide-y divide-cream">
                      {selected.lines.map((l) => (
                        <li
                          key={`${selected.id}-${l.productSlug}`}
                          className="grid gap-x-3 gap-y-1 py-2.5 text-sm md:grid-cols-[minmax(0,1fr)_170px_96px_96px]"
                        >
                          <span className="min-w-0 truncate text-ink">{l.productName}</span>
                          <span className="whitespace-nowrap text-xs text-ink-soft">
                            {l.startDate} → {l.endDate}
                          </span>
                          <span className="whitespace-nowrap text-right text-xs tabular-nums text-ink-soft">
                            {formatVND(l.tienThue)}
                          </span>
                          <span className="whitespace-nowrap text-right text-xs tabular-nums text-ink-soft">
                            {formatVND(l.tienCoc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Giao tới {selected.diaChiNhan} — đối tác{" "}
                      <span className="font-semibold text-ink">{TEN_DOI_TAC[selected.doiTac]}</span>
                    </span>
                  </p>

                  {stage === "DangThue" && (
                    <div className="mt-5 border-t border-cream pt-4">
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Vận đơn
                      </h3>
                      {selected.shipments.length === 0 ? (
                        <p className="text-xs text-ink-soft">Chưa có vận đơn.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {selected.shipments.map((sh) => (
                            <li key={sh.maVanDon} className="flex items-center justify-between gap-3 text-xs text-ink-soft">
                              <span className="min-w-0 truncate">
                                {sh.chieu === "Nhan" ? "Chiều giao" : "Chiều lấy trả"} · {TEN_DOI_TAC[sh.doiTac]} ·{" "}
                                {sh.maVanDon} · {formatVND(sh.phiShip)}
                              </span>
                              <span
                                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${TRANG_THAI_VC[sh.trangThai].className}`}
                              >
                                {TRANG_THAI_VC[sh.trangThai].label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Hàng thao tác: chiều cao cố định, lỗi nằm bên trái nên không đẩy nút. */}
                  <div className="mt-5 flex min-h-[44px] items-center justify-between gap-4 border-t border-cream pt-4">
                    <p className="flex min-h-[1rem] items-center gap-1.5 text-xs font-medium text-destructive">
                      {error[selected.id] && (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {error[selected.id]}
                        </>
                      )}
                    </p>
                    {selected.trangThai === "Pending" && (
                      <button
                        type="button"
                        onClick={() => act(selected, "confirm")}
                        disabled={busy === `confirm:${selected.id}`}
                        className={btnPrimary}
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        {busy === `confirm:${selected.id}` ? "Đang xác nhận..." : "Xác nhận đã thu cọc"}
                      </button>
                    )}
                    {selected.trangThai === "Confirmed" && (
                      <button
                        type="button"
                        onClick={() => act(selected, "handover")}
                        disabled={busy === `handover:${selected.id}`}
                        className={btnPrimary}
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {busy === `handover:${selected.id}` ? "Đang bàn giao..." : "Bàn giao cho giao vận"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
