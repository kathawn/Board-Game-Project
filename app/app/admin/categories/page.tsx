"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Info, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { formatVND } from "@/lib/products";
import type { AdminCategory, AdminCategoryPage, AdminProductSummary, CategorySort, CategoryTab } from "@/lib/admin/types";

/** UC-15 (FR-ADM-03) mở rộng — trang Danh mục: thêm / tìm / lọc / sắp xếp / đổi tên-gộp / xoá danh mục trống.
 * Bố cục list + detail: tìm, lọc tab, sắp xếp, phân trang chạy ở server (/api/admin/categories); chọn một dòng thì
 * bên phải hiện chi tiết (sản phẩm thuộc danh mục + thao tác). Danh mục = bảng DanhMuc ∪ SanPham.danhMuc —
 * xem lib/admin/categories.ts. */

const card = "rounded-xl bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const inputCls =
  "w-full rounded-lg border border-ink/18 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-wine focus:outline-none";

const TABS: { key: CategoryTab; label: string; count: "all" | "coSanPham" | "trong" }[] = [
  { key: "", label: "Tất cả", count: "all" },
  { key: "co-san-pham", label: "Có sản phẩm", count: "coSanPham" },
  { key: "trong", label: "Trống", count: "trong" },
];
const SORTS: { key: CategorySort; label: string }[] = [
  { key: "ten", label: "Tên A → Z" },
  { key: "san-pham", label: "Nhiều sản phẩm nhất" },
  { key: "doanh-thu", label: "Doanh thu cao nhất" },
];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminCategoryPage | null>(null);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [tab, setTab] = useState<CategoryTab>("");
  const [sort, setSort] = useState<CategorySort>("ten");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Thêm mới
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Debounce ô tìm kiếm để không bắn request mỗi phím gõ.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQApplied(v);
      setPage(1);
    }, 250);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const params = new URLSearchParams({ q: qApplied, tab, sort, page: String(page) });
      const res = await fetch(`/api/admin/categories?${params}`, { signal: controller.signal });
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (res.ok) setData(await res.json());
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });
    return () => controller.abort();
  }, [qApplied, tab, sort, page, reloadKey, router]);

  const reload = () => setReloadKey((k) => k + 1);

  /** Đưa danh mục vừa tạo / vừa đổi tên lên đầu kết quả (tìm đúng tên, bỏ lọc tab) để chắc chắn thấy nó. */
  const focus = (ten: string) => {
    setQ(ten);
    setQApplied(ten);
    setTab("");
    setPage(1);
    setSelected(ten);
    reload();
  };

  const add = async () => {
    setAdding(true);
    setAddError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ten: newName }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAddError(body.error ?? "Đã có lỗi xảy ra.");
        return;
      }
      setNewName("");
      setNotice(`Đã thêm danh mục “${body.ten}”.`);
      focus(body.ten);
    } finally {
      setAdding(false);
    }
  };

  const selectedCat = data?.items.find((c) => c.ten === selected) ?? null;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-ink">Danh mục</h1>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Thêm, tìm, đổi tên / gộp và xoá danh mục sản phẩm; xem số sản phẩm và doanh thu từng danh mục.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className={`${card} p-6`}>
          {/* Thêm danh mục */}
          <form
            className="mb-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) add();
            }}
          >
            <label htmlFor="new-cat" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Thêm danh mục mới
            </label>
            <div className="flex gap-2">
              <input
                id="new-cat"
                className={inputCls}
                value={newName}
                maxLength={100}
                placeholder="Ví dụ: Cờ gia đình"
                onChange={(e) => {
                  setNewName(e.target.value);
                  setAddError(null);
                }}
              />
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-wine px-4 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-wine-deep disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Thêm
              </button>
            </div>
            <p className="mt-1.5 min-h-[16px] text-xs">
              {addError ? <span className="font-medium text-destructive">{addError}</span> : notice ? <span className="text-forest">{notice}</span> : null}
            </p>
          </form>

          {/* Tìm kiếm + sắp xếp */}
          <div className="mb-3 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 border-b border-ink/20 py-1.5 focus-within:border-wine">
              <Search className="h-4 w-4 shrink-0 text-ink-soft" />
              <input
                type="search"
                value={q}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Tìm danh mục (không cần gõ dấu)…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
              />
            </label>
            <select
              value={sort}
              aria-label="Sắp xếp"
              onChange={(e) => {
                setSort(e.target.value as CategorySort);
                setPage(1);
              }}
              className="rounded-lg border border-ink/18 bg-cream px-3 py-2 text-xs text-ink focus:border-wine focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab có số đếm */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
                  tab === t.key ? "bg-wine text-paper" : "bg-cream text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${tab === t.key ? "bg-paper/20" : "bg-ink/10"}`}>
                  {data?.counts[t.count] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Chiều cao cố định (8 dòng × 56px) để không giật layout khi đổi trang/bộ lọc. */}
          <ul className="min-h-[448px] divide-y divide-cream">
            {data?.items.map((c) => (
              <li key={c.ten}>
                <button
                  type="button"
                  onClick={() => setSelected(c.ten)}
                  className={`grid h-14 w-full grid-cols-[16px_minmax(0,1fr)_90px_120px] items-center gap-3 px-2 text-left transition-colors ${
                    selected === c.ten ? "bg-cream" : "hover:bg-cream/60"
                  }`}
                >
                  <Tag className="h-4 w-4 text-wine" />
                  <span className="truncate text-sm font-medium text-ink">{c.ten}</span>
                  <span className={`whitespace-nowrap text-xs tabular-nums ${c.soSanPham === 0 ? "text-gold" : "text-ink-soft"}`}>
                    {c.soSanPham === 0 ? "Trống" : `${c.soSanPham} sản phẩm`}
                  </span>
                  <span className="whitespace-nowrap text-right text-sm tabular-nums text-ink">{formatVND(c.doanhThu)}</span>
                </button>
              </li>
            ))}
            {data && data.items.length === 0 && (
              <li className="py-10 text-center text-sm text-ink-soft">
                {qApplied || tab ? "Không có danh mục phù hợp." : "Chưa có danh mục nào. Hãy thêm danh mục đầu tiên ở trên."}
              </li>
            )}
            {!data && <li className="py-10 text-center text-sm text-ink-soft">Đang tải...</li>}
          </ul>

          <div className="flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
            <span>{data?.total ?? 0} danh mục</span>
            <span className="flex items-center gap-1">
              <button type="button" disabled={!data || data.page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước" className="p-1.5 transition-colors hover:text-ink disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums">
                Trang {data?.page ?? 1}/{data?.totalPages ?? 1}
              </span>
              <button type="button" disabled={!data || data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau" className="p-1.5 transition-colors hover:text-ink disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </span>
          </div>
        </section>

        <CategoryDetail
          key={selected ?? "none"}
          cat={selectedCat}
          name={selected}
          onChanged={(newSelected) => {
            if (newSelected) focus(newSelected);
            else {
              setSelected(null);
              reload();
            }
          }}
        />
      </div>
    </>
  );
}

