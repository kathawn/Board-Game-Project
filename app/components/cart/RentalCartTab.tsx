"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, AlertTriangle } from "lucide-react";
import { CheckBox, Chip, Pager, SearchBox, SelectAllBar } from "@/components/ListControls";
import { useSelection } from "@/components/cart/useSelection";
import { useCartList } from "@/components/cart/useCartList";
import { homNayVN } from "@/lib/cart/paginate";
import { useCart } from "@/lib/cart/CartContext";
import { formatVND } from "@/lib/products";

interface RentalLine {
  id: string;
  productSlug: string;
  ten: string;
  anh: string | null;
  danhMuc: string;
  startDate: string;
  endDate: string;
  soNgay: number;
  tienThue: number;
  tienCoc: number;
  canXuLy: "quahan" | "trunglich" | "ngung" | null;
  chon: boolean;
}
interface RentalList {
  lines: RentalLine[];
  total: number;
  page: number;
  totalPages: number;
  soChonKhop: number;
  counts: { all: number; canxuly: number };
  tong: {
    soDong: number;
    soDongChon: number;
    tienThueChon: number;
    tienCocChon: number;
    coDongChonCanXuLy: boolean;
  };
  giaoNhan: { diaChiNhan: string; doiTac: "GreenSM" | "ShopeeExpress" };
}

const TEN_DOI_TAC = { GreenSM: "Green SM", ShopeeExpress: "Shopee Express" } as const;
const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";

/** FR-CT-01/09 (UC-04): giỏ thuê. Mỗi dòng tự chọn ngày thuê riêng; sửa ngày
 * ngay trên dòng (ô sửa chiếm chỗ cố định bên dưới dòng, không đẩy các cột). */
