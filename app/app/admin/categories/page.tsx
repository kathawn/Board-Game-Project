"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Pencil, Tag, X } from "lucide-react";
import { formatVND } from "@/lib/products";
import type { AdminCategory } from "@/lib/admin/types";

/** UC-15 (FR-ADM-03) mở rộng — trang riêng (trước nằm chung tab trong Sản phẩm & giá, tách ra để không lẫn với
 * CRUD sản phẩm). SRS/ERD không có bảng DanhMuc riêng, "danh mục" chỉ là cột text tự do trên SanPham.danhMuc,
 * nên không tạo được danh mục rỗng; trang này chỉ tổng hợp (đếm sản phẩm + doanh thu) và cho đổi tên/gộp danh
 * mục — xem lib/admin/categories.ts. */

const card = "rounded-xl bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const inputCls =
  "w-full rounded-lg border border-ink/18 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-wine focus:outline-none";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.status === 401) {
      router.push("/staff/login");
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories);
  }, [router]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const startEdit = (ten: string) => {
    setEditing(ten);
    setEditValue(ten);
    setError(null);
  };

  const existingNames = new Set((categories ?? []).map((c) => c.ten));
  const willMerge = editing !== null && editValue.trim() !== editing && existingNames.has(editValue.trim());

  const save = async () => {
    if (editing === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(editing)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ten: editValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra.");
        return;
      }
      setEditing(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-ink">Danh mục</h1>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Tổng hợp danh mục đang có sản phẩm, cùng số sản phẩm và doanh thu từng danh mục.
          <span className="ml-1 text-ink-soft/70">(UC-15)</span>
        </p>
      </div>

      <section className={`${card} p-6`}>
        <p className="mb-5 flex items-start gap-2 rounded-lg bg-gold/10 p-2.5 text-xs text-ink">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          Danh mục không phải danh sách riêng — mỗi danh mục chỉ tồn tại khi có sản phẩm thuộc nó. Đổi tên ở đây sẽ áp
          dụng cho toàn bộ sản phẩm đang thuộc danh mục đó; đổi thành tên của một danh mục đã có sẽ gộp hai danh mục
          làm một.
        </p>

        <ul className="divide-y divide-cream">
          {categories?.map((c) => (
            <li key={c.ten} className="flex items-center gap-3 py-3">
              <Tag className="h-4 w-4 shrink-0 text-wine" />
              {editing === c.ten ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    autoFocus
                    className={`${inputCls} py-2`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                  <button type="button" onClick={save} disabled={busy || !editValue.trim()} aria-label="Lưu" className="shrink-0 rounded-lg bg-wine p-2 text-paper hover:bg-wine-deep disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setEditing(null)} aria-label="Huỷ" className="shrink-0 rounded-lg border border-ink/20 p-2 text-ink hover:bg-ink hover:text-cream">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.ten}</span>
                  <span className="whitespace-nowrap text-xs tabular-nums text-ink-soft">{c.soSanPham} sản phẩm</span>
                  <span className="w-32 whitespace-nowrap text-right text-sm tabular-nums text-ink">{formatVND(c.doanhThu)}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(c.ten)}
                    aria-label={`Đổi tên ${c.ten}`}
                    className="shrink-0 rounded-lg p-2 text-ink-soft transition-colors hover:bg-cream hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
          {categories && categories.length === 0 && (
            <li className="py-10 text-center text-sm text-ink-soft">Chưa có danh mục nào (chưa có sản phẩm).</li>
          )}
        </ul>

        {/* Vùng thông báo cố định chiều cao: không đẩy danh sách khi xuất hiện. */}
        <div className="mt-3 min-h-[20px] text-xs">
          {editing !== null && willMerge && (
            <p className="flex items-start gap-2 text-gold">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />“{editValue.trim()}” đã có sẵn — lưu sẽ gộp “{editing}” vào danh mục này.
            </p>
          )}
          {error && <p className="font-medium text-destructive">{error}</p>}
        </div>
      </section>
    </>
  );
}
