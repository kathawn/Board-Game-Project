"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { CheckBox, Chip, Pager, SearchBox, SelectAllBar } from "@/components/ListControls";
import { useSelection } from "@/components/cart/useSelection";
import { useCartList } from "@/components/cart/useCartList";
import { useCart } from "@/lib/cart/CartContext";
import { formatVND } from "@/lib/products";

interface PurchaseLine {
  sanPhamId: string;
  ten: string;
  anh: string | null;
  danhMuc: string;
  soLuong: number;
  soLuongTon: number;
  donGia: number;
  thanhTien: number;
  trangThai: "ok" | "vuot" | "het" | "ngung";
  chon: boolean;
}
interface PurchaseList {
  lines: PurchaseLine[];
  total: number;
  page: number;
  totalPages: number;
  soChonKhop: number;
  counts: { all: number; canxuly: number };
  tong: {
    soDong: number;
    soDongChon: number;
    soLuongChon: number;
    tienHangChon: number;
    phiShip: number;
    tongThanhToan: number;
    coDongChonCanXuLy: boolean;
  };
  giaoNhan: { diaChiNhan: string; doiTac: "GreenSM" | "ShopeeExpress" };
}

const TEN_DOI_TAC = { GreenSM: "Green SM", ShopeeExpress: "Shopee Express" } as const;
const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";

/** FR-BH-08/09 (UC-03): giỏ mua. Danh sách gọn một dòng/sản phẩm, tìm kiếm +
 * lọc + phân trang phía server; tổng tiền luôn tính trên toàn giỏ. */
