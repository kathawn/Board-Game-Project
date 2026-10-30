"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  PackageCheck,
  Plus,
  QrCode,
  Search,
  Wallet,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { formatVND } from "@/lib/products";
import { TEN_DOI_TAC } from "@/lib/shipping/types";
import {
  donGiaDenBu,
  donGiaPhatMoiNgay,
  soLuongLoiHopLe,
  tinhDenBuSanPham,
  type KetQuaKiemDem,
  type LinhKienChecklist,
} from "@/lib/rentals/settlement";
import type { ReturnLineView, ReturnListPage, ReturnOrderView, ReturnStage } from "@/lib/rentals/returns";

/** UC-08 (kiểm đếm) + UC-07 (quyết toán hoàn cọc) + UC-09 (trạng thái hộp game) cho Staff. Giao diện chỉ hiển thị
 * và gửi lựa chọn kiểm đếm; mọi số tiền chốt ở server (lib/rentals/returns.ts). Danh sách đơn và danh sách hộp game
 * tìm kiếm / lọc / phân trang ở server để dùng được khi có nhiều bản ghi. Chưa có đăng nhập Staff riêng (UC-13) —
 * như /staff/rental-orders, trang tạm mở trực tiếp dưới /staff. */

const KET_QUA_LABEL: Record<KetQuaKiemDem, string> = { Du: "Đủ", Loi: "Thiếu / Hư hỏng" };
const cachTinh = (lk: Pick<LinhKienChecklist, "docBan" | "giaLe">) =>
  lk.docBan ? "100% giá bộ" : lk.giaLe !== null ? "giá lẻ niêm yết" : "20% giá bộ";

const STAGE_LABEL: Record<ReturnStage, { label: string; className: string }> = {
  ChoKiemDem: { label: "Chờ kiểm đếm", className: "bg-gold/15 text-gold" },
  ChoQuyetToan: { label: "Chờ quyết toán", className: "bg-sky/15 text-sky" },
  ChoThuThem: { label: "Chờ thu thêm", className: "bg-destructive/15 text-destructive" },
  ChoVeKho: { label: "Chờ hàng về kho", className: "bg-ink/10 text-ink-soft" },
};
const STAGE_FILTERS: { key: ReturnStage | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "ChoKiemDem", label: "Chờ kiểm đếm" },
  { key: "ChoQuyetToan", label: "Chờ quyết toán" },
  { key: "ChoThuThem", label: "Chờ thu thêm" },
  { key: "ChoVeKho", label: "Chờ về kho" },
];

type BoxStatus = "Available" | "Reserved" | "Rented" | "Checking" | "Damaged" | "Sold";
const BOX_STATUS_CLASS: Record<BoxStatus, string> = {
  Available: "bg-forest/15 text-forest",
  Reserved: "bg-sky/15 text-sky",
  Rented: "bg-gold/15 text-gold",
  Checking: "bg-gold/15 text-gold",
  Damaged: "bg-destructive/15 text-destructive",
  Sold: "bg-ink/10 text-ink-soft",
};
const BOX_STATUSES: BoxStatus[] = ["Available", "Reserved", "Rented", "Checking", "Damaged", "Sold"];

interface BoxView {
  maHop: string;
  tenSanPham: string;
  trangThai: BoxStatus;
  tiepTheo: BoxStatus[];
}
interface BoxPage {
  boxes: BoxView[];
  total: number;
  page: number;
  totalPages: number;
  counts: Record<BoxStatus, number>;
}

interface Draft {
  ketQua: Record<string, KetQuaKiemDem>;
  soLuongLoi: Record<string, number>;
  ghiChu: string;
}

const card = "rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]";
const btnPrimary =
  "flex items-center gap-2 bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60";

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
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active ? "bg-wine text-paper" : "bg-cream text-ink-soft hover:text-ink"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-paper/20" : "bg-ink/10"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Pager({
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
      <span>{total} kết quả</span>
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

