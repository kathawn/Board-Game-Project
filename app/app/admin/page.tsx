"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Package, ShoppingCart, Tag } from "lucide-react";
import { formatVND } from "@/lib/products";
import { RevenueBarChart, StackedStatusBar, CHART } from "@/components/admin/charts";
import type { DonRow, HopRow, MonthSummary, TrangThaiHop } from "@/lib/admin/types";

/** Trang chủ khu vực Admin (UC-16, FR-ADM-04/05 + lối vào UC-15): "một chỗ, mọi công cụ" — Admin đăng nhập một
 * lần ở /staff/login rồi mọi thứ (tổng quan, biểu đồ, sản phẩm & giá, báo cáo chi tiết) nằm trong cùng khu vực
 * /admin/**, điều hướng qua sidebar dùng chung (app/admin/layout.tsx). Trang này tóm tắt bằng số + biểu đồ,
 * nối thẳng DB qua /api/admin/reports/* (lib/admin/reports.ts); muốn đối chiếu từng dòng giao dịch/hộp/đơn
 * thì sang "Báo cáo chi tiết" (đã có list/search/filter/pagination). */

const HOP_LABEL: Record<TrangThaiHop, string> = {
  Available: "Sẵn sàng",
  Reserved: "Đã đặt giữ",
  Rented: "Đang cho thuê",
  Checking: "Đang kiểm đếm",
  Damaged: "Hư hỏng",
  Sold: "Đã bán",
};
const HOP_STATUSES = Object.keys(HOP_LABEL) as TrangThaiHop[];
const HOP_TONE: Record<TrangThaiHop, string> = {
  Available: CHART.tonKho,
  Reserved: CHART.canhBao,
  Rented: CHART.thue,
  Checking: CHART.canhBao,
  Damaged: "#b23b3b",
  Sold: "#8a8378",
};
const thMonth = (m: string) => `Th ${Number(m.slice(5))}/${m.slice(2, 4)}`;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [months, setMonths] = useState<MonthSummary[] | null>(null);
  const [boxCounts, setBoxCounts] = useState<Record<TrangThaiHop, number> | null>(null);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [ordersCanXuLy, setOrdersCanXuLy] = useState<DonRow[] | null>(null);
  const [nQuaHan, setNQuaHan] = useState(0);
  const [nChoXacNhan, setNChoXacNhan] = useState(0);

  useEffect(() => {
    const d = new Date();
    const thisMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

    (async () => {
      const [monthlyRes, boxesRes, overdueRes, pendingRes] = await Promise.all([
        fetch(`/api/admin/reports/monthly?thang=${thisMonth}&soThang=6`),
        fetch(`/api/admin/reports/boxes?page=1`),
        fetch(`/api/admin/reports/orders?trangThai=Overdue&page=1`),
        fetch(`/api/admin/reports/orders?trangThai=Pending&page=1`),
      ]);
      if (monthlyRes.status === 401 || boxesRes.status === 401 || overdueRes.status === 401 || pendingRes.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (monthlyRes.ok) setMonths((await monthlyRes.json()).months);
      if (boxesRes.ok) {
        const data = await boxesRes.json();
        setBoxCounts(data.counts);
        setTotalBoxes(data.totalAll);
      }
      if (overdueRes.ok && pendingRes.ok) {
        const overdue: { items: DonRow[]; counts: Record<string, number> } = await overdueRes.json();
        const pending: { items: DonRow[] } = await pendingRes.json();
        setOrdersCanXuLy([...overdue.items, ...pending.items].slice(0, 6));
        setNQuaHan(overdue.counts.Overdue ?? 0);
        setNChoXacNhan(overdue.counts.Pending ?? 0);
      }
    })();
  }, [router]);

  // Tháng mới nhất trước trong dữ liệu trả về (API trả cũ → mới theo yêu cầu `thang`..lùi về trước); đảo lại để
  // biểu đồ đọc theo chiều thời gian tự nhiên (cũ → mới).
  const revenueData = months
    ? [...months].reverse().map((s) => ({ month: s.thang, label: thMonth(s.thang), ban: s.ban.doanhThu, thue: s.thue.doanhThu }))
    : [];
  const cur = months?.[0];
  const prev = months?.[1];
  const deltaPct = cur && prev && prev.tong > 0 ? Math.round(((cur.tong - prev.tong) / prev.tong) * 100) : 0;

  const boxSegments = HOP_STATUSES.map((s) => ({ key: s, label: HOP_LABEL[s], value: boxCounts?.[s] ?? 0, color: HOP_TONE[s] }));
  const nHong = boxCounts?.Damaged ?? 0;
  const nCheck = boxCounts?.Checking ?? 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-ink">Tổng quan</h1>
        <p className="mt-2 text-sm font-light text-ink-soft">Doanh thu, tồn kho và việc cần xử lý — cập nhật theo thời gian thực từ dữ liệu giao dịch.</p>
      </div>

      {/* ===== KPI tiles ===== */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label={cur ? `Doanh thu ${thMonth(cur.thang)}` : "Doanh thu tháng này"}
          value={formatVND(cur?.tong ?? 0)}
          delta={cur && prev ? deltaPct : undefined}
          deltaLabel={prev ? `so với ${thMonth(prev.thang)}` : undefined}
        />
        <KpiTile label="Đơn chờ xác nhận" value={String(nChoXacNhan)} tone={nChoXacNhan > 0 ? "warn" : undefined} href="/admin/reports" />
        <KpiTile label="Đơn quá hạn trả" value={String(nQuaHan)} tone={nQuaHan > 0 ? "critical" : undefined} href="/admin/reports" />
        <KpiTile label="Hộp hư hỏng / đang kiểm" value={`${nHong} / ${nCheck}`} tone={nHong > 0 ? "warn" : undefined} href="/admin/reports" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* ===== Biểu đồ doanh thu ===== */}
          <section className={CARD}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-heading text-lg text-ink">Doanh thu bán / thuê — 6 tháng gần nhất</h2>
              <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-semibold text-wine hover:underline">
                Xem chi tiết <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mb-5 text-xs text-ink-soft">Doanh thu bán = tiền hàng; doanh thu thuê = tiền thuê (không gồm cọc, ship, hoàn).</p>
            {months === null ? <p className="py-10 text-center text-sm text-ink-soft">Đang tải...</p> : <RevenueBarChart data={revenueData} />}
          </section>

          {/* ===== Tồn kho hộp game ===== */}
          <section className={CARD}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-heading text-lg text-ink">Tồn kho hộp game theo trạng thái</h2>
              <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-semibold text-wine hover:underline">
                Xem chi tiết <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mb-5 text-xs text-ink-soft">{totalBoxes} hộp trên toàn bộ danh mục.</p>
            {boxCounts === null ? <p className="py-10 text-center text-sm text-ink-soft">Đang tải...</p> : <StackedStatusBar segments={boxSegments} />}
          </section>
        </div>

        {/* ===== Cột phải: việc cần xử lý + lối tắt ===== */}
        <div className="space-y-6">
          <section className={CARD}>
            <h2 className="mb-1 flex items-center gap-2 font-heading text-lg text-ink">
              <Clock className="h-4 w-4 text-wine" /> Cần xử lý trước
            </h2>
            <p className="mb-4 text-xs text-ink-soft">Đơn quá hạn và chờ xác nhận, mới nhất trước.</p>
            <ul className="divide-y divide-cream">
              {ordersCanXuLy === null ? (
                <li className="py-6 text-center text-xs text-ink-soft">Đang tải...</li>
              ) : (
                ordersCanXuLy.map((o) => (
                  <li key={o.maDon} className="flex items-center gap-3 py-2.5 text-sm">
                    {o.trangThai === "Overdue" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0 text-gold" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ink">{o.sanPham}</span>
                      <span className="block truncate text-[11px] text-ink-soft">{o.maDon} · {o.khach}</span>
                    </span>
                    <span className={`whitespace-nowrap text-[11px] font-semibold ${o.trangThai === "Overdue" ? "text-destructive" : "text-gold"}`}>
                      {o.trangThai === "Overdue" ? "Quá hạn" : "Chờ xác nhận"}
                    </span>
                  </li>
                ))
              )}
              {ordersCanXuLy !== null && ordersCanXuLy.length === 0 && <li className="py-6 text-center text-xs text-ink-soft">Không có đơn cần xử lý ngay.</li>}
            </ul>
            <Link href="/admin/reports" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-wine hover:underline">
              Xem toàn bộ đơn <ArrowRight className="h-3 w-3" />
            </Link>
          </section>

          <section className={CARD}>
            <h2 className="mb-4 font-heading text-lg text-ink">Công cụ quản trị</h2>
            <div className="space-y-2">
              <ToolLink href="/admin/products" icon={Package} label="Sản phẩm & giá" desc="Thêm / sửa / xoá, cập nhật giá niêm yết" />
              <ToolLink href="/admin/categories" icon={Tag} label="Danh mục" desc="Đổi tên / gộp danh mục sản phẩm" />
              <ToolLink href="/admin/reports" icon={ShoppingCart} label="Báo cáo chi tiết" desc="Tra từng giao dịch, hộp game, đơn hàng" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const CARD = "rounded bg-paper p-6 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";

function KpiTile({
  label,
  value,
  delta,
  deltaLabel,
  tone,
  href,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  tone?: "warn" | "critical";
  href?: string;
}) {
  const content = (
    <div className={`${CARD} h-full p-5`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className={`mt-1.5 whitespace-nowrap text-2xl font-semibold tabular-nums ${tone === "critical" ? "text-destructive" : tone === "warn" ? "text-gold" : "text-ink"}`}>
        {value}
      </p>
      {delta !== undefined && (
        <p className={`mt-1 text-[11px] font-medium ${delta >= 0 ? "text-forest" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}
          {delta}% <span className="text-ink-soft">{deltaLabel}</span>
        </p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      {content}
    </Link>
  ) : (
    content
  );
}

function ToolLink({ href, icon: Icon, label, desc }: { href: string; icon: typeof Package; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded border border-ink/10 p-3 transition-colors hover:border-wine/40 hover:bg-cream/60">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-wine/10 text-wine">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block truncate text-[11px] text-ink-soft">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
    </Link>
  );
}
