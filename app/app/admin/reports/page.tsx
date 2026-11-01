"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatVND } from "@/lib/products";
import type {
  DonRow,
  HopRow,
  LoaiDon,
  MonthSummary,
  Paged,
  RangeSummary,
  RevenueLineRow,
  TrangThaiDon,
  TrangThaiHop,
} from "@/lib/admin/types";

/** UC-16 (FR-ADM-04, FR-ADM-05; BR-07, BR-13; SCR-05): báo cáo chi tiết — bản đầy đủ (tìm/lọc/phân trang từng
 * dòng) của 3 nhóm số liệu mà Dashboard (app/admin/page.tsx) chỉ tóm tắt bằng biểu đồ. Nối thẳng DB qua
 * /api/admin/reports/* (lib/admin/reports.ts) — tìm/lọc/phân trang chạy ở SQL. */

const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";

const DON_LABEL: Record<TrangThaiDon, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Active: "Đang thuê",
  Overdue: "Quá hạn",
  Completed: "Hoàn tất trả",
  Closed: "Đã đóng",
  Cancelled: "Đã huỷ",
};
const HOP_LABEL: Record<TrangThaiHop, string> = {
  Available: "Sẵn sàng",
  Reserved: "Đã đặt giữ",
  Rented: "Đang cho thuê",
  Checking: "Đang kiểm đếm",
  Damaged: "Hư hỏng",
  Sold: "Đã bán",
};
const DON_STATUSES = Object.keys(DON_LABEL) as TrangThaiDon[];
const HOP_STATUSES = Object.keys(HOP_LABEL) as TrangThaiHop[];
const DON_TONE: Record<TrangThaiDon, string> = {
  Pending: "text-ink-soft",
  Confirmed: "text-sky",
  Active: "text-forest",
  Overdue: "text-destructive",
  Completed: "text-gold",
  Closed: "text-ink-soft",
  Cancelled: "text-destructive",
};
const HOP_TONE: Record<TrangThaiHop, string> = {
  Available: "text-forest",
  Reserved: "text-gold",
  Rented: "text-sky",
  Checking: "text-amber",
  Damaged: "text-destructive",
  Sold: "text-ink-soft",
};

const ngayVN = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const thMonthFull = (m: string) => `Tháng ${Number(m.slice(5))}/${m.slice(0, 4)}`;

function Chip({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
        active ? "bg-wine text-paper" : "bg-cream text-ink-soft hover:text-ink"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-paper/20" : "bg-ink/10"}`}>{count}</span>
      )}
    </button>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-1 items-center gap-2 border-b border-ink/20 py-1.5 focus-within:border-wine">
      <Search className="h-4 w-4 shrink-0 text-ink-soft" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
      />
    </label>
  );
}

function Pager({ p, onPage, unit }: { p: Paged<unknown>; onPage: (n: number) => void; unit: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
      <span>
        {p.total} {unit}
      </span>
      <span className="flex items-center gap-1">
        <button type="button" disabled={p.page <= 1} onClick={() => onPage(p.page - 1)} aria-label="Trang trước" className="p-1.5 transition-colors hover:text-ink disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="tabular-nums">
          Trang {p.page}/{p.totalPages}
        </span>
        <button type="button" disabled={p.page >= p.totalPages} onClick={() => onPage(p.page + 1)} aria-label="Trang sau" className="p-1.5 transition-colors hover:text-ink disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

type Tab = "doanhthu" | "hop" | "don";

/** Mọi lời gọi API Admin đi qua đây: 401 (chưa đăng nhập nội bộ / phiên hết hạn) → về trang đăng nhập nội bộ. */
function useAdminApi() {
  const router = useRouter();
  return useCallback(
    async (url: string): Promise<Response | null> => {
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/staff/login");
        return null;
      }
      return res;
    },
    [router],
  );
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>("doanhthu");
  const api = useAdminApi();
  const [nQuaHan, setNQuaHan] = useState(0);
  const [nHong, setNHong] = useState(0);

  // Chỉ để hiện badge trên tab — tải 1 trang nhỏ mỗi loại là đủ (không cần tổng chính xác tuyệt đối ở đây).
  useEffect(() => {
    (async () => {
      const [donRes, hopRes] = await Promise.all([
        api("/api/admin/reports/orders?trangThai=Overdue&page=1"),
        api("/api/admin/reports/boxes?trangThai=Damaged&page=1"),
      ]);
      if (donRes?.ok) setNQuaHan((await donRes.json()).totalAll ?? 0);
      if (hopRes?.ok) setNHong((await hopRes.json()).totalAll ?? 0);
    })();
  }, [api]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "doanhthu", label: "Doanh thu theo tháng" },
    { key: "hop", label: "Tồn kho hộp game", badge: nHong },
    { key: "don", label: "Đơn theo trạng thái", badge: nQuaHan },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-ink">Báo cáo chi tiết (UC-16)</h1>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Đối chiếu từng giao dịch / hộp game / đơn hàng đứng sau các số liệu tổng hợp ở trang Tổng quan.
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-ink/12">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? "border-wine text-wine" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {!!t.badge && <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold tabular-nums text-paper">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "doanhthu" && <RevenueTab api={api} />}
      {tab === "hop" && <BoxesTab />}
      {tab === "don" && <OrdersTab />}
    </>
  );
}

