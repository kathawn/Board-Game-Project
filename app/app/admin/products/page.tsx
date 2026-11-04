"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  ImagePlus,
  Info,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { formatVND } from "@/lib/products";
import type { AdminProduct, AdminProductInput, AdminProductPage } from "@/lib/admin/types";

/** UC-15 (FR-ADM-03, BR-12): Admin thêm / sửa / xoá sản phẩm và cập nhật giá niêm yết (giá bán; giá thuê suy ra theo
 * BRU-02 từ giá niêm yết nên không nhập riêng). Danh sách tìm kiếm / lọc / phân trang ở server; chi tiết chỉ tải cho
 * sản phẩm đang chọn. Khung trang + đăng nhập + phân quyền Admin đã xử lý ở app/admin/layout.tsx dùng chung cho
 * toàn khu vực quản trị; trang này chỉ còn lo nghiệp vụ CRUD sản phẩm/giá. 401 (phiên hết hạn giữa chừng) vẫn tự
 * điều hướng về trang đăng nhập nội bộ ở đây vì layout chỉ kiểm tra một lần lúc vào trang.
 *
 * "Danh mục" (mở rộng UC-15) tách ra trang riêng app/admin/categories/page.tsx — không còn là tab ở đây. */

type ListData = AdminProductPage;

/** Form giữ thêm các trường chỉ đọc để hiển thị số liệu; khi gửi lên chỉ lấy AdminProductInput. */
type FormState = AdminProduct;

const card = "rounded-xl bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const btnPrimary =
  "flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60";
const btnGhost =
  "flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-ink/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream disabled:opacity-60";
const inputCls =
  "w-full rounded-lg border border-ink/18 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-wine focus:outline-none";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft";

const EMPTY: FormState = {
  slug: "",
  ten: "",
  danhMuc: "",
  giaNiemYet: 0,
  moTaNgan: "",
  soNguoiMin: 2,
  soNguoiMax: 4,
  soHopSan: 0,
  soHopTong: 0,
  soDonLienQuan: 0,
  soLinhKien: 0,
  anh: null,
};

