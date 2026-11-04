"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Info, Landmark, Search, Wallet, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { formatVND } from "@/lib/products";
import type { NhomButToan, WalletLedger } from "@/lib/payments/wallet";

const formatNgay = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));

/** Lý do ghi sổ có kèm mã tài liệu nội bộ, vd "(FR-BH-06)", "(BRU-06)" — không hiển thị cho khách. */
const lyDoHienThi = (lyDo: string) => lyDo.replace(/\s*\((?:FR|BRU|BR|UC)-[^)]*\)/g, "").trim();

const NUT_TRANG =
  "flex h-10 w-10 items-center justify-center border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink";

type Loc = "all" | NhomButToan;

const CHIP: { value: Loc; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "coc", label: "Hoàn cọc đơn" },
  { value: "tien", label: "Hoàn tiền thanh toán" },
  { value: "rut", label: "Rút tiền" },
];

const NGAN_HANG_GOI_Y = ["Vietcombank", "VietinBank", "BIDV", "Agribank", "Techcombank", "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank"];

const INPUT =
  "w-full rounded border border-ink/18 bg-cream px-4 py-3 text-sm text-ink focus:border-wine focus:outline-none";

/** BRU-06 + UC-20: ví điện tử nội bộ — xem số dư, lịch sử cộng/trừ ví và rút tiền về ngân hàng. */
export default function WalletPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [rutOpen, setRutOpen] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loc, setLoc] = useState<Loc>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [ledger, setLedger] = useState<WalletLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tìm kiếm chạy phía server; chờ người dùng ngừng gõ 300ms rồi mới gọi API.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (loc !== "all") params.set("nhom", loc);
      if (debouncedQuery) params.set("q", debouncedQuery);
      const response = await fetch(`/api/wallet?${params}`, { signal: controller.signal });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setError("Không tải được dữ liệu ví, vui lòng thử lại.");
        return;
      }
      setError(null);
      setLedger(await response.json());
    })().catch((err) => {
      if (err.name !== "AbortError") setError("Không tải được dữ liệu ví, vui lòng thử lại.");
    });
    return () => controller.abort();
  }, [router, page, loc, debouncedQuery, reloadKey]);

  // Rút xong: về xem toàn bộ lịch sử trang 1 để thấy ngay dòng vừa ghi, rồi tải lại số dư/sổ cái.
  const handleRutXong = (soTien: number, soDuMoi: number) => {
    setRutOpen(false);
    setThongBao(`Đã gửi yêu cầu rút ${formatVND(soTien)}. Số dư ví còn lại: ${formatVND(soDuMoi)}.`);
    setLoc("all");
    setQuery("");
    setPage(1);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Ví điện tử
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">Ví của bạn</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Tiền cọc và các khoản hoàn lại từ BoardVerse được cộng vào đây.
            </p>
          </div>

          {error && (
            <p role="alert" className="mb-6 rounded border border-wine/25 bg-wine/5 px-4 py-3 text-sm text-wine">
              {error}
            </p>
          )}

          {/* Số dư */}
          <Reveal>
            <section className="relative overflow-hidden rounded bg-wine-deep px-8 py-9 text-cream shadow-[0_20px_40px_-20px_rgba(42,31,26,0.4)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{ background: "radial-gradient(ellipse at 85% 10%, rgba(184,144,63,0.28), transparent 55%)" }}
              />
              <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
                    <Wallet className="h-4 w-4" aria-hidden />
                    Số dư hiện tại
                  </p>
                  <p className="font-heading text-4xl font-bold sm:text-5xl" data-testid="so-du-vi">
                    {ledger ? formatVND(ledger.soDu) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-cream/60">Tổng đã được hoàn</p>
                    <p className="font-heading text-lg">{ledger ? formatVND(ledger.tongHoan) : "—"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setThongBao(null);
                      setRutOpen(true);
                    }}
                    disabled={!ledger || ledger.soDu <= 0}
                    className="inline-flex items-center gap-2 whitespace-nowrap bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-gold/85 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Landmark className="h-4 w-4" aria-hidden />
                    Rút tiền
                  </button>
                </div>
              </div>
            </section>
          </Reveal>

          {/* Vùng thông báo có chiều cao cố định để kết quả rút tiền không đẩy nội dung bên dưới */}
          <div className="mt-4 min-h-[40px]">
            {thongBao ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded border border-forest/30 bg-forest/10 px-4 py-2.5 text-sm text-forest"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {thongBao}
              </p>
            ) : (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Ví nhận tiền hoàn từ hệ thống (hoàn cọc, hoàn tiền thanh toán không tạo được đơn). Bạn có thể rút số dư về
                tài khoản ngân hàng của mình; việc chuyển tiền qua MoMo hiện là giả lập.
              </p>
            )}
          </div>

          {rutOpen && ledger && (
            <RutTienDialog
              soDu={ledger.soDu}
              onClose={() => setRutOpen(false)}
              onDone={handleRutXong}
              onUnauthorized={() => router.push("/login")}
            />
          )}

          {/* Lịch sử */}
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-heading text-lg font-semibold text-ink">Lịch sử giao dịch ví</h2>
              {ledger && <span className="text-xs text-ink-soft">{ledger.total} giao dịch</span>}
            </div>

            {/* Bộ lọc nhóm (có số đếm) + tìm kiếm — xử lý phía server, đổi bộ lọc thì về trang 1 */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại giao dịch">
                {CHIP.map((chip) => {
                  const active = loc === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setLoc(chip.value);
                        setPage(1);
                      }}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? "border-ink bg-ink text-cream"
                          : "border-ink/20 text-ink-soft hover:border-ink/50 hover:text-ink"
                      }`}
                    >
                      {chip.label}
                      <span className={`ml-1.5 tabular-nums ${active ? "text-cream/70" : "text-ink-soft/70"}`}>
                        {ledger ? ledger.dem[chip.value] : "–"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo mã đơn hoặc nội dung…"
                  aria-label="Tìm giao dịch ví"
                  className="w-full rounded border border-ink/18 bg-paper py-2.5 pl-10 pr-3 text-sm text-ink focus:border-wine focus:outline-none"
                />
              </div>
            </div>

            {/* min-h giữ chiều cao ổn định giữa các trang để không nhảy layout */}
            <div
              className={`rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)] ${
                ledger && ledger.totalPages > 1 ? "min-h-[650px]" : "min-h-[360px]"
              }`}
            >
              {!ledger ? (
                <p className="p-8 text-center text-sm text-ink-soft">Đang tải...</p>
              ) : ledger.rows.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 p-8 text-center">
                  <Wallet className="h-8 w-8 text-ink/25" aria-hidden />
                  <p className="font-heading text-base text-ink">
                    {ledger.dem.all === 0 && !debouncedQuery ? "Chưa có giao dịch nào" : "Không có giao dịch khớp bộ lọc"}
                  </p>
                  <p className="max-w-[320px] text-sm font-light text-ink-soft">
                    {ledger.dem.all === 0 && !debouncedQuery
                      ? "Khi bạn được hoàn cọc hoặc hoàn tiền, khoản đó sẽ hiện ở đây."
                      : "Thử đổi loại giao dịch hoặc xoá từ khoá tìm kiếm."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {ledger.rows.map((row) => {
                    const tienRa = row.soTien < 0;
                    return (
                      <li key={row.id} className="flex items-start gap-4 px-6 py-5">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            tienRa ? "bg-wine/12 text-wine" : "bg-forest/15 text-forest"
                          }`}
                        >
                          {tienRa ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownLeft className="h-4 w-4" aria-hidden />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink">{lyDoHienThi(row.lyDo)}</p>
                          <p className="mt-1 text-xs text-ink-soft">
                            {formatNgay(row.ngayTao)}
                            {row.maGiaoDich && <span className="ml-2 font-mono">· {row.maGiaoDich}</span>}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap font-heading text-base font-bold ${tienRa ? "text-wine" : "text-forest"}`}
                        >
                          {tienRa ? "−" : "+"}
                          {formatVND(Math.abs(row.soTien))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {ledger && ledger.totalPages > 1 && (
              <nav className="mt-5 flex items-center justify-center gap-4" aria-label="Phân trang lịch sử ví">
                <button
                  type="button"
                  onClick={() => setPage(ledger.page - 1)}
                  disabled={ledger.page <= 1}
                  aria-label="Trang trước"
                  className={NUT_TRANG}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-ink-soft">
                  Trang {ledger.page} / {ledger.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(ledger.page + 1)}
                  disabled={ledger.page >= ledger.totalPages}
                  aria-label="Trang sau"
                  className={NUT_TRANG}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

/** UC-20 (FR-TTGV-09): nhập số tiền và tài khoản ngân hàng nhận. Hộp thoại phủ lên trang (không đẩy layout); mọi kiểm tra
 * thật (số dư đủ, định dạng) nằm ở server — client chỉ chặn nhanh ô trống/số tiền vượt số dư để đỡ một vòng gọi API. */
function RutTienDialog({
  soDu,
  onClose,
  onDone,
  onUnauthorized,
}: {
  soDu: number;
  onClose: () => void;
  onDone: (soTien: number, soDuMoi: number) => void;
  onUnauthorized: () => void;
}) {
  const [soTien, setSoTien] = useState("");
  const [nganHang, setNganHang] = useState("");
  const [soTaiKhoan, setSoTaiKhoan] = useState("");
  const [tenChuTaiKhoan, setTenChuTaiKhoan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Mã yêu cầu cố định trong suốt vòng đời hộp thoại: bấm đúp hoặc gửi lại sau khi mạng lỗi chỉ trừ ví một lần (server khử trùng).
  const [maYeuCau] = useState(() => crypto.randomUUID());
  // Cờ đồng bộ: `submitting` (state) chỉ đổi sau khi render, không đủ chặn hai cú click liên tiếp.
  const dangGui = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const soTienSo = Number(soTien);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!Number.isInteger(soTienSo) || soTienSo <= 0) {
      setError("Vui lòng nhập số tiền rút hợp lệ (số nguyên, đồng).");
      return;
    }
    if (soTienSo > soDu) {
      setError(`Số tiền rút vượt số dư ví (${formatVND(soDu)}).`);
      return;
    }

    if (dangGui.current) return;
    dangGui.current = true;
    setSubmitting(true);
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ soTien: soTienSo, nganHang, soTaiKhoan, tenChuTaiKhoan, maYeuCau }),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Không gửi được yêu cầu rút tiền, vui lòng thử lại.");
        return;
      }
      onDone(soTienSo, data.soDuMoi);
    } catch {
      setError("Không gửi được yêu cầu rút tiền, vui lòng thử lại.");
    } finally {
      dangGui.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="rut-tien-title"
        onSubmit={handleSubmit}
        className="max-h-full w-full max-w-[460px] overflow-y-auto rounded bg-paper p-7 shadow-[0_30px_60px_-20px_rgba(42,31,26,0.5)]"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="rut-tien-title" className="font-heading text-xl font-semibold text-ink">
              Rút tiền về ngân hàng
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Số dư khả dụng: <span className="font-semibold text-ink">{formatVND(soDu)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Đóng" className="text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="rut-so-tien" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Số tiền muốn rút (đ)
            </label>
            <div className="flex gap-2">
              <input
                id="rut-so-tien"
                type="text"
                inputMode="numeric"
                autoFocus
                required
                value={soTien}
                onChange={(e) => setSoTien(e.target.value.replace(/\D/g, ""))}
                placeholder="VD: 500000"
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => setSoTien(String(soDu))}
                className="shrink-0 whitespace-nowrap border border-ink/25 px-4 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream"
              >
                Rút hết
              </button>
            </div>
            <p className="mt-1 h-4 text-[11px] text-ink-soft">{soTienSo > 0 ? formatVND(soTienSo) : ""}</p>
          </div>

          <div>
            <label htmlFor="rut-ngan-hang" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Ngân hàng nhận
            </label>
            <input
              id="rut-ngan-hang"
              list="rut-ngan-hang-goi-y"
              required
              value={nganHang}
              onChange={(e) => setNganHang(e.target.value)}
              placeholder="VD: Vietcombank"
              className={INPUT}
            />
            <datalist id="rut-ngan-hang-goi-y">
              {NGAN_HANG_GOI_Y.map((ten) => (
                <option key={ten} value={ten} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="rut-so-tai-khoan" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Số tài khoản
            </label>
            <input
              id="rut-so-tai-khoan"
              type="text"
              inputMode="numeric"
              required
              value={soTaiKhoan}
              onChange={(e) => setSoTaiKhoan(e.target.value.replace(/\D/g, ""))}
              placeholder="6–20 chữ số"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="rut-ten-chu" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Tên chủ tài khoản
            </label>
            <input
              id="rut-ten-chu"
              required
              value={tenChuTaiKhoan}
              onChange={(e) => setTenChuTaiKhoan(e.target.value)}
              maxLength={100}
              placeholder="Tên chủ tài khoản nhận, VD: NGUYEN VAN AN"
              className={INPUT}
            />
          </div>
        </div>

        {/* Chỗ báo lỗi giữ chiều cao cố định để nút xác nhận không bị đẩy */}
        <p role="alert" className="mt-3 min-h-[40px] text-sm text-wine">
          {error}
        </p>

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 whitespace-nowrap border border-ink/25 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 disabled:opacity-40"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 whitespace-nowrap bg-wine px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang gửi…" : "Xác nhận rút"}
          </button>
        </div>
      </form>
    </div>
  );
}