type Api = ReturnType<typeof useAdminApi>;

function firstOfMonthIso(thang: string) {
  return `${thang}-01`;
}

// ================= Tab 1: Doanh thu theo tháng / khoảng ngày (FR-ADM-04) =================
function RevenueTab({ api }: { api: Api }) {
  // "Hôm nay"/"tháng này" chỉ có ý nghĩa ở trình duyệt của người xem — không đọc Date() lúc prerender (Next.js
  // Cache Components chặn giá trị không ổn định này), nên khởi tạo rỗng rồi set thật ở useEffect sau khi mount.
  const [mode, setMode] = useState<"thang" | "khoang">("thang");
  const [months, setMonths] = useState<MonthSummary[] | null>(null);
  const [month, setMonth] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [loai, setLoai] = useState<"" | LoaiDon>("");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [cur, setCur] = useState<RangeSummary | null>(null);
  const [list, setList] = useState<Paged<RevenueLineRow> | null>(null);

  useEffect(() => {
    (async () => {
      const d = new Date();
      const today = d.toISOString().slice(0, 10);
      const thisMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      setMonth(thisMonth);
      setTuNgay(firstOfMonthIso(thisMonth));
      setDenNgay(today);

      const res = await api(`/api/admin/reports/monthly?thang=${thisMonth}&soThang=12`);
      if (res?.ok) setMonths((await res.json()).months);
    })();
  }, [api]);

  const ready = month !== "" && tuNgay !== "" && denNgay !== "";
  const rangeInvalid = ready && mode === "khoang" && tuNgay > denNgay;
  const from = !ready ? "" : mode === "thang" ? firstOfMonthIso(month) : tuNgay;
  const to = !ready ? "" : mode === "thang" ? monthEnd(month) : denNgay;
  const EMPTY_SUMMARY: RangeSummary = { ban: { soDon: 0, doanhThu: 0 }, thue: { soDon: 0, doanhThu: 0 }, tong: 0, soDon: 0 };
  const EMPTY_PAGE: Paged<RevenueLineRow> = { items: [], total: 0, page: 1, totalPages: 1 };

  useEffect(() => {
    if (!ready || rangeInvalid) return;
    const controller = new AbortController();
    (async () => {
      const params = new URLSearchParams({ from, to, loai, q: qApplied, page: String(page) });
      const [sumRes, linesRes] = await Promise.all([
        fetch(`/api/admin/reports/summary?from=${from}&to=${to}`, { signal: controller.signal }),
        fetch(`/api/admin/reports/revenue?${params}`, { signal: controller.signal }),
      ]);
      if (sumRes.ok) setCur(await sumRes.json());
      if (linesRes.ok) setList(await linesRes.json());
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });
    return () => controller.abort();
  }, [from, to, loai, qApplied, page, rangeInvalid]);

  const onSearch = (v: string) => {
    setQ(v);
    setPage(1);
    setQApplied(v);
  };

  const title = !ready ? "Đang tải..." : mode === "thang" ? thMonthFull(month) : `${ngayVN(tuNgay)} – ${ngayVN(denNgay)}`;
  const maxTong = months ? Math.max(1, ...months.map((s) => s.tong)) : 1;
  const curDisplay = rangeInvalid ? EMPTY_SUMMARY : cur;
  const listDisplay = rangeInvalid ? EMPTY_PAGE : list;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section className={`${card} p-5`}>
        <div className="mb-4 flex gap-1 rounded-full bg-cream p-1">
          {([["thang", "Theo tháng"], ["khoang", "Khoảng ngày tuỳ chọn"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setMode(v);
                setPage(1);
              }}
              className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
                mode === v ? "bg-wine text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "thang" ? (
          <ul className="divide-y divide-cream">
            {months === null ? (
              <li className="py-10 text-center text-sm text-ink-soft">Đang tải...</li>
            ) : (
              months.map((s) => (
                <li key={s.thang}>
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(s.thang);
                      setPage(1);
                    }}
                    className={`grid h-[52px] w-full grid-cols-[minmax(0,1fr)_120px] items-center gap-3 px-2 text-left transition-colors ${month === s.thang ? "bg-cream" : "hover:bg-cream/60"}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{thMonthFull(s.thang)}</span>
                      <span className="mt-1 block h-1 rounded bg-ink/8">
                        <span className="block h-1 rounded bg-wine" style={{ width: `${(s.tong / maxTong) * 100}%` }} />
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-right text-sm tabular-nums text-ink">{formatVND(s.tong)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : (
          <div className="flex flex-col gap-3 px-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Từ ngày</span>
              <input
                type="date"
                value={tuNgay}
                onChange={(e) => {
                  setTuNgay(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded border border-ink/18 bg-cream px-3 py-2 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Đến ngày</span>
              <input
                type="date"
                value={denNgay}
                onChange={(e) => {
                  setDenNgay(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded border border-ink/18 bg-cream px-3 py-2 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </label>
            {/* Chiều cao cố định: cảnh báo không đẩy phần dưới. */}
            <p className="min-h-[16px] text-[11px] text-destructive">
              {rangeInvalid ? "Từ ngày phải trước hoặc bằng đến ngày." : ""}
            </p>
          </div>
        )}
      </section>

      <section className={`${card} p-6`}>
        <h2 className="mb-4 font-heading text-xl text-ink">{title}</h2>
        <dl className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded bg-cream p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Tổng doanh thu</dt>
            <dd className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-wine">{formatVND(curDisplay?.tong ?? 0)}</dd>
            <dd className="mt-0.5 text-[11px] text-ink-soft">{curDisplay?.soDon ?? 0} đơn</dd>
          </div>
          <div className="rounded bg-cream p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Doanh thu bán</dt>
            <dd className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-ink">{formatVND(curDisplay?.ban.doanhThu ?? 0)}</dd>
            <dd className="mt-0.5 text-[11px] text-ink-soft">{curDisplay?.ban.soDon ?? 0} đơn bán</dd>
          </div>
          <div className="rounded bg-cream p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Doanh thu thuê</dt>
            <dd className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-ink">{formatVND(curDisplay?.thue.doanhThu ?? 0)}</dd>
            <dd className="mt-0.5 text-[11px] text-ink-soft">{curDisplay?.thue.soDon ?? 0} đơn thuê</dd>
          </div>
        </dl>

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Giao dịch trong {mode === "thang" ? "tháng" : "khoảng ngày"} (đối chiếu với tổng)
        </h3>
        <div className="mb-3 flex items-center gap-3">
          <SearchBox value={q} onChange={onSearch} placeholder="Tìm mã đơn, khách, sản phẩm…" />
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {([["", "Tất cả", curDisplay?.soDon ?? 0], ["Ban", "Bán", curDisplay?.ban.soDon ?? 0], ["Thue", "Thuê", curDisplay?.thue.soDon ?? 0]] as const).map(([v, label, n]) => (
            <Chip
              key={v}
              active={loai === v}
              count={n}
              onClick={() => {
                setLoai(v);
                setPage(1);
              }}
            >
              {label}
            </Chip>
          ))}
        </div>

        <ul className="min-h-[520px] divide-y divide-cream">
          {listDisplay?.items.map((o, i) => (
            <li key={`${o.maDon}-${i}`} className="grid h-[52px] grid-cols-[84px_minmax(0,1fr)_96px_110px] items-center gap-3 px-2">
              <span className="whitespace-nowrap text-sm font-medium tabular-nums text-ink">{o.maDon}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{o.sanPham}</span>
                <span className="block truncate text-[11px] text-ink-soft">
                  {o.khach} · {o.loai === "Ban" ? "Bán" : "Thuê"}
                </span>
              </span>
              <span className="whitespace-nowrap text-xs tabular-nums text-ink-soft">{ngayVN(o.ngayTao)}</span>
              <span className="whitespace-nowrap text-right text-sm tabular-nums text-ink">{formatVND(o.tien)}</span>
            </li>
          ))}
          {listDisplay && listDisplay.items.length === 0 && <li className="py-10 text-center text-sm text-ink-soft">Không có giao dịch phù hợp.</li>}
        </ul>
        <Pager p={listDisplay ?? EMPTY_PAGE} onPage={setPage} unit="giao dịch" />
        <p className="mt-3 text-[11px] text-ink-soft">
          Doanh thu bán = tiền hàng của đơn bán; doanh thu thuê = tiền thuê của đơn thuê (không tính tiền cọc, phí ship và khoản hoàn). Tổng ở trên bằng tổng các dòng ở bảng này.
        </p>
      </section>
    </div>
  );
}

function monthEnd(thang: string): string {
  const [y, m] = thang.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

// ================= Tab 2: Tồn kho hộp game (FR-ADM-05) =================
function BoxesTab() {
  const router = useRouter();
  const [trangThai, setTrangThai] = useState<"" | TrangThaiHop>("");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<(Paged<HopRow> & { counts: Record<TrangThaiHop, number>; totalAll: number }) | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const params = new URLSearchParams({ trangThai, q: qApplied, page: String(page) });
      const res = await fetch(`/api/admin/reports/boxes?${params}`, { signal: controller.signal });
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (res.ok) setData(await res.json());
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });
    return () => controller.abort();
  }, [trangThai, qApplied, page, router]);

  const onSearch = (v: string) => {
    setQ(v);
    setPage(1);
    setQApplied(v);
  };

  return (
    <section className={`${card} p-6`}>
      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {HOP_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setTrangThai(trangThai === s ? "" : s);
              setPage(1);
            }}
            className={`rounded p-4 text-left transition-colors ${trangThai === s ? "bg-ink text-cream" : "bg-cream hover:bg-cream/60"}`}
          >
            <dt className={`text-[11px] font-semibold uppercase tracking-wider ${trangThai === s ? "text-cream/80" : "text-ink-soft"}`}>{HOP_LABEL[s]}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${trangThai === s ? "text-cream" : HOP_TONE[s]}`}>{data?.counts[s] ?? 0}</dd>
          </button>
        ))}
      </dl>

      <div className="mb-3 flex items-center gap-3">
        <SearchBox value={q} onChange={onSearch} placeholder="Tìm mã hộp hoặc tên sản phẩm…" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={trangThai === ""} count={data?.totalAll ?? 0} onClick={() => { setTrangThai(""); setPage(1); }}>
          Tất cả
        </Chip>
        {HOP_STATUSES.map((s) => (
          <Chip key={s} active={trangThai === s} count={data?.counts[s] ?? 0} onClick={() => { setTrangThai(s); setPage(1); }}>
            {HOP_LABEL[s]}
          </Chip>
        ))}
      </div>

      <ul className="min-h-[520px] divide-y divide-cream">
        {data?.items.map((b) => (
          <li key={b.maHop} className="grid h-[52px] grid-cols-[minmax(0,180px)_minmax(0,1fr)_130px] items-center gap-3 px-2">
            <span className="truncate text-sm font-medium tabular-nums text-ink">{b.maHop}</span>
            <span className="truncate text-sm text-ink">{b.sanPham}</span>
            <span className={`whitespace-nowrap text-right text-xs font-semibold ${HOP_TONE[b.trangThai]}`}>{HOP_LABEL[b.trangThai]}</span>
          </li>
        ))}
        {data && data.items.length === 0 && <li className="py-10 text-center text-sm text-ink-soft">Không có hộp game phù hợp.</li>}
      </ul>
      <Pager p={data ?? { items: [], total: 0, page: 1, totalPages: 1 }} onPage={setPage} unit="hộp game" />
    </section>
  );
}

