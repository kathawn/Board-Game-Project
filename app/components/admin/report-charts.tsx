"use client";

import { useState } from "react";
import { formatVND } from "@/lib/products";
import { CHART, ChartTooltip, fmtCompact } from "./charts";

/** Biểu đồ cho tab "Biểu đồ phân tích" của Báo cáo chi tiết (UC-16) — SVG thuần, cùng quy ước với charts.tsx:
 * hit-target lớn hơn mark, tooltip khi hover/focus, nhãn trực tiếp + legend để không dựa vào màu đơn độc.
 * Bốn dạng khác nhau: đường (xu hướng), vành khuyên (cơ cấu), cột ngang (xếp hạng), cột dọc (số lượng theo nhóm). */

/** Màu phân loại theo thứ tự cố định (không xoay vòng); mục thứ 5 trở đi gộp vào "Khác" màu trung tính. */
export const CATEGORICAL = [CHART.ban, CHART.thue, CHART.tonKho, CHART.canhBao];
export const OTHER_COLOR = "#8a8378";

// ============== 1. Biểu đồ đường: doanh thu Bán vs Thuê theo tháng ==============
export function RevenueLineChart({ data }: { data: { label: string; ban: number; thue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const height = 260;
  const padL = 52;
  const padB = 28;
  const padT = 14;
  const padR = 16;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.ban, d.thue)));
  const step = maxVal >= 100_000_000 ? 50_000_000 : maxVal >= 10_000_000 ? 5_000_000 : 1_000_000;
  const niceMax = Math.ceil(maxVal / step) * step || maxVal;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const xOf = (i: number) => padL + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yOf = (v: number) => padT + plotH - (v / niceMax) * plotH;
  const path = (key: "ban" | "thue") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}`).join(" ");
  const labelEvery = Math.ceil(data.length / 12);
  const hitW = Math.max(20, plotW / Math.max(1, data.length));

  return (
    <div>
      <div className="mb-3 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-ink">
          <span className="h-[3px] w-4 rounded" style={{ background: CHART.ban }} /> Bán
        </span>
        <span className="flex items-center gap-1.5 text-ink">
          <span className="h-[3px] w-4 rounded" style={{ background: CHART.thue }} /> Thuê
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label="Biểu đồ đường doanh thu bán và thuê theo tháng">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={yOf(t)} y2={yOf(t)} stroke="var(--e-ink)" strokeOpacity={0.08} />
            <text x={padL - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle" className="fill-ink-soft" fontSize={10}>
              {fmtCompact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.label} x={xOf(i)} y={height - padB + 16} textAnchor="middle" className="fill-ink-soft" fontSize={10}>
              {d.label}
            </text>
          ) : null,
        )}
        {hover !== null && (
          <line x1={xOf(hover)} x2={xOf(hover)} y1={padT} y2={padT + plotH} stroke="var(--e-ink)" strokeOpacity={0.25} strokeDasharray="3 3" />
        )}
        <path d={path("ban")} fill="none" stroke={CHART.ban} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={path("thue")} fill="none" stroke={CHART.thue} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.label}>
            {/* vòng surface 2px quanh điểm để không dính vào đường */}
            <circle cx={xOf(i)} cy={yOf(d.ban)} r={hover === i ? 5 : 3.5} fill={CHART.ban} stroke="var(--e-paper)" strokeWidth={2} />
            <circle cx={xOf(i)} cy={yOf(d.thue)} r={hover === i ? 5 : 3.5} fill={CHART.thue} stroke="var(--e-paper)" strokeWidth={2} />
            <rect
              x={xOf(i) - hitW / 2}
              y={padT}
              width={hitW}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${d.label}: Bán ${formatVND(d.ban)}, Thuê ${formatVND(d.thue)}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((h) => (h === i ? null : h))}
            />
          </g>
        ))}
        {hover !== null && (
          <ChartTooltip
            x={xOf(hover)}
            y={padT + 44}
            width={width}
            title={data[hover].label}
            rows={[
              { key: "ban", label: "Bán", value: formatVND(data[hover].ban), color: CHART.ban },
              { key: "thue", label: "Thuê", value: formatVND(data[hover].thue), color: CHART.thue },
            ]}
          />
        )}
      </svg>
    </div>
  );
}

// ============== 2. Biểu đồ vành khuyên: cơ cấu theo danh mục ==============
export function DonutChart({ rows, centerLabel }: { rows: { ten: string; value: number }[]; centerLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  // Tối đa 4 mục có màu riêng, phần còn lại gộp "Khác" (không sinh thêm màu).
  const top = rows.slice(0, CATEGORICAL.length);
  const rest = rows.slice(CATEGORICAL.length).reduce((s, r) => s + r.value, 0);
  const segs = [
    ...top.map((r, i) => ({ ...r, color: CATEGORICAL[i] })),
    ...(rest > 0 ? [{ ten: "Khác", value: rest, color: OTHER_COLOR }] : []),
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);
  const size = 200;
  const r = 78;
  const sw = 28;
  const c = 2 * Math.PI * r;

  if (total <= 0) return <p className="py-10 text-center text-sm text-ink-soft">Chưa có doanh thu trong khoảng này.</p>;

  const offsets = segs.map((_, i) => segs.slice(0, i).reduce((s, x) => s + (x.value / total) * c, 0));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[200px] w-[200px] shrink-0" role="img" aria-label="Biểu đồ vành khuyên cơ cấu doanh thu theo danh mục">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segs.map((s, i) => {
            const len = (s.value / total) * c;
            const drawn = Math.max(0, len - (segs.length > 1 ? 2 : 0)); // khe surface giữa các phần
            return (
              <circle
                key={s.ten}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? sw + 4 : sw}
                strokeDasharray={`${drawn} ${c - drawn}`}
                strokeDashoffset={-offsets[i]}
                tabIndex={0}
                aria-label={`${s.ten}: ${formatVND(s.value)} (${((s.value / total) * 100).toFixed(0)}%)`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((h) => (h === i ? null : h))}
              />
            );
          })}
        </g>
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-ink-soft" fontSize={10}>
          {hover !== null ? segs[hover].ten : centerLabel}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-ink" fontSize={16} fontWeight={600}>
          {fmtCompact(hover !== null ? segs[hover].value : total)}
        </text>
      </svg>
      <ul className="min-w-[180px] flex-1 space-y-2 text-xs">
        {segs.map((s, i) => (
          <li
            key={s.ten}
            className={`flex items-center gap-2 rounded px-1.5 py-1 ${hover === i ? "bg-cream" : ""}`}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover((h) => (h === i ? null : h))}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-ink">{s.ten}</span>
            <span className="tabular-nums text-ink-soft">{((s.value / total) * 100).toFixed(0)}%</span>
            <span className="w-24 text-right tabular-nums text-ink">{formatVND(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============== 3. Biểu đồ cột ngang: xếp hạng (top sản phẩm) ==============
export function HorizontalBarChart({ rows, color }: { rows: { ten: string; value: number }[]; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-ink-soft">Chưa có doanh thu trong khoảng này.</p>;
  return (
    <ol className="space-y-2" aria-label="Biểu đồ cột ngang xếp hạng sản phẩm theo doanh thu">
      {rows.map((r, i) => (
        <li
          key={r.ten}
          tabIndex={0}
          className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_96px] items-center gap-3 text-xs outline-none"
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover((h) => (h === i ? null : h))}
          onFocus={() => setHover(i)}
          onBlur={() => setHover((h) => (h === i ? null : h))}
        >
          <span className="truncate text-ink" title={r.ten}>
            {r.ten}
          </span>
          <span className="h-4 rounded-r bg-ink/6">
            <span
              className="block h-4 rounded-r transition-opacity"
              style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: color, opacity: hover === null || hover === i ? 1 : 0.55 }}
            />
          </span>
          <span className="text-right tabular-nums text-ink">{formatVND(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}

// ============== 4. Biểu đồ cột dọc: số lượng theo nhóm (đơn theo trạng thái) ==============
export function CountColumnChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const height = 220;
  const padB = 40;
  const padT = 22;
  const plotH = height - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.value));
  const groupW = width / data.length;
  const barW = Math.min(44, groupW * 0.5);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label="Biểu đồ cột số đơn theo trạng thái">
      <line x1={0} x2={width} y1={padT + plotH} y2={padT + plotH} stroke="var(--e-ink)" strokeOpacity={0.15} />
      {data.map((d, i) => {
        const h = (d.value / max) * plotH;
        const cx = i * groupW + groupW / 2;
        return (
          <g key={d.label}>
            <rect
              x={i * groupW}
              y={0}
              width={groupW}
              height={height}
              fill="var(--e-ink)"
              opacity={hover === i ? 0.05 : 0}
              tabIndex={0}
              role="button"
              aria-label={`${d.label}: ${d.value} đơn`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((v) => (v === i ? null : v))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((v) => (v === i ? null : v))}
            />
            {d.value > 0 && <rect x={cx - barW / 2} y={padT + plotH - h} width={barW} height={h} rx={4} fill={color} />}
            <text x={cx} y={padT + plotH - h - 6} textAnchor="middle" className="fill-ink" fontSize={11} fontWeight={600}>
              {d.value}
            </text>
            <text x={cx} y={height - padB + 16} textAnchor="middle" className="fill-ink-soft" fontSize={10}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