export function PurchaseCartTab({ onUnauthorized, onCount }: { onUnauthorized: () => void; onCount: (n: number) => void }) {
  const router = useRouter();
  const { updateQuantity, removeItem } = useCart();
  const list = useCartList<PurchaseList>("/api/cart/list", onUnauthorized);
  const { data, reload } = list;
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const selection = useSelection("mua", list, reload);
  const [checkingOut, setCheckingOut] = useState(false);

  // UC-03 bước 5 → UC-10: sinh QR thanh toán cho các dòng đã chọn; đơn chỉ được tạo khi webhook thành công về.
  const checkout = async () => {
    setMessage(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/cart/checkout", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        await reload(); // tồn kho có thể vừa đổi → cập nhật trạng thái dòng
        return;
      }
      router.push(`/pay/${body.paymentId}`);
    } finally {
      setCheckingOut(false);
    }
  };

  const diaChi = data?.giaoNhan.diaChiNhan ?? "";
  const thieuDiaChi = data !== null && !diaChi;

  const tongDong = data?.counts.all;
  useEffect(() => {
    if (tongDong !== undefined) onCount(tongDong);
  }, [tongDong, onCount]);

  const change = async (line: PurchaseLine, soLuong: number) => {
    setMessage(null);
    setBusyId(line.sanPhamId);
    const result = await updateQuantity(line.sanPhamId, soLuong);
    if (!result.ok) setMessage(result.error);
    await reload();
    setBusyId(null);
  };

  const remove = async (line: PurchaseLine) => {
    setMessage(null);
    setBusyId(line.sanPhamId);
    await removeItem(line.sanPhamId);
    await reload();
    setBusyId(null);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className={`${card} flex min-w-0 flex-col gap-3 p-4 sm:p-5`}>
        <SearchBox value={list.q} onChange={list.setQ} placeholder="Tìm sản phẩm trong giỏ mua..." />
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
            Cần xử lý
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
              "Không có sản phẩm nào khớp bộ lọc."
            ) : (
              <>
                Giỏ mua đang trống.{" "}
                <Link href="/products" className="font-semibold text-wine hover:underline">
                  Xem danh sách sản phẩm
                </Link>
              </>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-cream">
            {data.lines.map((line) => (
              <li
                key={line.sanPhamId}
                className="grid grid-cols-[16px_48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[16px_48px_minmax(0,1fr)_112px_104px_32px] sm:gap-x-4"
              >
                <CheckBox
                  checked={line.chon}
                  disabled={selection.busy}
                  onChange={(next) => selection.toggle(line.sanPhamId, next)}
                  label={`Chọn ${line.ten} để mua`}
                />

                <div className={`relative h-12 w-12 overflow-hidden rounded bg-cream ${line.chon ? "" : "opacity-50"}`}>
                  {line.anh && <Image src={line.anh} alt={line.ten} fill className="object-cover" sizes="48px" />}
                </div>

                <div className="min-w-0">
                  <Link href={`/products/${line.sanPhamId}`} className="block truncate text-sm font-semibold text-ink hover:text-wine">
                    {line.ten}
                  </Link>
                  <p className="truncate text-xs text-ink-soft">
                    {formatVND(line.donGia)} · còn {line.soLuongTon}
                  </p>
                  {line.trangThai !== "ok" && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {line.trangThai === "ngung"
                        ? "Sản phẩm không còn kinh doanh — hãy xoá"
                        : line.trangThai === "het"
                          ? "Đã hết hàng — hãy xoá"
                          : `Vượt tồn kho — bấm “−” để về tối đa ${line.soLuongTon}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-self-end rounded border border-ink/25 sm:justify-self-auto">
                  <button
                    type="button"
                    disabled={(line.soLuong <= 1 && line.trangThai !== "vuot") || line.trangThai === "het" || line.trangThai === "ngung" || busyId === line.sanPhamId}
                    onClick={() => change(line, line.trangThai === "vuot" ? line.soLuongTon : line.soLuong - 1)}
                    aria-label={`Giảm số lượng ${line.ten}`}
                    className="flex h-8 w-8 items-center justify-center hover:bg-ink/5 disabled:text-ink-soft/50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.soLuong}</span>
                  <button
                    type="button"
                    disabled={line.soLuong >= line.soLuongTon || busyId === line.sanPhamId}
                    onClick={() => change(line, line.soLuong + 1)}
                    aria-label={`Tăng số lượng ${line.ten}`}
                    className="flex h-8 w-8 items-center justify-center hover:bg-ink/5 disabled:text-ink-soft/50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <p className={`col-start-3 whitespace-nowrap font-heading text-sm font-bold tabular-nums sm:col-start-auto sm:text-right ${line.chon ? "" : "text-ink-soft line-through"}`}>
                  {formatVND(line.thanhTien)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(line)}
                  disabled={busyId === line.sanPhamId}
                  aria-label={`Xoá ${line.ten} khỏi giỏ`}
                  className="flex h-8 w-8 items-center justify-center justify-self-end text-ink-soft hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {data && data.total > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={list.setPage} />}
      </section>

      <aside className={`${card} flex flex-col gap-3 p-5 lg:sticky lg:top-28`}>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">Tóm tắt giỏ mua</h2>
        <div className="flex items-start justify-between gap-3 text-xs text-ink-soft">
          <span className="min-w-0">
            Nhận hàng: <span className="font-semibold text-ink">{diaChi || "Chưa cập nhật địa chỉ"}</span>
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
          <div className="flex justify-between">
            <dt className="text-ink-soft">Số lượng đã chọn</dt>
            <dd className="tabular-nums">{data?.tong.soLuongChon ?? 0}</dd>
          </div>
          <div className="flex justify-between border-t border-cream pt-3">
            <dt className="text-ink-soft">Tiền hàng</dt>
            <dd className="font-semibold tabular-nums" data-testid="tong-tien-gio">
              {formatVND(data?.tong.tienHangChon ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Phí ship (1 chiều)</dt>
            <dd className="tabular-nums">{formatVND(data?.tong.phiShip ?? 0)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-cream pt-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Tổng thanh toán</dt>
            <dd className="font-heading text-xl font-bold tabular-nums text-wine">
              {formatVND(data?.tong.tongThanhToan ?? 0)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={checkout}
          disabled={checkingOut || thieuDiaChi || !data || data.tong.soDongChon === 0 || data.tong.coDongChonCanXuLy}
          className="w-full bg-wine px-5 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
        >
          {checkingOut ? "Đang xử lý..." : "Thanh toán qua mã QR"}
        </button>
        {/* Vùng thông báo cố định chiều cao — lỗi hiện ra không đẩy nút. */}
        <p className="min-h-[2.5rem] text-xs leading-relaxed text-destructive" role="status">
          {message ??
            (thieuDiaChi
              ? "Cần có địa chỉ nhận hàng (hồ sơ cá nhân) trước khi đặt mua."
              : data && data.tong.soDongChon === 0
                ? "Chưa chọn sản phẩm nào — tích chọn các sản phẩm muốn mua lần này."
                : data?.tong.coDongChonCanXuLy
                  ? "Trong các dòng đã chọn có sản phẩm vượt tồn kho/hết hàng/ngừng kinh doanh — sửa hoặc bỏ chọn."
                  : "")}
        </p>
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Chỉ các dòng đã chọn được thanh toán; dòng chưa chọn ở lại trong giỏ. Đơn mua chỉ được tạo (và hộp game
          chuyển sang Sold) sau khi thanh toán QR thành công; nếu có khách khác thanh toán trước và hết hàng, phần đó
          được hoàn vào Ví điện tử nội bộ (BRU-07).
        </p>
      </aside>
    </div>
  );
}
