"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, CalendarDays, Search, Truck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { formatVND } from "@/lib/products";
import type { DonHang, LoaiDon, TrangThaiDon } from "@/lib/orders/store";
import { TEN_DOI_TAC, type TrangThaiVanChuyen } from "@/lib/shipping/types";

const TRANG_THAI_LABEL: Record<TrangThaiDon, { label: string; className: string }> = {
  Pending: { label: "Chờ thanh toán", className: "bg-ink/10 text-ink-soft" },
  Confirmed: { label: "Đã xác nhận", className: "bg-sky/15 text-sky" },
  Active: { label: "Đang thuê", className: "bg-gold/15 text-gold" },
  Overdue: { label: "Quá hạn trả", className: "bg-destructive/15 text-destructive" },
  Completed: { label: "Hoàn tất", className: "bg-forest/15 text-forest" },
  Closed: { label: "Đã đóng", className: "bg-forest/15 text-forest" },
};

/** FR-CT-05: đơn thuê chỉ được tạo sau khi webhook thanh toán cọc thành công
 * (UC-10/FR-TTGV-07) — nên Pending ở đây nghĩa là "đã thanh toán, đang chờ
 * Staff xác nhận" (khớp đúng chữ dùng ở /staff/rental-orders), không phải
 * "chờ thanh toán" như đơn mua demo cũ (ví dụ DH-00302) — nên nhãn Pending
 * phải khác nhau theo loại đơn. */
function trangThaiLabel(order: DonHang): { label: string; className: string } {
  if (order.trangThai === "Pending" && order.loai === "Thue") {
    return { label: "Chờ xác nhận", className: "bg-ink/10 text-ink-soft" };
  }
  // Đơn mua dùng chung vòng đời: Confirmed (đã thanh toán) → có vận đơn thì "Đang giao" → Completed là "Đã giao".
  if (order.loai === "Ban") {
    if (order.trangThai === "Completed") return { label: "Đã giao", className: "bg-forest/15 text-forest" };
    if (order.trangThai === "Confirmed" && order.shipments && order.shipments.length > 0) {
      return { label: "Đang giao", className: "bg-gold/15 text-gold" };
    }
    if (order.trangThai === "Confirmed") return { label: "Đã thanh toán — chờ giao", className: "bg-sky/15 text-sky" };
  }
  return TRANG_THAI_LABEL[order.trangThai];
}

const TRANG_THAI_VC: Record<TrangThaiVanChuyen, { label: string; className: string }> = {
  DangGiao: { label: "Đang giao", className: "bg-gold/15 text-gold" },
  DaGiao: { label: "Đã giao", className: "bg-forest/15 text-forest" },
  DangLay: { label: "Đang lấy", className: "bg-gold/15 text-gold" },
  DaLay: { label: "Đã lấy", className: "bg-forest/15 text-forest" },
};

