"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Info, LogOut, Plus, Search, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatVND } from "@/lib/products";
import type { AdminProduct, ProductPage } from "@/lib/admin/mock-products";

/** MOCKUP SCR-UC-15 (FR-ADM-03, BR-12): Admin thêm / sửa / xoá sản phẩm và cập nhật giá niêm yết (giá bán;
 * giá thuê suy ra theo BRU-02 từ giá niêm yết nên không nhập riêng). Danh sách tìm kiếm / lọc / phân trang ở
 * server; chi tiết chỉ tải cho sản phẩm đang chọn. Chưa có kiểm tra phiên Admin — sẽ có sau Gate 1. */

type ListData = ProductPage & { categories: string[] };

const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const btnPrimary =
  "flex items-center justify-center gap-2 whitespace-nowrap bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60";
const btnGhost =
  "flex items-center justify-center gap-2 whitespace-nowrap border border-ink/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream disabled:opacity-60";
const inputCls =
  "w-full rounded border border-ink/18 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-wine focus:outline-none";

const EMPTY: AdminProduct = {
  slug: "",
  ten: "",
  danhMuc: "",
  giaNiemYet: 0,
  moTaNgan: "",
  soNguoiMin: 2,
  soNguoiMax: 4,
  linhKien: [],
  soHopSan: 0,
  soHopTong: 0,
  soDonLienQuan: 0,
};

