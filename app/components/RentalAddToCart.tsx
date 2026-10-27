"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, CheckCircle2 } from "lucide-react";

/** FR-CT-01 (UC-04, BR-01): khách chọn ngày bắt đầu/kết thúc riêng cho sản
 * phẩm đang xem rồi thêm vào giỏ thuê của tài khoản đang đăng nhập. */

export function RentalAddToCart({ productSlug }: { productSlug: string }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    setError(null);
    setAdded(false);

    if (!startDate || !endDate) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (endDate <= startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/rental-cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug, startDate, endDate }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      setAdded(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => {
              setStartDate(e.target.value);
              setAdded(false);
            }}
            className="w-full rounded border border-ink/18 bg-cream py-3 px-3.5 text-sm text-ink focus:border-wine focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Ngày kết thúc
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setAdded(false);
            }}
            className="w-full rounded border border-ink/18 bg-cream py-3 px-3.5 text-sm text-ink focus:border-wine focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mb-4 text-xs font-medium text-destructive">{error}</p>}
      {added && (
        <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-forest">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Đã thêm vào giỏ thuê — bạn có thể chọn thêm sản phẩm khác, hoặc bấm biểu tượng giỏ ở trên để xem.
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting}
          className="flex-1 bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:bg-wine-deep disabled:opacity-60"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <CalendarRange className="h-4 w-4" />
            {submitting ? "Đang thêm..." : "Thêm vào giỏ thuê"}
          </span>
        </button>
      </div>
    </div>
  );
}