export function RentalCartTab({ onUnauthorized, onCount }: { onUnauthorized: () => void; onCount: (n: number) => void }) {
  const router = useRouter();
  const { setRentalCount } = useCart();
  const list = useCartList<RentalList>("/api/rental-cart/list", onUnauthorized);
  const { data, reload } = list;
  const selection = useSelection("thue", list, reload);

  const today = homNayVN(); // giờ VN
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const tongDong = data?.counts.all;
  useEffect(() => {
    if (tongDong === undefined) return;
    onCount(tongDong);
    setRentalCount(tongDong);
  }, [tongDong, onCount, setRentalCount]);

  const startEdit = (line: RentalLine) => {
    setEditingId(line.id);
    setEditStart(line.startDate);
    setEditEnd(line.endDate);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    setEditError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/rental-cart/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startDate: editStart, endDate: editEnd }),
      });
      const body = await response.json();
      if (!response.ok) {
        setEditError(body.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      setEditingId(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/rental-cart/${id}`, { method: "DELETE" });
    if (editingId === id) setEditingId(null);
    await reload();
  };

  const checkout = async () => {
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/rental-cart/checkout", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setCheckoutError(body.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      // UC-10: sang trang thanh toán QR; đơn thuê chỉ được tạo khi webhook thành công về.
      router.push(`/pay/${body.paymentId}`);
    } finally {
      setCheckingOut(false);
    }
  };

  const diaChi = data?.giaoNhan.diaChiNhan ?? "";
  const thieuDiaChi = data !== null && !diaChi;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className={`${card} flex min-w-0 flex-col gap-3 p-4 sm:p-5`}>
        <SearchBox value={list.q} onChange={list.setQ} placeholder="Tìm sản phẩm trong giỏ thuê..." />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={list.filter === "all"} count={data?.counts.all} onClick={() => list.setFilter("all")}>
            Tất cả
          </Chip>
          <Chip
            active={list.filter === "canxuly"}
            count={data?.counts.canxuly}
            tone="warn"
            onClick={() => list.setFilter("canxuly")}
          >
            Cần sửa ngày
          </Chip>
        </div>

        {data && data.counts.all > 0 && (
          <SelectAllBar
            total={data.total}
            selectedMatching={data.soChonKhop}
            selectedAll={data.tong.soDongChon}
            totalAll={data.counts.all}
            busy={selection.busy}
            onToggle={selection.toggleMatching}
          />
        )}

        {!data || data.lines.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-soft">
            {list.loading ? "Đang tải..." : list.qApplied || list.filter !== "all" ? (
              "Không có dòng nào khớp bộ lọc."
            ) : (
              <>
                Giỏ thuê đang trống.{" "}
                <Link href="/products" className="font-semibold text-wine hover:underline">
                  Xem sản phẩm cho thuê
                </Link>
              </>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-cream">
            {data.lines.map((line) => (
              <li key={line.id} className="py-3">
                <div className="grid grid-cols-[16px_48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[16px_48px_minmax(0,1fr)_112px_96px_32px] sm:gap-x-4">
                  <CheckBox
                    checked={line.chon}
                    disabled={selection.busy}
                    onChange={(next) => selection.toggle(line.id, next)}
                    label={`Chọn ${line.ten} để thuê`}
                  />

                  <div className={`relative h-12 w-12 overflow-hidden rounded bg-cream ${line.chon ? "" : "opacity-50"}`}>
                    {line.anh && <Image src={line.anh} alt={line.ten} fill className="object-cover" sizes="48px" />}
                  </div>

                  <div className="min-w-0">
                    <Link href={`/products/${line.productSlug}`} className="block truncate text-sm font-semibold text-ink hover:text-wine">
                      {line.ten}
                    </Link>
                    <p className="truncate text-xs tabular-nums text-ink-soft">
                      {line.startDate} → {line.endDate} · {line.soNgay} ngày
                    </p>
                    {line.canXuLy && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {line.canXuLy === "quahan" && "Ngày bắt đầu đã qua — hãy sửa ngày"}
                        {line.canXuLy === "trunglich" && "Trùng đơn thuê khác — hãy đổi ngày"}
                        {line.canXuLy === "ngung" && "Sản phẩm không còn kinh doanh — hãy xoá"}
                      </p>
                    )}
                  </div>

                  <p className={`justify-self-end whitespace-nowrap font-heading text-sm font-bold tabular-nums sm:text-right ${line.chon ? "" : "text-ink-soft line-through"}`}>
                    {formatVND(line.tienThue)}
                  </p>

                  <button
                    type="button"
                    onClick={() => (editingId === line.id ? setEditingId(null) : startEdit(line))}
                    aria-label={`Sửa ngày thuê ${line.ten}`}
                    className="col-start-3 flex items-center gap-1.5 justify-self-start whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-wine sm:col-start-auto sm:justify-self-end"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {editingId === line.id ? "Huỷ sửa" : "Sửa ngày"}
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    aria-label={`Xoá ${line.ten} khỏi giỏ thuê`}
                    className="flex h-8 w-8 items-center justify-center justify-self-end text-ink-soft hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {editingId === line.id && (
                  <div className="mt-3 flex flex-col gap-3 bg-cream/60 p-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Ngày bắt đầu
                      <input
                        type="date"
                        value={editStart}
                        min={today}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="mt-1 w-full rounded border border-ink/18 bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink focus:border-wine focus:outline-none"
                      />
                    </label>
                    <label className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Ngày kết thúc
                      <input
                        type="date"
                        value={editEnd}
                        min={editStart > today ? editStart : today}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="mt-1 w-full rounded border border-ink/18 bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink focus:border-wine focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveEdit(line.id)}
                      disabled={saving}
                      className="whitespace-nowrap bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-wine-deep disabled:opacity-60"
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                    {editError && <p className="text-xs font-medium text-destructive sm:basis-full">{editError}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {data && data.total > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={list.setPage} />}
      </section>

      <aside className={`${card} flex flex-col gap-3 p-5 lg:sticky lg:top-28`}>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">Tóm tắt giỏ thuê</h2>

        <div className="flex items-start justify-between gap-3 text-xs text-ink-soft">
          <span className="min-w-0">
            Nhận hàng:{" "}
            <span className="font-semibold text-ink">{diaChi || "Chưa cập nhật địa chỉ"}</span>
            {data && (
              <>
                <br />
                Giao vận (BRU-05): <span className="font-semibold text-ink">{TEN_DOI_TAC[data.giaoNhan.doiTac]}</span>
              </>
            )}
          </span>
          <Link href="/profile" className="shrink-0 font-semibold text-wine hover:underline">
            Sửa
          </Link>
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Sản phẩm đã chọn</dt>
            <dd className="tabular-nums">
              {data?.tong.soDongChon ?? 0}/{data?.tong.soDong ?? 0}
            </dd>
          </div>
          <div className="flex justify-between border-t border-cream pt-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Tiền thuê (BRU-02)</dt>
            <dd className="font-heading font-semibold tabular-nums">{formatVND(data?.tong.tienThueChon ?? 0)}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Tiền cọc (BRU-01)</dt>
            <dd className="font-heading text-xl font-bold tabular-nums text-wine">{formatVND(data?.tong.tienCocChon ?? 0)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={checkout}
          disabled={checkingOut || thieuDiaChi || !data || data.tong.soDongChon === 0 || data.tong.coDongChonCanXuLy}
          className="w-full bg-wine px-5 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
        >
          {checkingOut ? "Đang xử lý..." : "Thanh toán cọc qua mã QR"}
        </button>
        <p className="min-h-[2.5rem] text-xs leading-relaxed text-destructive" role="status">
          {checkoutError ??
            (thieuDiaChi
              ? "Cần có địa chỉ nhận hàng (hồ sơ cá nhân) trước khi đặt thuê."
              : data && data.tong.soDongChon === 0
                ? "Chưa chọn dòng nào — tích chọn các sản phẩm muốn thuê lần này."
                : data?.tong.coDongChonCanXuLy
                  ? "Trong các dòng đã chọn có dòng đã quá ngày, trùng lịch hoặc ngừng kinh doanh — sửa hoặc bỏ chọn trước khi thanh toán."
                  : "")}
        </p>
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Tiền thuê tính theo biểu giá lũy tiến giảm dần (ngày 1 = 10%, ngày 2-10 = 7%/ngày, ngày 11+ = 5%/ngày giá niêm
          yết). Cọc = giá niêm yết + phí ship ước tính × 2 cho mỗi sản phẩm. Chỉ các dòng đã chọn được thanh toán; dòng
          chưa chọn ở lại trong giỏ. Đơn thuê chỉ được tạo sau khi thanh toán QR thành công.
        </p>
      </aside>
    </div>
  );
}