const giaThueNgayDau = (gia: number) => Math.round(gia * 0.1);
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
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
        <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-paper/20" : "bg-ink/10"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListData | null>(null);

  // selected: slug đang xem/sửa; "new" = đang thêm mới.
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AdminProduct | null>(null);
  const [oldPrice, setOldPrice] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ q: qApplied, danhMuc, page: String(page) });
    const res = await fetch(`/api/admin/products?${params}`);
    const data: ListData = await res.json();
    setList(data);
    setSelected((cur) => cur ?? data.items[0]?.slug ?? null);
  }, [qApplied, danhMuc, page]);

  useEffect(() => {
    (async () => {
      await loadList();
    })();
  }, [loadList]);

  useEffect(() => {
    (async () => {
      setConfirmDelete(false);
      setMessage(null);
      if (selected === "new") {
        setForm({ ...EMPTY });
        setOldPrice(null);
      } else if (selected) {
        const res = await fetch(`/api/admin/products/${selected}`);
        if (res.ok) {
          const { product }: { product: AdminProduct } = await res.json();
          setForm(product);
          setOldPrice(product.giaNiemYet);
        } else {
          setForm(null);
        }
      } else {
        setForm(null);
      }
    })();
  }, [selected]);

  const onSearch = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      setQApplied(v);
    }, 300);
  };

  const patch = (p: Partial<AdminProduct>) => setForm((f) => (f ? { ...f, ...p } : f));

  const valid =
    form &&
    form.ten.trim() !== "" &&
    form.slug.trim() !== "" &&
    form.danhMuc.trim() !== "" &&
    form.giaNiemYet > 0 &&
    form.soNguoiMin >= 1 &&
    form.soNguoiMax >= form.soNguoiMin;

  const handleSave = async () => {
    if (!form || !valid) return;
    setBusy(true);
    setMessage(null);
    try {
      const isNew = selected === "new";
      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${form.slug}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Đã có lỗi xảy ra." });
        return;
      }
      setMessage({ kind: "ok", text: isNew ? "Đã thêm sản phẩm." : "Đã lưu thay đổi." });
      setOldPrice(form.giaNiemYet);
      if (isNew) setSelected(form.slug);
      await loadList();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!form) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${form.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error });
        setConfirmDelete(false);
        return;
      }
      setSelected(null);
      await loadList();
      setMessage({ kind: "ok", text: "Đã xoá sản phẩm." });
    } finally {
      setBusy(false);
    }
  };

  const priceChanged = form && oldPrice !== null && form.giaNiemYet !== oldPrice;

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                Nội bộ — Admin
              </span>
              <h1 className="font-heading text-3xl font-semibold text-ink">Quản lý sản phẩm &amp; giá (UC-15)</h1>
              <p className="mt-2 text-sm font-light text-ink-soft">
                Thêm / sửa / xoá sản phẩm và cập nhật giá niêm yết. Giá mới chỉ áp dụng cho đơn tạo sau đó.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-soft">admin@boardverse.local</span>
              <a href="/staff/login" className="flex items-center gap-1.5 text-xs font-semibold text-wine hover:underline">
                <LogOut className="h-3.5 w-3.5" /> Đăng xuất
              </a>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
            {/* ===== DANH SÁCH ===== */}
            <section className={`${card} p-5`}>
              <div className="mb-3 flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2 border-b border-ink/20 py-1.5 focus-within:border-wine">
                  <Search className="h-4 w-4 shrink-0 text-ink-soft" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc slug…"
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </label>
                <button type="button" onClick={() => setSelected("new")} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Thêm
                </button>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <Chip
                  active={danhMuc === ""}
                  count={list?.totalAll}
                  onClick={() => {
                    setDanhMuc("");
                    setPage(1);
                  }}
                >
                  Tất cả
                </Chip>
                {list?.categories.map((c) => (
                  <Chip
                    key={c}
                    active={danhMuc === c}
                    count={list.categoryCounts[c] ?? 0}
                    onClick={() => {
                      setDanhMuc(c);
                      setPage(1);
                    }}
                  >
                    {c}
                  </Chip>
                ))}
              </div>

              {/* Chiều cao cố định (10 dòng) để đổi trang / lọc không làm trang nhảy. */}
              <ul className="min-h-[520px] divide-y divide-cream">
                {list?.items.map((p) => (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => setSelected(p.slug)}
                      className={`grid h-[52px] w-full grid-cols-[minmax(0,1fr)_96px] items-center gap-3 px-2 text-left transition-colors ${
                        selected === p.slug ? "bg-cream" : "hover:bg-cream/60"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{p.ten}</span>
                        <span className="block truncate text-[11px] text-ink-soft">{p.danhMuc}</span>
                      </span>
                      <span className="whitespace-nowrap text-right text-sm tabular-nums text-ink">
                        {formatVND(p.giaNiemYet)}
                      </span>
                    </button>
                  </li>
                ))}
                {list && list.items.length === 0 && (
                  <li className="py-10 text-center text-sm text-ink-soft">Không có sản phẩm phù hợp.</li>
                )}
              </ul>

              {list && (
                <div className="flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
                  <span>{list.total} kết quả</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={list.page <= 1}
                      onClick={() => setPage(list.page - 1)}
                      aria-label="Trang trước"
                      className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="tabular-nums">
                      Trang {list.page}/{list.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={list.page >= list.totalPages}
                      onClick={() => setPage(list.page + 1)}
                      aria-label="Trang sau"
                      className="p-1.5 transition-colors hover:text-ink disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              )}
            </section>

            {/* ===== CHI TIẾT / SỬA ===== */}
            <section className={`${card} p-6 lg:sticky lg:top-24`}>
              {!form ? (
                <p className="py-24 text-center text-sm text-ink-soft">Chọn một sản phẩm ở danh sách, hoặc bấm “Thêm”.</p>
              ) : (
                <>
                  <h2 className="mb-5 font-heading text-xl text-ink">
                    {selected === "new" ? "Thêm sản phẩm mới" : form.ten}
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Tên sản phẩm
                      </span>
                      <input
                        className={inputCls}
                        value={form.ten}
                        onChange={(e) =>
                          patch({ ten: e.target.value, ...(selected === "new" ? { slug: slugify(e.target.value) } : {}) })
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Slug (không đổi sau khi tạo)
                      </span>
                      <input
                        className={`${inputCls} disabled:opacity-60`}
                        value={form.slug}
                        disabled={selected !== "new"}
                        onChange={(e) => patch({ slug: slugify(e.target.value) })}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Danh mục
                      </span>
                      <input
                        className={inputCls}
                        list="dm"
                        value={form.danhMuc}
                        onChange={(e) => patch({ danhMuc: e.target.value })}
                      />
                      <datalist id="dm">
                        {list?.categories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Giá niêm yết / giá bán (đ)
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        className={`${inputCls} tabular-nums`}
                        value={form.giaNiemYet || ""}
                        onChange={(e) => patch({ giaNiemYet: Number(e.target.value) })}
                      />
                    </label>
                    <div>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Giá thuê ngày đầu (BRU-02, tự tính = 10%)
                      </span>
                      <div className="rounded border border-dashed border-ink/20 px-3.5 py-2.5 text-sm tabular-nums text-ink-soft">
                        {form.giaNiemYet > 0 ? formatVND(giaThueNgayDau(form.giaNiemYet)) : "—"}
                      </div>
                    </div>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Số người tối thiểu
                      </span>
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={form.soNguoiMin}
                        onChange={(e) => patch({ soNguoiMin: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Số người tối đa
                      </span>
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={form.soNguoiMax}
                        onChange={(e) => patch({ soNguoiMax: Number(e.target.value) })}
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Mô tả ngắn
                      </span>
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={form.moTaNgan}
                        onChange={(e) => patch({ moTaNgan: e.target.value })}
                      />
                    </label>
                  </div>

                  {/* Vùng thông báo cố định chiều cao: không đẩy các nút khi xuất hiện. */}
                  <div className="mt-4 min-h-[64px] space-y-2 text-xs">
                    {priceChanged && (
                      <p className="flex items-start gap-2 rounded bg-gold/10 p-2.5 text-ink">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                        Giá đổi từ {formatVND(oldPrice!)} → {formatVND(form.giaNiemYet)}. Áp dụng ngay cho đơn tạo mới;
                        đơn đã xác nhận trước đó giữ nguyên giá cũ.
                      </p>
                    )}
                    {message && (
                      <p className={`font-medium ${message.kind === "ok" ? "text-forest" : "text-destructive"}`}>
                        {message.text}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-cream pt-4">
                    {selected !== "new" ? (
                      confirmDelete ? (
                        <span className="flex items-center gap-2 text-xs">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Xoá “{form.ten}”?
                          <button type="button" onClick={handleDelete} disabled={busy} className={btnPrimary}>
                            Xác nhận xoá
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(false)} className={btnGhost}>
                            Huỷ
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-destructive hover:underline"
                        >
                          <Trash2 className="h-4 w-4" /> Xoá sản phẩm
                        </button>
                      )
                    ) : (
                      <span />
                    )}
                    <button type="button" onClick={handleSave} disabled={busy || !valid} className={btnPrimary}>
                      {busy ? "Đang lưu…" : selected === "new" ? "Thêm sản phẩm" : "Lưu thay đổi"}
                    </button>
                  </div>

                  {selected !== "new" && (
                    <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-cream pt-4 text-center text-xs text-ink-soft">
                      <div>
                        <dt>Hộp sẵn sàng</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
                          {form.soHopSan}/{form.soHopTong}
                        </dd>
                      </div>
                      <div>
                        <dt>Dòng đơn liên quan</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">{form.soDonLienQuan}</dd>
                      </div>
                      <div>
                        <dt>Linh kiện (checklist)</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">{form.linhKien.length}</dd>
                      </div>
                    </dl>
                  )}
                  {selected !== "new" && form.soDonLienQuan > 0 && (
                    <p className="mt-3 text-[11px] text-ink-soft">
                      Sản phẩm đã có đơn nên không thể xoá (giữ lịch sử đơn). Quản lý hộp game ở UC-09.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
