"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

/** Thanh điều khiển danh sách dùng chung (tìm kiếm, chip lọc có đếm, phân trang)
 * cho các màn hình có thể chứa hàng trăm bản ghi — xem quy tắc "UI phải tính đến
 * số lượng lớn" ở skill feature-from-srs. */

export function Chip({
  active,
  count,
  onClick,
  tone = "default",
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  tone?: "default" | "warn";
  children: React.ReactNode;
}) {
  const idle =
    tone === "warn" ? "bg-destructive/10 text-destructive hover:bg-destructive/15" : "bg-cream text-ink-soft hover:text-ink";
  const on = tone === "warn" ? "bg-destructive text-paper" : "bg-wine text-paper";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active ? on : idle
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-paper/20" : "bg-ink/10"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/** Ô tích chọn; `mixed` = một phần các dòng khớp đã được chọn. */
export function CheckBox({
  checked,
  mixed,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  mixed?: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(mixed) && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer accent-wine disabled:cursor-not-allowed"
    />
  );
}

/** Thanh "chọn tất cả" áp dụng cho MỌI dòng khớp tìm kiếm/bộ lọc hiện tại (kể cả ở trang khác). */
export function SelectAllBar({
  total,
  selectedMatching,
  selectedAll,
  totalAll,
  busy,
  onToggle,
}: {
  total: number;
  selectedMatching: number;
  selectedAll: number;
  totalAll: number;
  busy: boolean;
  onToggle: (chon: boolean) => void;
}) {
  const allOn = total > 0 && selectedMatching === total;
  return (
    <div className="flex min-h-[2rem] items-center justify-between gap-3 border-y border-cream py-2 text-xs text-ink-soft">
      <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wider">
        <CheckBox
          checked={allOn}
          mixed={selectedMatching > 0}
          disabled={busy || total === 0}
          onChange={onToggle}
          label="Chọn tất cả các dòng khớp bộ lọc"
        />
        Chọn tất cả ({total})
      </label>
      <span className="whitespace-nowrap tabular-nums">
        Đã chọn <strong className="text-ink">{selectedAll}</strong>/{totalAll}
      </span>
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
      <span className="tabular-nums">{total} kết quả</span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Trang trước"
          className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="tabular-nums">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Trang sau"
          className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2 border-b border-ink/20 py-1.5 focus-within:border-wine">
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
