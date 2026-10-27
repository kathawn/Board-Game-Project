"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, CalendarRange, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { getProductBySlug, formatVND, giaThueNgayDau } from "@/lib/products";
import type { RentalCartLine } from "@/lib/rentals/store";

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

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/rental-cart");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      setLines(data.lines);
      setLoading(false);
    })();
  }, [router]);

  const handleRemove = async (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/rental-cart/${id}`, { method: "DELETE" });
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
    .map((line) => ({ line, product: getProductBySlug(line.productSlug) }))
    .filter((row): row is { line: RentalCartLine; product: NonNullable<ReturnType<typeof getProductBySlug>> } =>
      Boolean(row.product),
    );

  const tongTienThue = rows.reduce(
    (sum, { line, product }) => sum + giaThueNgayDau(product.giaNiemYet) * soNgay(line.startDate, line.endDate),
    0,
  );

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
              Giỏ thuê đang trống.{" "}
              <Link href="/products" className="font-semibold text-wine hover:underline">
                Xem sản phẩm cho thuê
              </Link>
            </Reveal>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {rows.map(({ line, product }, i) => (
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
                            {formatVND(giaThueNgayDau(product.giaNiemYet) * soNgay(line.startDate, line.endDate))}
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

              <Reveal className="mt-8 flex items-center justify-between rounded bg-paper p-6 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
                <span className="text-sm font-semibold uppercase tracking-wider text-ink-soft">
                  Tạm tính tiền thuê
                </span>
                <span className="font-heading text-xl font-bold text-ink">
                  {formatVND(tongTienThue)}
                </span>
              </Reveal>

              <p className="mt-3 text-center text-xs text-ink-soft">
                Tiền cọc (BRU-01) và phí giao vận sẽ hiển thị ở bước xác nhận đặt thuê — chưa nằm trong phạm vi FR-CT-01.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