function CategoryDetail({
  cat,
  name,
  onChanged,
}: {
  cat: AdminCategory | null;
  name: string | null;
  onChanged: (selectedAfter: string | null) => void;
}) {
  const [products, setProducts] = useState<AdminProductSummary[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Chi tiết chỉ tải cho danh mục đang chọn (component được remount theo key).
  useEffect(() => {
    if (!name) return;
    const controller = new AbortController();
    (async () => {
      const res = await fetch(`/api/admin/products?danhMuc=${encodeURIComponent(name)}&page=1`, { signal: controller.signal });
      if (res.ok) setProducts((await res.json()).items);
    })().catch((err) => {
      if (err.name !== "AbortError") throw err;
    });
    return () => controller.abort();
  }, [name]);

  if (!name) {
    return (
      <aside className={`${card} flex min-h-[200px] items-center justify-center p-8 text-center text-sm text-ink-soft`}>
        Chọn một danh mục để xem sản phẩm, đổi tên hoặc xoá.
      </aside>
    );
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ten: editValue }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Đã có lỗi xảy ra.");
        return;
      }
      onChanged(editValue.trim().replace(/\s+/g, " "));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Đã có lỗi xảy ra.");
        setConfirmDelete(false);
        return;
      }
      onChanged(null);
    } finally {
      setBusy(false);
    }
  };

  const isEmpty = cat ? cat.soSanPham === 0 : products?.length === 0;

  return (
    <aside className={`${card} p-6`}>
      {editing ? (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className={`${inputCls} py-2`}
              value={editValue}
              maxLength={100}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editValue.trim()) save();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button type="button" onClick={save} disabled={busy || !editValue.trim()} aria-label="Lưu" className="shrink-0 rounded-lg bg-wine p-2 text-paper hover:bg-wine-deep disabled:opacity-50">
              <Check className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setEditing(false)} aria-label="Huỷ" className="shrink-0 rounded-lg border border-ink/20 p-2 text-ink hover:bg-ink hover:text-cream">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-gold/10 p-2.5 text-xs text-ink">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            Đổi tên áp dụng cho mọi sản phẩm trong danh mục. Nếu đổi thành tên của một danh mục đã có, hai danh mục sẽ được gộp làm một.
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words font-heading text-xl text-ink">{name}</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setEditValue(name);
              setError(null);
            }}
            aria-label={`Đổi tên ${name}`}
            className="shrink-0 rounded-lg p-2 text-ink-soft transition-colors hover:bg-cream hover:text-ink"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}

      <dl className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded bg-cream p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Sản phẩm</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">{cat?.soSanPham ?? "—"}</dd>
        </div>
        <div className="rounded bg-cream p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Doanh thu</dt>
          <dd className="mt-1 whitespace-nowrap text-lg font-semibold tabular-nums text-wine">{cat ? formatVND(cat.doanhThu) : "—"}</dd>
        </div>
      </dl>

      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Sản phẩm trong danh mục</h3>
      <ul className="mb-3 min-h-[120px] divide-y divide-cream">
        {products?.slice(0, 6).map((p) => (
          <li key={p.slug} className="flex h-9 items-center justify-between gap-3 text-sm">
            <span className="truncate text-ink">{p.ten}</span>
            <span className="whitespace-nowrap text-xs tabular-nums text-ink-soft">{formatVND(p.giaNiemYet)}</span>
          </li>
        ))}
        {products && products.length === 0 && <li className="py-6 text-center text-sm text-ink-soft">Danh mục này chưa có sản phẩm.</li>}
        {!products && <li className="py-6 text-center text-sm text-ink-soft">Đang tải...</li>}
      </ul>
      <Link href="/admin/products" className="text-xs font-medium text-wine hover:underline">
        Quản lý sản phẩm →
      </Link>

      <div className="mt-6 border-t border-cream pt-4">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex-1 text-ink">Xoá danh mục “{name}”?</span>
            <button type="button" onClick={remove} disabled={busy} className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-paper disabled:opacity-50">
              Xoá
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-ink/20 px-3 py-1.5 text-ink hover:bg-ink hover:text-cream">
              Huỷ
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!isEmpty}
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xoá danh mục
          </button>
        )}
        <p className="mt-2 min-h-[16px] text-xs">
          {error ? (
            <span className="font-medium text-destructive">{error}</span>
          ) : !isEmpty ? (
            <span className="text-ink-soft">Chỉ xoá được danh mục không còn sản phẩm.</span>
          ) : null}
        </p>
      </div>
    </aside>
  );
}
