"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin, Truck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Pager, SearchBox } from "@/components/ListControls";
import { formatVND } from "@/lib/products";
import { staffFetch } from "@/lib/auth/staff-client";
import type { SaleOrderPage, SaleStage } from "@/lib/orders/sale-orders";
import { TEN_DOI_TAC, type TrangThaiVanChuyen } from "@/lib/shipping/types";

/** UC-03 (đơn mua) cho Staff: giao đơn mua đã thanh toán cho đối tác giao vận (MỘT chiều giao, FR-TTGV-02..03) và
 * theo dõi vận đơn. Cùng bố cục với /staff/rental-orders: tab theo giai đoạn có số đếm; danh sách bên trái tìm kiếm /
 * phân trang ở server (8 đơn/trang); chi tiết + nút thao tác của đơn đang chọn bên phải. Chưa có đăng nhập Staff riêng
 * gắn vào trang này (UC-13). */

const TABS: { key: SaleStage; label: string; hint: string }[] = [
  { key: "ChoGiao", label: "Chờ giao", hint: "Đơn mua đã thanh toán, chờ Staff giao cho đối tác giao vận (một chiều giao)." },
  { key: "DangGiao", label: "Đang giao", hint: "Đã có vận đơn — đơn hoàn tất khi đối tác báo đã giao tới khách (UC-12)." },
  { key: "DaGiao", label: "Đã giao", hint: "Đơn mua đã giao xong (Hoàn tất)." },
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

export default function StaffSaleOrdersPage() {
  const [stage, setStage] = useState<SaleStage>("ChoGiao");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SaleOrderPage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ q: qApplied, stage, page: String(page) });
    const response = await staffFetch(`/api/staff/sale-orders?${params}`);
    const result: SaleOrderPage = await response.json();
    setData(result);
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

  const handover = async (id: string) => {
    setError((p) => ({ ...p, [id]: "" }));
    setBusy(id);
    try {
      const response = await staffFetch(`/api/staff/sale-orders/${id}/handover`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setError((p) => ({ ...p, [id]: result.error ?? "Đã có lỗi xảy ra." }));
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
            <h1 className="font-heading text-3xl font-semibold text-ink">Đơn mua</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">{tab.hint}</p>
          </div>

          <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b border-ink/12">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={stage === t.key}
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
            <section className={`${card} flex flex-col gap-3 p-5`}>
              <SearchBox value={q} onChange={onSearch} placeholder="Tìm mã đơn, email khách, tên game…" />

              {/* Chiều cao cố định cho 8 dòng để đổi tab / trang không làm trang nhảy. */}
              <ul className="min-h-[512px] divide-y divide-cream">
                {data?.orders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className={`grid h-16 w-full grid-cols-[minmax(0,1fr)_100px] items-center gap-3 px-2 text-left transition-colors ${
                        selectedId === o.id ? "bg-cream" : "hover:bg-cream/60"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{o.id}</span>
                        <span className="block truncate text-[11px] text-ink-soft">{o.email}</span>
                        <span className="block truncate text-[11px] text-ink-soft">
                          {o.lines[0]?.productName}
                          {o.lines.length > 1 ? ` +${o.lines.length - 1} sản phẩm` : ""}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block whitespace-nowrap text-sm tabular-nums text-ink">
                          {formatVND(o.tongTienHang)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-ink-soft">tiền hàng</span>
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

              {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
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
                      <p className="text-[11px] uppercase tracking-wider text-ink-soft">Tiền hàng</p>
                      <p className="font-heading text-xl font-bold tabular-nums text-wine">
                        {formatVND(selected.tongTienHang)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="hidden grid-cols-[minmax(0,1fr)_56px_110px] gap-3 border-b border-cream pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft md:grid">
                      <span>Sản phẩm / hộp đã bán</span>
                      <span className="text-right">SL</span>
                      <span className="text-right">Thành tiền</span>
                    </div>
                    <ul className="divide-y divide-cream">
                      {selected.lines.map((l) => (
                        <li
                          key={`${selected.id}-${l.productName}`}
                          className="grid gap-x-3 gap-y-1 py-2.5 text-sm md:grid-cols-[minmax(0,1fr)_56px_110px]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-ink">{l.productName}</span>
                            {l.maHop && <span className="block truncate text-[11px] text-ink-soft">Hộp: {l.maHop}</span>}
                          </span>
                          <span className="whitespace-nowrap text-right text-xs tabular-nums text-ink-soft">{l.soLuong}</span>
                          <span className="whitespace-nowrap text-right text-xs tabular-nums text-ink-soft">
                            {formatVND(l.thanhTien)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Giao tới {selected.diaChiNhan}</span>
                  </p>

                  {selected.shipments.length > 0 && (
                    <div className="mt-5 border-t border-cream pt-4">
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Vận đơn</h3>
                      <ul className="flex flex-col gap-2">
                        {selected.shipments.map((sh) => (
                          <li key={sh.maVanDon} className="flex items-center justify-between gap-3 text-xs text-ink-soft">
                            <span className="min-w-0 truncate">
                              {TEN_DOI_TAC[sh.doiTac]} · {sh.maVanDon} · {formatVND(sh.phiShip)}
                            </span>
                            <span
                              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${TRANG_THAI_VC[sh.trangThai].className}`}
                            >
                              {TRANG_THAI_VC[sh.trangThai].label}
                            </span>
                          </li>
                        ))}
                      </ul>
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
                    {selected.stage === "ChoGiao" && (
                      <button
                        type="button"
                        onClick={() => handover(selected.id)}
                        disabled={busy === selected.id}
                        className={btnPrimary}
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {busy === selected.id ? "Đang tạo vận đơn..." : "Giao cho vận chuyển"}
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