// ================= Tab 3: Đơn theo trạng thái (FR-ADM-05) =================
function OrdersTab() {
  const router = useRouter();
  const [trangThai, setTrangThai] = useState<"" | TrangThaiDon>("");
  const [loai, setLoai] = useState<"" | LoaiDon>("");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<(Paged<DonRow> & { counts: Record<TrangThaiDon, number>; totalAll: number }) | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const params = new URLSearchParams({ trangThai, loai, q: qApplied, page: String(page) });
      const res = await fetch(`/api/admin/reports/orders?${params}`, { signal: controller.signal });
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (res.ok) setData(await res.json());
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });
    return () => controller.abort();
  }, [trangThai, loai, qApplied, page, router]);

  const onSearch = (v: string) => {
    setQ(v);
    setPage(1);
    setQApplied(v);
  };

  return (
    <section className={`${card} p-6`}>
      <div className="mb-3 flex items-center gap-3">
        <SearchBox value={q} onChange={onSearch} placeholder="Tìm mã đơn, khách, sản phẩm…" />
        <div className="flex gap-1.5">
          {([["", "Cả hai"], ["Thue", "Thuê"], ["Ban", "Bán"]] as const).map(([v, label]) => (
            <Chip key={v} active={loai === v} onClick={() => { setLoai(v); setPage(1); }}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={trangThai === ""} count={data?.totalAll ?? 0} onClick={() => { setTrangThai(""); setPage(1); }}>
          Tất cả
        </Chip>
        {DON_STATUSES.map((s) => (
          <Chip key={s} active={trangThai === s} count={data?.counts[s] ?? 0} onClick={() => { setTrangThai(s); setPage(1); }}>
            {DON_LABEL[s]}
          </Chip>
        ))}
      </div>

      <ul className="min-h-[520px] divide-y divide-cream">
        {data?.items.map((o) => (
          <li key={o.maDon} className="grid h-[52px] grid-cols-[84px_minmax(0,1fr)_96px_110px_110px] items-center gap-3 px-2">
            <span className="whitespace-nowrap text-sm font-medium tabular-nums text-ink">{o.maDon}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-ink">{o.sanPham}</span>
              <span className="block truncate text-[11px] text-ink-soft">
                {o.khach} · {o.loai === "Ban" ? "Bán" : "Thuê"}
              </span>
            </span>
            <span className="whitespace-nowrap text-xs tabular-nums text-ink-soft">{ngayVN(o.ngayTao)}</span>
            <span className={`whitespace-nowrap text-xs font-semibold ${DON_TONE[o.trangThai]}`}>{DON_LABEL[o.trangThai]}</span>
            <span className="whitespace-nowrap text-right text-sm tabular-nums text-ink">{formatVND(o.tien)}</span>
          </li>
        ))}
        {data && data.items.length === 0 && <li className="py-10 text-center text-sm text-ink-soft">Không có đơn phù hợp.</li>}
      </ul>
      <Pager p={data ?? { items: [], total: 0, page: 1, totalPages: 1 }} onPage={setPage} unit="đơn" />
      <p className="mt-3 text-[11px] text-ink-soft">Sắp xếp: đơn quá hạn và chờ xác nhận lên đầu, rồi đến đơn mới nhất.</p>
    </section>
  );
}