type Loc = "all" | LoaiDon;

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState<Loc>("all");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  // UC-11: địa chỉ lấy hàng trả đang nhập cho từng đơn (mặc định = địa chỉ nhận, FR-TTGV-01).
  const [diaChiTra, setDiaChiTra] = useState<Record<string, string>>({});
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [errorByOrder, setErrorByOrder] = useState<Record<string, string>>({});

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      const params = new URLSearchParams();
      if (loc !== "all") params.set("loai", loc);
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/orders?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      setOrders(data.orders);
      setLoading(false);
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });

    return () => controller.abort();
  }, [router, loc, query, reloadKey]);

  const handleYeuCauLay = async (order: DonHang) => {
    setErrorByOrder((prev) => ({ ...prev, [order.id]: "" }));
    setPickingId(order.id);
    try {
      const response = await fetch(`/api/rentals/${order.id}/return-request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ diaChiTra: diaChiTra[order.id] ?? order.diaChiNhan ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorByOrder((prev) => ({ ...prev, [order.id]: data.error ?? "Đã có lỗi xảy ra." }));
        return;
      }
      setReloadKey((k) => k + 1);
    } finally {
      setPickingId(null);
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
              Lịch sử đơn
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">
              Đơn mua &amp; đơn thuê của bạn
            </h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Toàn bộ đơn mua và đơn thuê gắn với tài khoản đang đăng nhập.
            </p>
          </Reveal>

          <Reveal className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="relative w-full sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên sản phẩm hoặc mã đơn..."
                className="w-full rounded border border-ink/18 bg-cream py-3 pl-10 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </div>

            <div className="flex rounded border border-ink/18 bg-paper p-1">
              {([
                ["all", "Tất cả"],
                ["Ban", "Đơn mua"],
                ["Thue", "Đơn thuê"],
              ] as [Loc, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLoc(value)}
                  className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    loc === value ? "bg-wine text-paper" : "text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Reveal>

          {orders.length === 0 ? (
            <Reveal className="rounded bg-paper p-12 text-center text-sm text-ink-soft">
              {query.trim()
                ? "Không tìm thấy đơn nào khớp từ khoá."
                : "Bạn chưa có đơn nào ở mục này."}
            </Reveal>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order, i) => {
                const status = trangThaiLabel(order);
                return (
                  <Reveal key={order.id} delay={i * 60}>
                    <article className="rounded bg-paper p-5 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft">
                          {order.loai === "Ban" ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <CalendarDays className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-heading text-sm font-semibold text-ink">
                              {order.sanPham}
                            </h3>
                            <span className="text-[11px] uppercase tracking-wider text-ink-soft">
                              {order.loai === "Ban" ? "Đơn mua" : "Đơn thuê"} · {order.id}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-ink-soft">{order.chiTiet}</p>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            Ngày tạo: {order.ngayTao}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="font-heading text-sm font-bold text-ink">
                          {formatVND(order.tongTien)}
                        </span>
                      </div>
                      </div>

                      {order.shipments && order.shipments.length > 0 && (
                        <ul className="mt-4 flex flex-col gap-1.5 border-t border-ink/10 pt-3">
                          {order.shipments.map((sh) => (
                            <li key={sh.maVanDon} className="flex items-center justify-between gap-3 text-xs text-ink-soft">
                              <span className="flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5" />
                                {sh.chieu === "Nhan" ? "Giao hàng" : "Lấy hàng trả"} · {TEN_DOI_TAC[sh.doiTac]} · {sh.maVanDon}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${TRANG_THAI_VC[sh.trangThai].className}`}
                              >
                                {TRANG_THAI_VC[sh.trangThai].label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {(order.trangThai === "Active" || order.trangThai === "Overdue") &&
                        order.loai === "Thue" &&
                        !order.shipments?.some((sh) => sh.chieu === "Tra") &&
                        !order.shipments?.some((sh) => sh.chieu === "Nhan" && sh.trangThai === "DaGiao") && (
                          <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-ink-soft">
                            Bạn có thể yêu cầu lấy hàng trả sau khi hàng được giao tới.
                          </p>
                        )}

                      {(order.trangThai === "Active" || order.trangThai === "Overdue") &&
                        order.loai === "Thue" &&
                        !order.shipments?.some((sh) => sh.chieu === "Tra") &&
                        order.shipments?.some((sh) => sh.chieu === "Nhan" && sh.trangThai === "DaGiao") && (
                          <div className="mt-4 flex flex-col gap-2 border-t border-ink/10 pt-3">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                              Địa chỉ lấy hàng trả (mặc định = địa chỉ nhận)
                            </label>
                            <input
                              value={diaChiTra[order.id] ?? order.diaChiNhan ?? ""}
                              onChange={(e) => setDiaChiTra((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="w-full rounded border border-ink/18 bg-cream px-4 py-2.5 text-sm text-ink focus:border-wine focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleYeuCauLay(order)}
                              disabled={pickingId === order.id}
                              className="self-start bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
                            >
                              {pickingId === order.id ? "Đang gửi yêu cầu..." : "Yêu cầu giao vận đến lấy hàng"}
                            </button>
                            {errorByOrder[order.id] && (
                              <p className="text-xs font-medium text-destructive">{errorByOrder[order.id]}</p>
                            )}
                          </div>
                        )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