/** Một nhóm trường trong form chi tiết — tiêu đề + icon để tách khối thay vì để mọi ô nhập dồn liền nhau. */
function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Tag;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-cream pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-wine">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

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
  const router = useRouter();
  const [forbidden, setForbidden] = useState(false);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListData | null>(null);

  // selected: slug đang xem/sửa; "new" = đang thêm mới.
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [oldPrice, setOldPrice] = useState<number | null>(null);
  // Thông báo giá đã đổi (từ → sang) ở lại sau khi lưu để Admin còn đọc được; reset khi chọn sản phẩm khác.
  const [priceNotice, setPriceNotice] = useState<{ tu: number; sang: number } | null>(null);
  const [anhFile, setAnhFile] = useState<File | null>(null);
  const [anhPreview, setAnhPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Mọi lời gọi API Admin đi qua đây: 401 (chưa đăng nhập nội bộ / phiên hết hạn) → về trang đăng nhập nội bộ;
   * 403 (là Staff, không phải Admin) → hiện thông báo không đủ quyền. */
  const api = useCallback(
    async (url: string, init?: RequestInit): Promise<Response | null> => {
      const res = await fetch(url, init);
      if (res.status === 401) {
        router.push("/staff/login");
        return null;
      }
      if (res.status === 403) {
        setForbidden(true);
        return null;
      }
      return res;
    },
    [router],
  );

  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ q: qApplied, danhMuc, page: String(page) });
    const res = await api(`/api/admin/products?${params}`);
    if (!res) return;
    const data: ListData = await res.json();
    setList(data);
    setSelected((cur) => cur ?? data.items[0]?.slug ?? null);
  }, [qApplied, danhMuc, page, api]);

  useEffect(() => {
    (async () => {
      await loadList();
    })();
  }, [loadList]);

  useEffect(() => {
    (async () => {
      setConfirmDelete(false);
      setMessage(null);
      setPriceNotice(null);
      setAnhFile(null);
      setAnhPreview(null);
      if (selected === "new") {
        setForm({ ...EMPTY });
        setOldPrice(null);
      } else if (selected) {
        const res = await api(`/api/admin/products/${selected}`);
        if (res?.ok) {
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
  }, [selected, api]);

  const onSearch = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      setQApplied(v);
    }, 300);
  };

  const patch = (p: Partial<FormState>) => setForm((f) => (f ? { ...f, ...p } : f));

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
      const input: AdminProductInput = {
        slug: form.slug,
        ten: form.ten,
        danhMuc: form.danhMuc,
        giaNiemYet: form.giaNiemYet,
        moTaNgan: form.moTaNgan,
        soNguoiMin: form.soNguoiMin,
        soNguoiMax: form.soNguoiMax,
      };
      const res = await api(isNew ? "/api/admin/products" : `/api/admin/products/${form.slug}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Đã có lỗi xảy ra." });
        return;
      }
      // Tải ảnh (nếu Admin đã chọn file) sau khi sản phẩm đã có trong DB.
      let loiAnh: string | null = null;
      let anhMoi: string | null = null;
      if (anhFile) {
        const fd = new FormData();
        fd.append("file", anhFile);
        const up = await api(`/api/admin/products/${form.slug}/image`, { method: "POST", body: fd });
        if (!up) return;
        const upData = await up.json();
        if (up.ok) anhMoi = upData.anh;
        else loiAnh = upData.error ?? "Không tải được ảnh.";
      }

      // Câu giải thích giá phải ở lại SAU khi lưu (trước đây biến mất ngay vì giá cũ bị ghi đè).
      if (!isNew && oldPrice !== null && oldPrice !== form.giaNiemYet) {
        setPriceNotice({ tu: oldPrice, sang: form.giaNiemYet });
      }
      setOldPrice(form.giaNiemYet);
      setAnhFile(null);
      setAnhPreview(null);
      if (anhMoi) patch({ anh: anhMoi });
      setMessage(
        loiAnh
          ? { kind: "err", text: `${isNew ? "Đã thêm sản phẩm" : "Đã lưu thay đổi"} nhưng chưa tải được ảnh: ${loiAnh}` }
          : { kind: "ok", text: isNew ? "Đã thêm sản phẩm." : "Đã lưu thay đổi." },
      );
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
      const res = await api(`/api/admin/products/${form.slug}`, { method: "DELETE" });
      if (!res) return;
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

  const onPickImage = (file: File | null) => {
    setAnhFile(file);
    setAnhPreview((cu) => {
      if (cu) URL.revokeObjectURL(cu);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  // Phiên bị thu hồi quyền Admin giữa chừng (403 từ API): chặn hẳn nội dung, không hiện giao diện rỗng.
  // (Trường hợp thông thường — vào trang khi đã không còn là Admin — layout chặn trước khi tới đây.)
  if (forbidden) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className={`${card} max-w-[420px] p-8 text-center`}>
          <h1 className="mb-2 font-heading text-xl text-ink">Không đủ quyền truy cập</h1>
          <p className="text-sm text-ink-soft">
            Chỉ tài khoản Admin mới được quản lý sản phẩm và giá. Hãy tải lại trang để đăng nhập lại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Sản phẩm &amp; giá</h1>
          <p className="mt-2 text-sm font-light text-ink-soft">
            Thêm / sửa / xoá sản phẩm, cập nhật giá niêm yết. Giá mới chỉ áp dụng cho đơn tạo sau đó.
          </p>
        </div>
        <button type="button" onClick={() => setSelected("new")} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        {/* ===== DANH SÁCH ===== */}
        <section className={`${card} p-5`}>
          <label className="mb-3 flex items-center gap-2 rounded-lg border border-ink/12 bg-cream px-3.5 py-2.5 focus-within:border-wine">
            <Search className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="search"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc slug…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            />
          </label>

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
          <ul className="min-h-[560px] space-y-1">
            {list?.items.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(p.slug)}
                  className={`flex h-[60px] w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors ${
                    selected === p.slug ? "bg-wine/10 ring-1 ring-wine/30" : "hover:bg-cream"
                  }`}
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-cream">
                    <Image src={p.anh ?? "/images/placeholder.jpg"} alt="" fill unoptimized className="object-cover" sizes="44px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{p.ten}</span>
                    <span className="block truncate text-[11px] text-ink-soft">{p.danhMuc}</span>
                  </span>
                  <span className="whitespace-nowrap text-right text-sm font-medium tabular-nums text-ink">
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
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-cream pt-3 text-xs text-ink-soft">
              <span>{list.total} kết quả</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={list.page <= 1}
                  onClick={() => setPage(list.page - 1)}
                  aria-label="Trang trước"
                  className="rounded p-1.5 transition-colors hover:bg-cream hover:text-ink disabled:opacity-40"
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
                  className="rounded p-1.5 transition-colors hover:bg-cream hover:text-ink disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </span>
            </div>
          )}
        </section>

        {/* ===== CHI TIẾT / SỬA ===== */}
        <section className={`${card} overflow-hidden lg:sticky lg:top-24`}>
          {!form ? (
            <p className="py-24 text-center text-sm text-ink-soft">Chọn một sản phẩm ở danh sách, hoặc bấm “Thêm sản phẩm”.</p>
          ) : (
            <>
              {/* Dải tiêu đề: ảnh lớn bên trái, tên + số liệu vận hành bên phải — thấy ngay sản phẩm nào đang sửa. */}
              <div className="flex items-center gap-4 bg-cream/60 px-6 py-5">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-paper">
                  {(anhPreview ?? form.anh) ? (
                    <Image src={(anhPreview ?? form.anh)!} alt={form.ten || "Ảnh sản phẩm"} fill unoptimized className="object-cover" sizes="64px" />
                  ) : (
                    <ImagePlus className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-ink-soft/60" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-xl text-ink">{selected === "new" ? "Thêm sản phẩm mới" : form.ten}</h2>
                  {selected !== "new" && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {form.soHopSan}/{form.soHopTong} hộp sẵn sàng · {form.soDonLienQuan} dòng đơn · {form.soLinhKien} linh kiện
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5 p-6">
                <FormSection icon={Tag} title="Thông tin cơ bản">
                  <label className="sm:col-span-2">
                    <span className={labelCls}>Tên sản phẩm</span>
                    <input
                      className={inputCls}
                      value={form.ten}
                      onChange={(e) =>
                        patch({ ten: e.target.value, ...(selected === "new" ? { slug: slugify(e.target.value) } : {}) })
                      }
                    />
                  </label>
                  <label>
                    <span className={labelCls}>Slug (không đổi sau khi tạo)</span>
                    <input
                      className={`${inputCls} disabled:opacity-60`}
                      value={form.slug}
                      disabled={selected !== "new"}
                      onChange={(e) => patch({ slug: slugify(e.target.value) })}
                    />
                  </label>
                  <label>
                    <span className={labelCls}>Danh mục</span>
                    <input className={inputCls} list="dm" value={form.danhMuc} onChange={(e) => patch({ danhMuc: e.target.value })} />
                    <datalist id="dm">
                      {list?.categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                </FormSection>

                <FormSection icon={Coins} title="Giá">
                  <label>
                    <span className={labelCls}>Giá niêm yết / giá bán (đ)</span>
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
                    <span className={labelCls}>Giá thuê ngày đầu (tự tính = 10%)</span>
                    <div className="rounded-lg border border-dashed border-ink/20 px-3.5 py-2.5 text-sm tabular-nums text-ink-soft">
                      {form.giaNiemYet > 0 ? formatVND(giaThueNgayDau(form.giaNiemYet)) : "—"}
                    </div>
                  </div>
                  {/* Vùng thông báo cố định chiều cao: không đẩy các trường bên dưới khi xuất hiện. */}
                  {(priceChanged || priceNotice) && (
                    <p className="flex items-start gap-2 rounded-lg bg-gold/10 p-2.5 text-xs text-ink sm:col-span-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      {priceChanged ? (
                        <>Giá đổi từ {formatVND(oldPrice!)} → {formatVND(form.giaNiemYet)}. Khi lưu, giá mới áp dụng ngay cho đơn tạo mới; đơn đã tạo trước đó giữ nguyên giá cũ.</>
                      ) : (
                        <>Đã đổi giá từ {formatVND(priceNotice!.tu)} → {formatVND(priceNotice!.sang)}. Giá mới áp dụng ngay cho đơn tạo mới; đơn đã tạo trước đó giữ nguyên giá cũ.</>
                      )}
                    </p>
                  )}
                </FormSection>

                <FormSection icon={Users} title="Số người chơi">
                  <label>
                    <span className={labelCls}>Tối thiểu</span>
                    <input type="number" min={1} className={inputCls} value={form.soNguoiMin} onChange={(e) => patch({ soNguoiMin: Number(e.target.value) })} />
                  </label>
                  <label>
                    <span className={labelCls}>Tối đa</span>
                    <input type="number" min={1} className={inputCls} value={form.soNguoiMax} onChange={(e) => patch({ soNguoiMax: Number(e.target.value) })} />
                  </label>
                </FormSection>

                <FormSection icon={ImagePlus} title="Ảnh & mô tả">
                  <div className="sm:col-span-2">
                    <span className={labelCls}>Ảnh sản phẩm (JPG / PNG / WebP, tối đa 2MB)</span>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/12 bg-cream">
                        {(anhPreview ?? form.anh) ? (
                          <Image src={(anhPreview ?? form.anh)!} alt={form.ten || "Ảnh sản phẩm"} fill unoptimized className="object-cover" sizes="80px" />
                        ) : (
                          <ImagePlus className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-ink-soft/60" />
                        )}
                      </div>
                      <label className={`${btnGhost} cursor-pointer`}>
                        <ImagePlus className="h-4 w-4" />
                        {anhFile ? "Chọn ảnh khác" : form.anh ? "Đổi ảnh" : "Chọn ảnh"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPickImage(e.target.files?.[0] ?? null)} />
                      </label>
                      <span className="min-w-0 truncate text-xs text-ink-soft">
                        {anhFile ? `${anhFile.name} — sẽ tải lên khi bấm Lưu` : form.anh ? "" : "Chưa có ảnh (đang dùng ảnh mặc định)"}
                      </span>
                    </div>
                  </div>
                  <label className="sm:col-span-2">
                    <span className={labelCls}>Mô tả ngắn</span>
                    <textarea rows={2} className={inputCls} value={form.moTaNgan} onChange={(e) => patch({ moTaNgan: e.target.value })} />
                  </label>
                </FormSection>

                {selected !== "new" && (
                  <FormSection icon={Boxes} title="Vận hành (chỉ đọc)">
                    <div className="flex items-center justify-between rounded-lg bg-cream px-3.5 py-2.5 text-sm">
                      <span className="text-ink-soft">Hộp sẵn sàng</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {form.soHopSan}/{form.soHopTong}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-cream px-3.5 py-2.5 text-sm">
                      <span className="text-ink-soft">Dòng đơn liên quan</span>
                      <span className="font-semibold tabular-nums text-ink">{form.soDonLienQuan}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-cream px-3.5 py-2.5 text-sm sm:col-span-2">
                      <span className="flex items-center gap-1.5 text-ink-soft">
                        <FileText className="h-3.5 w-3.5" /> Linh kiện (checklist)
                      </span>
                      <span className="font-semibold tabular-nums text-ink">{form.soLinhKien}</span>
                    </div>
                    {form.soDonLienQuan > 0 && (
                      <p className="text-[11px] text-ink-soft sm:col-span-2">
                        Sản phẩm đã có đơn nên không thể xoá (giữ lịch sử đơn). Quản lý hộp game ở mục Nhận hàng trả & kho.
                      </p>
                    )}
                  </FormSection>
                )}

                {message && (
                  <p className={`text-xs font-medium ${message.kind === "ok" ? "text-forest" : "text-destructive"}`}>{message.text}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream bg-cream/40 px-6 py-4">
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
            </>
          )}
        </section>
      </div>
    </>
  );
}

