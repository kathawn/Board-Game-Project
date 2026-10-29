"use client";

import { useEffect, useState } from "react";
import { CalendarDays, PackageCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { formatVND } from "@/lib/products";
import type { RentalOrder } from "@/lib/rentals/order-store";

const TEN_DOI_TAC: Record<RentalOrder["doiTac"], string> = {
  GreenSM: "Green SM",
  ShopeeExpress: "Shopee Express",
};

/** FR-CT-05 (UC-05): màn hình nội bộ cho nhân viên xem đơn thuê mới và xác
 * nhận đã thu cọc. Chưa có đăng nhập Staff riêng (FR-ADM-01/UC-13) trong
 * code — theo phạm vi MVP đã thống nhất, trang này tạm mở trực tiếp dưới
 * /staff, không qua cổng đăng nhập nội bộ. */
export default function StaffRentalOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [errorByOrder, setErrorByOrder] = useState<Record<string, string>>({});

  const reload = async () => {
    const response = await fetch("/api/staff/rental-orders");
    const data = await response.json();
    setOrders(data.orders);
  };

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, []);

  const handleConfirm = async (id: string) => {
    setErrorByOrder((prev) => ({ ...prev, [id]: "" }));
    setConfirmingId(id);
    try {
      const response = await fetch(`/api/staff/rental-orders/${id}/confirm`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setErrorByOrder((prev) => ({ ...prev, [id]: data.error ?? "Đã có lỗi xảy ra." }));
        return;
      }

      await reload();
    } finally {
      setConfirmingId(null);
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

  const pending = orders.filter((o) => o.trangThai === "Pending");
  const confirmed = orders.filter((o) => o.trangThai === "Confirmed");

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[960px]">
          <Reveal className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Nội bộ — Nhân viên
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">
              Xác nhận đơn thuê (UC-05)
            </h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Xác nhận đã thu cọc cho đơn ở trạng thái &quot;Chờ xác nhận&quot; để chuyển sang &quot;Đã xác nhận&quot;.
            </p>
          </Reveal>

          <section className="mb-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Chờ xác nhận ({pending.length})
            </h2>

            {pending.length === 0 ? (
              <Reveal className="rounded bg-paper p-8 text-center text-sm text-ink-soft">
                Không có đơn thuê nào đang chờ xác nhận.
              </Reveal>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((order, i) => (
                  <Reveal key={order.id} delay={i * 60}>
                    <article className="rounded bg-paper p-5 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-heading text-sm font-semibold text-ink">{order.id}</h3>
                              <span className="text-[11px] uppercase tracking-wider text-ink-soft">
                                {order.email} · ngày tạo {order.ngayTao}
                              </span>
                            </div>
                            <ul className="mt-2 flex flex-col gap-1">
                              {order.lines.map((line) => (
                                <li key={`${order.id}-${line.productSlug}`} className="text-xs text-ink-soft">
                                  {line.productName} · {line.startDate} → {line.endDate} · thuê{" "}
                                  {formatVND(line.tienThue)} · cọc {formatVND(line.tienCoc)}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2 text-xs text-ink-soft">
                              Giao hàng: {order.diaChiNhan} — đối tác giao vận dự kiến{" "}
                              <span className="font-semibold text-ink">{TEN_DOI_TAC[order.doiTac]}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                          <div className="text-right">
                            <p className="text-[11px] uppercase tracking-wider text-ink-soft">Tổng cọc</p>
                            <p className="font-heading text-lg font-bold text-wine">
                              {formatVND(order.tongTienCoc)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConfirm(order.id)}
                            disabled={confirmingId === order.id}
                            className="flex items-center gap-2 whitespace-nowrap bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            {confirmingId === order.id ? "Đang xác nhận..." : "Xác nhận đơn thuê"}
                          </button>
                        </div>
                      </div>
                      {errorByOrder[order.id] && (
                        <p className="mt-3 text-xs font-medium text-destructive">{errorByOrder[order.id]}</p>
                      )}
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Đã xác nhận ({confirmed.length})
            </h2>

            {confirmed.length === 0 ? (
              <Reveal className="rounded bg-paper p-8 text-center text-sm text-ink-soft">
                Chưa có đơn thuê nào được xác nhận.
              </Reveal>
            ) : (
              <div className="flex flex-col gap-3">
                {confirmed.map((order, i) => (
                  <Reveal key={order.id} delay={i * 60}>
                    <article className="flex items-center justify-between rounded bg-paper p-4 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                      <span className="text-sm font-semibold text-ink">
                        {order.id} <span className="text-ink-soft">· {order.email}</span>
                      </span>
                      <span className="rounded-full bg-sky/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky">
                        Đã xác nhận
                      </span>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