function SearchBox({
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

export default function StaffReturnsPage() {
  const [tab, setTab] = useState<"returns" | "boxes">("returns");
  const [loading, setLoading] = useState(true);

  // --- Tab nhận hàng trả ---
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [stage, setStage] = useState<ReturnStage | "all">("all");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ReturnListPage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReturnOrderView | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // --- Tab hộp game ---
  const [bq, setBq] = useState("");
  const [bqApplied, setBqApplied] = useState("");
  const [bStatus, setBStatus] = useState<BoxStatus | "canxuly" | "all">("canxuly");
  const [bPage, setBPage] = useState(1);
  const [boxData, setBoxData] = useState<BoxPage | null>(null);
  const [boxNeed, setBoxNeed] = useState(0);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bqTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ q: qApplied, stage, page: String(page) });
    const response = await fetch(`/api/staff/returns?${params}`);
    const data: ReturnListPage = await response.json();
    setList(data);
    // Chỉ tự chọn đơn đầu tiên khi chưa chọn gì; đơn đã chọn giữ nguyên kể cả khi rời khỏi danh sách (vd. vừa đóng).
    setSelectedId((cur) => cur ?? data.orders[0]?.id ?? null);
  }, [qApplied, stage, page]);

  const loadDetail = useCallback(async (id: string | null) => {
    if (!id) {
      setDetail(null);
      return;
    }
    const response = await fetch(`/api/staff/returns/${id}`);
    const data = await response.json();
    setDetail(response.ok ? data.order : null);
  }, []);

  const loadBoxes = useCallback(async () => {
    const params = new URLSearchParams({ q: bqApplied, trangThai: bStatus, page: String(bPage) });
    const response = await fetch(`/api/staff/boxes?${params}`);
    const data: BoxPage = await response.json();
    setBoxData(data);
    if (!bqApplied) setBoxNeed(data.counts.Checking + data.counts.Damaged);
  }, [bqApplied, bStatus, bPage]);

  useEffect(() => {
    (async () => {
      await loadList();
      setLoading(false);
    })();
  }, [loadList]);
  useEffect(() => {
    (async () => {
      await loadDetail(selectedId);
    })();
  }, [selectedId, loadDetail]);
  useEffect(() => {
    (async () => {
      await loadBoxes();
    })();
  }, [loadBoxes]);

  const refresh = async () => {
    await Promise.all([loadList(), loadDetail(selectedId), loadBoxes()]);
  };

  const setErr = (key: string, msg: string) => setError((p) => ({ ...p, [key]: msg }));

  const call = async (key: string, url: string, body?: unknown) => {
    setErr(key, "");
    setBusy(key);
    try {
      const response = await fetch(url, {
        method: "POST",
        ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        setErr(key, data.error ?? "Đã có lỗi xảy ra.");
        return null;
      }
      await refresh();
      return data;
    } finally {
      setBusy(null);
    }
  };

  const onSearch = (v: string) => {
    setQ(v);
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => {
      setQApplied(v.trim());
      setPage(1);
    }, 300);
  };
  const onBoxSearch = (v: string) => {
    setBq(v);
    if (bqTimer.current) clearTimeout(bqTimer.current);
    bqTimer.current = setTimeout(() => {
      setBqApplied(v.trim());
      setBPage(1);
    }, 300);
  };

  const draftOf = (line: ReturnLineView): Draft =>
    drafts[line.chiTietDonId] ?? { ketQua: {}, soLuongLoi: {}, ghiChu: "" };
  const patchDraft = (line: ReturnLineView, patch: Partial<Draft>) =>
    setDrafts((p) => ({ ...p, [line.chiTietDonId]: { ...draftOf(line), ...patch } }));

  const handleInspect = (o: ReturnOrderView, line: ReturnLineView) => {
    const dr = draftOf(line);
    return call(`inspect:${line.chiTietDonId}`, `/api/staff/returns/${o.id}/inspect`, {
      chiTietDonId: line.chiTietDonId,
      ghiChuNgoai: dr.ghiChu,
      items: line.checklist.map((lk) => ({
        linhKienId: lk.id,
        ketQua: dr.ketQua[lk.id] ?? "Du",
        soLuongLoi: dr.soLuongLoi[lk.id],
      })),
    });
  };

  /** Xem trước tổng đền bù của một sản phẩm khi Staff đang đánh dấu (cùng công thức server). */
  const previewDenBu = (line: ReturnLineView) => {
    const dr = draftOf(line);
    const items = line.checklist.map((lk) => {
      const kq = dr.ketQua[lk.id] ?? "Du";
      return { soLuongLoi: soLuongLoiHopLe(lk, kq, dr.soLuongLoi[lk.id]), donGiaDenBu: donGiaDenBu(line.giaNiemYet, lk) };
    });
    return tinhDenBuSanPham(line.giaNiemYet, items);
  };

  // ---------------------------------------------------------------- Chi tiết một đơn
  const renderDetail = (order: ReturnOrderView) => {
    const inspectionDone = order.lines.every((l) => l.bienBan);
    const qt = order.quyetToan;
    const thieuTien = (qt?.soTienThuThem ?? 0) > 0;
    const daQuyetToan = order.trangThai === "Completed" || order.phieu !== null;
    const kqPhieu = order.phieu?.quyetToan ?? qt;

    return (
      <div className="flex flex-col gap-8">
        <article className={`${card} p-5`}>
          <h2 className="font-heading text-base font-semibold text-ink">
            {order.id} <span className="text-sm font-normal text-ink-soft">· {order.email}</span>
          </h2>
          <p className="mt-1 text-xs text-ink-soft">Địa chỉ lấy hàng trả: {order.diaChiTra}</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-soft">
            {order.lines.map((l) => (
              <li key={l.chiTietDonId}>
                {l.tenSanPham} · vận đơn chiều trả{" "}
                {l.tra ? (
                  <>
                    {TEN_DOI_TAC[l.tra.doiTac]} {l.tra.maVanDon} ·{" "}
                    {l.tra.trangThai === "DaLay" ? (
                      <span className="font-semibold text-forest">Đã lấy — hàng về kho {l.ngayTra}</span>
                    ) : (
                      <span className="font-semibold text-gold">Đang lấy — chờ hàng về kho (UC-12)</span>
                    )}
                  </>
                ) : (
                  "chưa có"
                )}
              </li>
            ))}
          </ul>
        </article>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            <ClipboardCheck className="h-4 w-4" /> Bước 1 — Kiểm đếm linh kiện (UC-08)
          </h2>
          <div className="flex flex-col gap-4">
            {order.lines.map((l) => {
              const done = l.bienBan;
              const dr = draftOf(l);
              const veKho = l.tra?.trangThai === "DaLay";
              const key = `inspect:${l.chiTietDonId}`;
              const preview = previewDenBu(l);
              const bbByLk = new Map(done?.items.map((i) => [i.linhKienId, i]));
              const hasIssue = done ? done.coLoi : l.checklist.some((lk) => dr.ketQua[lk.id] === "Loi");
              const tongHienThi = done ? tinhDenBuSanPham(l.giaNiemYet, done.items) : preview;

              return (
                <article key={l.chiTietDonId} className={`${card} p-5`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-ink">{l.tenSanPham}</h3>
                      <p className="text-xs text-ink-soft">
                        Giá niêm yết bộ {formatVND(l.giaNiemYet)} · hạn trả {l.ngayKetThuc}
                        {l.ngayTra && <> · hàng về kho {l.ngayTra}</>}
                        {l.soNgayTre > 0 && (
                          <span className="font-semibold text-destructive"> · trễ {l.soNgayTre} ngày</span>
                        )}
                      </p>
                    </div>
                    {done ? (
                      <span className="rounded-full bg-forest/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-forest">
                        Đã kiểm đếm {done.ngayLap}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">
                        Hộp xuất kho cho đơn này:{" "}
                        <span className="font-semibold text-ink">{l.maHop ?? "chưa ghi nhận"}</span>
                      </span>
                    )}
                  </div>

                  <div className="hidden grid-cols-[minmax(0,1fr)_56px_100px_250px_190px] gap-3 border-b border-cream pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft md:grid">
                    <span>Linh kiện</span>
                    <span className="text-right">SL bộ</span>
                    <span className="text-right">Đơn giá đền</span>
                    <span className="text-center">Kết quả (SL thiếu/hỏng)</span>
                    <span className="text-center">Thành tiền</span>
                  </div>
                  <ul className="divide-y divide-cream">
                    {l.checklist.map((lk) => {
                      const saved = bbByLk.get(lk.id);
                      const kq: KetQuaKiemDem = saved ? saved.ketQua : (dr.ketQua[lk.id] ?? "Du");
                      const donGia = saved ? saved.donGiaDenBu : donGiaDenBu(l.giaNiemYet, lk);
                      const sl = saved ? saved.soLuongLoi : soLuongLoiHopLe(lk, kq, dr.soLuongLoi[lk.id]);
                      return (
                        <li
                          key={lk.id}
                          className="grid min-h-[3.75rem] grid-cols-2 items-center gap-x-3 gap-y-2 py-2.5 md:grid-cols-[minmax(0,1fr)_56px_100px_250px_190px]"
                        >
                          <span className="col-span-2 text-sm text-ink md:col-span-1">
                            {lk.ten}
                            {lk.docBan && (
                              <span className="ml-2 rounded bg-wine/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-wine">
                                Độc bản
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-ink-soft md:text-right">
                            <span className="md:hidden">SL bộ: </span>
                            {lk.soLuong}
                          </span>
                          <span className="text-right text-xs text-ink-soft">
                            {formatVND(donGia)}
                            <span className="block text-[10px] uppercase tracking-wider">{cachTinh(lk)}</span>
                          </span>
                          <div className="col-span-2 flex items-center justify-center gap-1.5 whitespace-nowrap md:col-span-1">
                            {(["Du", "Loi"] as KetQuaKiemDem[]).map((v) => (
                              <button
                                key={v}
                                type="button"
                                disabled={Boolean(done) || !veKho}
                                onClick={() => patchDraft(l, { ketQua: { ...dr.ketQua, [lk.id]: v } })}
                                className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 ${
                                  kq === v
                                    ? v === "Du"
                                      ? "bg-forest text-paper"
                                      : "bg-destructive text-paper"
                                    : "bg-cream text-ink-soft hover:text-ink"
                                }`}
                              >
                                {KET_QUA_LABEL[v]}
                              </button>
                            ))}
                            {/* Chỗ cho ô số lượng luôn được giữ (kể cả khi ẩn) để các nút không bị dịch chuyển. */}
                            <span className="inline-block h-7 w-14 shrink-0">
                              {kq === "Loi" && !lk.docBan && (
                                <input
                                  type="number"
                                  min={1}
                                  max={lk.soLuong}
                                  disabled={Boolean(done)}
                                  value={sl}
                                  onChange={(e) =>
                                    patchDraft(l, {
                                      soLuongLoi: { ...dr.soLuongLoi, [lk.id]: Number(e.target.value) || 1 },
                                    })
                                  }
                                  aria-label={`Số lượng ${lk.ten} thiếu/hư hỏng`}
                                  className="h-7 w-14 border-b border-ink/30 bg-transparent px-1 py-0.5 text-center text-xs text-ink outline-none focus:border-wine"
                                />
                              )}
                            </span>
                          </div>
                          <span
                            className={`col-span-2 whitespace-nowrap text-center text-sm font-semibold md:col-span-1 ${
                              sl > 0 ? "text-destructive" : "text-ink-soft"
                            }`}
                          >
                            {sl > 0 ? `${sl} × ${formatVND(donGia)} = ${formatVND(sl * donGia)}` : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 pt-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                      Tổng khách phải đền cho linh kiện thiếu/hư hỏng (BRU-04)
                      {tongHienThi.tongTho > tongHienThi.denBu && (
                        <span className="ml-2 font-normal normal-case tracking-normal text-ink-soft">
                          (tổng {formatVND(tongHienThi.tongTho)}, giới hạn tối đa 100% giá bộ)
                        </span>
                      )}
                    </span>
                    <span
                      className={`font-heading text-lg font-bold ${tongHienThi.denBu > 0 ? "text-destructive" : "text-ink-soft"}`}
                    >
                      {tongHienThi.denBu > 0 ? formatVND(tongHienThi.denBu) : "0đ"}
                    </span>
                  </div>

                  {done ? (
                    done.ghiChuNgoai && (
                      <p className="mt-3 text-xs text-ink-soft">
                        Linh kiện ngoài checklist (ghi chú thủ công): {done.ghiChuNgoai}
                      </p>
                    )
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-ink-soft" />
                      <input
                        type="text"
                        disabled={!veKho}
                        value={dr.ghiChu}
                        onChange={(e) => patchDraft(l, { ghiChu: e.target.value })}
                        placeholder="Linh kiện ngoài checklist gốc — ghi chú thủ công (luồng ngoại lệ 2a)"
                        className="w-full border-b border-ink/15 bg-transparent py-1.5 text-xs text-ink outline-none placeholder:text-ink-soft/70 focus:border-wine"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink-soft">
                      {done
                        ? done.coLoi
                          ? `Biên bản đã lưu → hộp ${done.maHop ?? ""} chuyển Damaged.`
                          : `Biên bản đã lưu → hộp ${done.maHop ?? ""} chuyển Available.`
                        : !veKho
                          ? "Chờ giao vận lấy xong hàng trả (hàng về kho) mới kiểm đếm được."
                          : !l.maHop
                            ? "Dòng đơn chưa ghi hộp game xuất kho (bàn giao trước khi có cột mã hộp) — cần gán mã hộp trước."
                            : "Lưu biên bản để cập nhật trạng thái hộp: đủ → Available, thiếu/hư hỏng → Damaged."}
                    </p>
                    {!done && (
                      <button
                        type="button"
                        disabled={!veKho || !l.maHop || busy === key}
                        onClick={() => handleInspect(order, l)}
                        className={btnPrimary}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {busy === key
                          ? "Đang lưu..."
                          : hasIssue
                            ? "Lưu biên bản (có thiếu/hư hỏng)"
                            : "Lưu biên bản kiểm đếm"}
                      </button>
                    )}
                  </div>
                  {error[key] && <p className="mt-3 text-xs font-medium text-destructive">{error[key]}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            <Wallet className="h-4 w-4" /> Bước 2 — Quyết toán hoàn cọc (UC-07)
          </h2>

          {!kqPhieu || (!inspectionDone && !daQuyetToan) ? (
            <div className={`${card} p-8 text-center text-sm text-ink-soft`}>
              {order.chuaQuyetToanDuoc ??
                "Cần hoàn tất và lưu biên bản kiểm đếm (UC-08) cho mọi sản phẩm trong đơn trước khi quyết toán."}
            </div>
          ) : (
            <article className={`${card} p-5`}>
              <div className="mb-3 flex justify-between border-b border-cream pb-3 text-sm">
                <span className="text-ink-soft">Tiền cọc đã thu (BRU-01: giá niêm yết + ship × 2)</span>
                <span className="font-semibold text-ink">{formatVND(kqPhieu.tongCocDaThu)}</span>
              </div>

              {kqPhieu.dong.map((r) => (
                <div key={r.tenSanPham} className="mb-5">
                  <h3 className="mb-2 font-heading text-sm font-semibold text-ink">{r.tenSanPham}</h3>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Khoản mục</span>
                    <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                      Đơn giá
                    </span>
                    <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-ink-soft">SL</span>
                    <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                      Thành tiền
                    </span>

                    <span className="text-ink-soft">Phạt trễ hạn — 15%/ngày, trần 100% (BRU-03)</span>
                    <span className="text-right text-ink-soft">{formatVND(donGiaPhatMoiNgay(r.giaNiemYet))}/ngày</span>
                    <span className="text-right text-ink-soft">{r.soNgayTre} ngày</span>
                    <span className={`text-right font-semibold ${r.phat > 0 ? "text-destructive" : "text-ink-soft"}`}>
                      {r.phat > 0 ? `− ${formatVND(r.phat)}` : "0đ"}
                    </span>

                    <span className="font-semibold text-ink">Tổng đền bù linh kiện (BRU-04)</span>
                    <span />
                    <span />
                    <span className={`text-right font-semibold ${r.denBu > 0 ? "text-destructive" : "text-ink-soft"}`}>
                      {r.denBu > 0 ? `− ${formatVND(r.denBu)}` : "0đ"}
                    </span>
                    {r.denBuTho > r.denBu && (
                      <span className="col-span-4 text-ink-soft">
                        (cộng dồn {formatVND(r.denBuTho)}, giới hạn tối đa 100% giá bộ {formatVND(r.giaNiemYet)})
                      </span>
                    )}

                    <span className="text-ink-soft">Chênh lệch ship chiều trả (FR-TTGV-08)</span>
                    <span className="text-right text-ink-soft">
                      giữ {formatVND(r.shipGiuChieuTra)} / thực tế {formatVND(r.phiShipTraThucTe)}
                    </span>
                    <span />
                    <span className={`text-right font-semibold ${r.chenhShip >= 0 ? "text-forest" : "text-destructive"}`}>
                      {r.chenhShip >= 0 ? "+ " : "− "}
                      {formatVND(Math.abs(r.chenhShip))}
                    </span>
                  </div>
                </div>
              ))}

              <dl className="flex flex-col gap-2 border-t border-cream pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Tổng phạt trễ hạn (FR-CT-06)</dt>
                  <dd className="font-semibold text-destructive">− {formatVND(kqPhieu.tongPhat)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Tổng đền bù linh kiện</dt>
                  <dd className="font-semibold text-destructive">− {formatVND(kqPhieu.tongDenBu)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Tổng chênh lệch ship</dt>
                  <dd className={`font-semibold ${kqPhieu.tongChenhShip >= 0 ? "text-forest" : "text-destructive"}`}>
                    {kqPhieu.tongChenhShip >= 0 ? "+ " : "− "}
                    {formatVND(Math.abs(kqPhieu.tongChenhShip))}
                  </dd>
                </div>
                <div className="mt-2 flex items-end justify-between border-t border-cream pt-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                    {kqPhieu.soTienThuThem > 0 ? "Khách còn phải trả thêm" : "Số tiền hoàn cọc"} (FR-CT-07)
                  </dt>
                  <dd
                    className={`font-heading text-2xl font-bold ${kqPhieu.soTienThuThem > 0 ? "text-destructive" : "text-wine"}`}
                  >
                    {formatVND(Math.abs(kqPhieu.ketQuaCuoi))}
                  </dd>
                </div>
              </dl>

              {!daQuyetToan && thieuTien && (
                <p className="mt-4 flex items-start gap-2 rounded bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Tổng phạt/đền bù/ship vượt tiền cọc đã thu — hệ thống không trừ âm, sẽ sinh mã QR thu thêm (UC-10).
                </p>
              )}
              {!daQuyetToan && !thieuTien && kqPhieu.ketQuaCuoi === 0 && (
                <p className="mt-4 text-xs text-ink-soft">
                  Hoàn cọc 0đ — vẫn lập phiếu xác nhận để lưu vết (luồng thay thế 5a).
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-soft">
                  {daQuyetToan
                    ? order.phieu?.xuLy === "ThuThem"
                      ? "Đã lập phiếu — đơn Completed, chờ khách thanh toán khoản thu thêm."
                      : "Đã lập phiếu và cộng vào Ví điện tử nội bộ của khách (BRU-06). Đơn: Completed → Closed."
                    : thieuTien
                      ? "Xác nhận sẽ sinh mã QR thu thêm."
                      : "Xác nhận sẽ cộng tiền hoàn vào Ví điện tử nội bộ của khách."}
                </p>
                {!daQuyetToan && (
                  <button
                    type="button"
                    disabled={busy === `settle:${order.id}`}
                    onClick={() => call(`settle:${order.id}`, `/api/staff/returns/${order.id}/settle`)}
                    className={btnPrimary}
                  >
                    {thieuTien ? <QrCode className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
                    {busy === `settle:${order.id}`
                      ? "Đang xử lý..."
                      : thieuTien
                        ? "Xác nhận & sinh QR thu thêm"
                        : "Xác nhận hoàn cọc"}
                  </button>
                )}
              </div>
              {error[`settle:${order.id}`] && (
                <p className="mt-3 text-xs font-medium text-destructive">{error[`settle:${order.id}`]}</p>
              )}

              {daQuyetToan && order.thuThem && (
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded bg-cream p-4">
                  <div className="flex h-16 w-16 items-center justify-center bg-ink text-paper">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div className="text-xs text-ink-soft">
                    Khoản thu thêm <span className="font-semibold text-ink">{formatVND(order.thuThem.soTien)}</span> · mã{" "}
                    <span className="font-semibold text-ink">{order.thuThem.maThanhToan}</span> ·{" "}
                    {order.thuThem.trangThai === "DaThanhToan"
                      ? "khách đã thanh toán"
                      : order.thuThem.trangThai === "HetHieuLuc"
                        ? "QR đã hết hạn"
                        : "đang chờ khách thanh toán"}
                    <p className="mt-1">
                      Khách thanh toán tại{" "}
                      <Link href={`/pay/${order.thuThem.maThanhToan}`} className="font-semibold text-wine hover:underline">
                        /pay/{order.thuThem.maThanhToan}
                      </Link>
                      {process.env.NODE_ENV !== "production" && (
                        <>
                          {" "}
                          · giả lập MoMo:{" "}
                          <Link
                            href={`/mock-momo/${order.thuThem.maThanhToan}`}
                            className="font-semibold text-wine hover:underline"
                          >
                            /mock-momo/{order.thuThem.maThanhToan}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  {order.thuThem.trangThai === "HetHieuLuc" && (
                    <button
                      type="button"
                      disabled={busy === `again:${order.id}`}
                      onClick={() => call(`again:${order.id}`, `/api/staff/returns/${order.id}/collect-again`)}
                      className="bg-wine px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper hover:bg-wine-deep disabled:opacity-60"
                    >
                      Sinh lại QR
                    </button>
                  )}
                  {error[`again:${order.id}`] && (
                    <p className="w-full text-xs font-medium text-destructive">{error[`again:${order.id}`]}</p>
                  )}
                </div>
              )}
            </article>
          )}
        </section>
      </div>
    );
  };

  // ---------------------------------------------------------------- Tab: nhận hàng trả
  const returnsTab = (
    <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={`${card} flex flex-col gap-3 p-4 xl:sticky xl:top-28`}>
        <SearchBox value={q} onChange={onSearch} placeholder="Tìm mã đơn, email, sản phẩm..." />
        <div className="flex flex-wrap gap-1.5">
          {STAGE_FILTERS.map((f) => (
            <Chip
              key={f.key}
              active={stage === f.key}
              count={list?.counts[f.key]}
              onClick={() => {
                setStage(f.key);
                setPage(1);
              }}
            >
              {f.label}
            </Chip>
          ))}
        </div>

        {!list || list.orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">
            {qApplied || stage !== "all"
              ? "Không có đơn nào khớp bộ lọc."
              : "Chưa có đơn nào đang chờ nhận hàng trả. Đơn xuất hiện sau khi khách yêu cầu giao vận đến lấy hàng trả (UC-11)."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-cream xl:max-h-[calc(100vh-24rem)] xl:overflow-y-auto">
            {list.orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={`flex w-full flex-col gap-1 border-l-4 px-3 py-2.5 text-left transition-colors ${
                    o.id === selectedId ? "border-wine bg-cream" : "border-transparent hover:bg-cream/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {o.id}
                      {o.trangThai === "Overdue" && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                          Quá hạn
                        </span>
                      )}
                    </span>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STAGE_LABEL[o.stage].className}`}
                    >
                      {STAGE_LABEL[o.stage].label}
                    </span>
                  </span>
                  <span className="truncate text-xs text-ink-soft">
                    {o.email} · {o.sanPham}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {list && list.total > 0 && (
          <Pager page={list.page} totalPages={list.totalPages} total={list.total} onPage={setPage} />
        )}
      </aside>

      <div className="min-w-0">
        {detail ? (
          renderDetail(detail)
        ) : (
          <div className={`${card} p-10 text-center text-sm text-ink-soft`}>
            {list && list.total === 0 ? "Không có đơn để hiển thị." : "Chọn một đơn ở danh sách bên trái để xử lý."}
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------- Tab: hộp game
  const boxFilters: { key: BoxStatus | "canxuly" | "all"; label: string; count?: number }[] = [
    { key: "canxuly", label: "Cần xử lý", count: boxData ? boxData.counts.Checking + boxData.counts.Damaged : undefined },
    { key: "all", label: "Tất cả", count: boxData ? BOX_STATUSES.reduce((s, t) => s + boxData.counts[t], 0) : undefined },
    ...BOX_STATUSES.map((t) => ({ key: t, label: t, count: boxData?.counts[t] })),
  ];

  const boxesTab = (
    <div className={`${card} flex flex-col gap-4 p-5`}>
      <p className="text-xs text-ink-soft">
        UC-09 / FR-KHO-02: đổi trạng thái hộp game theo State Machine (SRS Hình 3.7). Hộp Damaged chỉ trả về Available
        sau khi đơn liên quan đã quyết toán xong đền bù.
      </p>
      <SearchBox value={bq} onChange={onBoxSearch} placeholder="Tìm mã hộp hoặc tên sản phẩm..." />
      <div className="flex flex-wrap gap-1.5">
        {boxFilters.map((f) => (
          <Chip
            key={f.key}
            active={bStatus === f.key}
            count={f.count}
            onClick={() => {
              setBStatus(f.key);
              setBPage(1);
            }}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {!boxData || boxData.boxes.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">
          {bStatus === "canxuly" && !bqApplied
            ? "Không có hộp game nào đang Checking / Damaged."
            : "Không có hộp game nào khớp bộ lọc."}
        </p>
      ) : (
        <ul className="divide-y divide-cream">
          {boxData.boxes.map((b) => (
            <li key={b.maHop} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-ink">
                <span className="w-48 shrink-0 font-semibold">{b.maHop}</span>
                <span className="min-w-0 truncate">{b.tenSanPham}</span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${BOX_STATUS_CLASS[b.trangThai]}`}
                >
                  {b.trangThai}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {b.tiepTheo.length === 0 && <span className="text-xs text-ink-soft">Không còn trạng thái tiếp theo</span>}
                {b.tiepTheo.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={busy === `box:${b.maHop}`}
                    onClick={() => call(`box:${b.maHop}`, "/api/staff/boxes", { maHop: b.maHop, trangThai: t })}
                    className="bg-wine px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
                  >
                    → {t}
                    {t === "Available" && b.trangThai === "Damaged" ? " (đã xử lý đền bù)" : ""}
                  </button>
                ))}
              </span>
              {error[`box:${b.maHop}`] && (
                <p className="w-full text-xs font-medium text-destructive sm:basis-full">{error[`box:${b.maHop}`]}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {boxData && boxData.total > 0 && (
        <Pager page={boxData.page} totalPages={boxData.totalPages} total={boxData.total} onPage={setBPage} />
      )}
    </div>
  );

  return (
    <>
      <Header />
      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mb-6 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Nội bộ — Nhân viên
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">Nhận hàng trả &amp; kho</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              UC-08 kiểm đếm → UC-07 phạt, đền bù, hoàn cọc → UC-09 trạng thái hộp game.
            </p>
          </Reveal>

          <div role="tablist" className="mb-6 flex gap-2 border-b border-ink/10">
            {(
              [
                { key: "returns", label: "Nhận hàng trả", icon: PackageCheck, badge: list?.counts.all },
                { key: "boxes", label: "Hộp game", icon: Boxes, badge: boxNeed },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  tab === t.key ? "border-wine text-wine" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="rounded-full bg-wine px-1.5 text-[10px] tabular-nums text-paper">{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? <p className="text-center text-sm text-ink-soft">Đang tải...</p> : tab === "returns" ? returnsTab : boxesTab}
        </div>
      </main>
      <Footer />
    </>
  );
}
