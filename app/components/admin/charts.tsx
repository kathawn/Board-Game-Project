"use client";

import { useState } from "react";
import { formatVND } from "@/lib/products";

/** MOCKUP — biểu đồ thuần SVG cho khu vực Admin, theo skill dataviz: màu lấy từ theme BoardVerse
 * (wine/sky) nhưng nâng chroma/độ sáng để đạt ngưỡng CVD + tương phản (xem ghi chú ở cuối file); mỗi
 * cột có hit-target + tooltip khi hover/focus; giá trị cũng đọc được qua trục/nhãn nên tooltip chỉ là
 * phần bổ sung, không phải điều kiện bắt buộc để đọc số liệu. */

// Màu biểu đồ — cùng hue với --e-wine / --e-sky / --e-forest / --e-gold của theme, nhưng bước lại
// OKLCH (L/C) để vượt ngưỡng kiểm (contrast >= 3:1 trên nền paper/cream, CVD ΔE normal-vision >= 15).
// Validate: node scripts/validate_palette.js "#a73446,#076eae,#28762f,#c99d41" --mode light --surface "#fffdf8"
export const CHART = {
  ban: "#a73446", // wine, slot "Bán"
  thue: "#076eae", // sky, slot "Thuê"
  tonKho: "#28762f", // forest, dùng cho biểu đồ tồn kho (1 series)
  canhBao: "#c99d41", // gold — WARN ở mức tương phản 2.46:1, luôn đi kèm nhãn trực tiếp (không dùng màu đơn độc)
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Tr`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

// ============== Biểu đồ cột nhóm: Doanh thu Bán vs Thuê theo tháng ==============
export function RevenueBarChart({
  data,
}: {
  data: { month: string; label: string; ban: number; thue: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const height = 260;
  const padL = 52;
  const padB = 28;
  const padT = 12;
  const padR = 8;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.ban, d.thue)));
  const niceMax = Math.ceil(maxVal / 50_000_000) * 50_000_000 || maxVal;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const groupW = plotW / data.length;
  const barW = Math.min(16, groupW * 0.3);
  const gap = 3; // surface gap giữa 2 cột trong cùng nhóm

  const yOf = (v: number) => padT + plotH - (v / niceMax) * plotH;

  return (
    <div>
      <div className="mb-3 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-ink">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.ban }} /> Bán
        </span>
        <span className="flex items-center gap-1.5 text-ink">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.thue }} /> Thuê
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label="Biểu đồ doanh thu bán và thuê theo tháng">
        {/* Gridlines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={yOf(t)} y2={yOf(t)} stroke="var(--e-ink)" strokeOpacity={0.08} strokeWidth={1} />
            <text x={padL - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle" className="fill-ink-soft" fontSize={10}>
              {fmtCompact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const gx = padL + i * groupW;
          const cx = gx + groupW / 2;
          const banX = cx - gap / 2 - barW;
          const thueX = cx + gap / 2;
          const banY = yOf(d.ban);
          const thueY = yOf(d.thue);
          const isHover = hover === i;
          return (
            <g key={d.month}>
              {/* hit target: toàn bộ chiều cao của nhóm, rộng hơn 2 cột cộng lại */}
              <rect
                x={gx + 2}
                y={padT}
                width={groupW - 4}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((h) => (h === i ? null : h))}
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: Bán ${formatVND(d.ban)}, Thuê ${formatVND(d.thue)}`}
              />
              <rect x={banX} y={banY} width={barW} height={Math.max(0, padT + plotH - banY)} rx={4} fill={CHART.ban} opacity={isHover ? 1 : 0.92} />
              <rect x={thueX} y={thueY} width={barW} height={Math.max(0, padT + plotH - thueY)} rx={4} fill={CHART.thue} opacity={isHover ? 1 : 0.92} />
              {isHover && (
                <rect x={gx + 1} y={padT} width={groupW - 2} height={plotH} fill="var(--e-ink)" opacity={0.04} />
              )}
              <text x={cx} y={height - padB + 16} textAnchor="middle" className="fill-ink-soft" fontSize={10}>
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hover !== null && (
          <ChartTooltip
            x={padL + hover * groupW + groupW / 2}
            y={padT}
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

// ============== Biểu đồ cột xếp chồng: 1 cột (tồn kho hộp game theo trạng thái) ==============
export function StackedStatusBar({
  segments,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-full bg-cream">
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <button
              key={s.key}
              type="button"
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover((h) => (h === s.key ? null : h))}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover((h) => (h === s.key ? null : h))}
              style={{ width: `${pct}%`, background: s.color, marginLeft: i === 0 ? 0 : 2 }}
              className="relative h-full shrink-0 transition-opacity"
              aria-label={`${s.label}: ${s.value} hộp (${pct.toFixed(0)}%)`}
            >
              {hover === s.key && (
                <span className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] font-medium text-cream shadow-lg">
                  {s.label}: {s.value} ({pct.toFixed(0)}%)
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="tabular-nums text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartTooltip({
  x,
  y,
  width,
  title,
  rows,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: { key: string; label: string; value: string; color: string }[];
}) {
  const boxW = 150;
  const boxH = 24 + rows.length * 18;
  const left = Math.min(Math.max(x - boxW / 2, 4), width - boxW - 4);
  return (
    <foreignObject x={left} y={Math.max(y - boxH - 8, 0)} width={boxW} height={boxH} className="pointer-events-none overflow-visible">
      <div className="rounded border border-ink/10 bg-ink px-2.5 py-2 text-[11px] text-cream shadow-lg">
        <p className="mb-1 font-semibold">{title}</p>
        {rows.map((r) => (
          <p key={r.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-cream/80">
              <span className="h-[2px] w-2.5 shrink-0" style={{ background: r.color }} /> {r.label}
            </span>
            <span className="font-semibold tabular-nums">{r.value}</span>
          </p>
        ))}
      </div>
    </foreignObject>
  );
}
