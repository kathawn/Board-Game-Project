"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Clock,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Wallet,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/Reveal";
import { QrMock } from "@/components/payments/QrMock";
import { formatVND } from "@/lib/products";

interface PaymentView {
  id: string;
  soTien: number;
  trangThai: "ChoThanhToan" | "DaThanhToan" | "HetHieuLuc";
  ketQua: "ThanhCong" | "MotPhanHetHang" | "HetHang" | "ThatBai" | "HoanQuaHan" | "SaiSoTien" | null;
  maQr: string;
  hetHanLuc: number;
  lines: { productName: string; startDate: string; endDate: string; tienCoc: number }[];
  orderId: string | null;
  soTienHoan: number;
  dongHetHang: string[];
}

const btnPrimary =
  "bg-wine px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep";
const btnGhost =
  "border border-ink/18 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-wine hover:text-wine";

function KetQua({
  icon,
  tone,
  tieuDe,
  children,
  actions,
}: {
  icon: React.ReactNode;
  tone: string;
  tieuDe: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center sm:px-12">
      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>{icon}</div>
      <h2 className="font-heading text-xl font-semibold text-ink">{tieuDe}</h2>
      <div className="mt-3 max-w-[460px] text-sm leading-relaxed text-ink-soft">{children}</div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">{actions}</div>
    </div>
  );
}

function Countdown({ hetHanLuc }: { hetHanLuc: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const giay = Math.max(0, Math.round((hetHanLuc - now) / 1000));
  return (
    <span className="font-heading text-base font-semibold tabular-nums text-ink">
      {String(Math.floor(giay / 60)).padStart(2, "0")}:{String(giay % 60).padStart(2, "0")}
    </span>
  );
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [soDuVi, setSoDuVi] = useState(0);

  const choThanhToan = payment?.trangThai === "ChoThanhToan";

  // Poll cho đến khi webhook về (FR-TTGV-07: trang không có nút xác nhận thủ công).
  // Dừng poll khi khoản đã ra khỏi ChoThanhToan.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch(`/api/payments/${id}`);
      if (cancelled) return;
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setPayment(data.payment);
      setSoDuVi(data.soDuVi);
      setLoading(false);
    };
    load();
    if (loading || choThanhToan) {
      const timer = setInterval(load, 2000);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [id, router, loading, choThanhToan]);

  const shell = (children: React.ReactNode) => (
    <>
      <Header />
      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[840px]">{children}</div>
      </main>
      <Footer />
    </>
  );

  if (loading) return shell(<p className="text-center text-sm text-ink-soft">Đang tải...</p>);

  if (notFound || !payment) {
    return shell(
      <Reveal className="rounded bg-paper p-12 text-center text-sm text-ink-soft">
        Không tìm thấy khoản thanh toán.{" "}
        <Link href="/cart" className="font-semibold text-wine hover:underline">
          Quay lại giỏ thuê
        </Link>
      </Reveal>,
    );
  }

  return shell(
    <>
      <Reveal className="mb-10 text-center">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Thanh toán
        </span>
        <h1 className="font-heading text-3xl font-semibold text-ink">Thanh toán tiền cọc qua mã QR</h1>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Mã thanh toán <span className="font-semibold text-ink">{payment.id}</span>
        </p>
      </Reveal>

      <Reveal className="overflow-hidden rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
        {payment.trangThai === "ChoThanhToan" && (
          <div className="grid gap-8 p-6 sm:grid-cols-[260px_1fr] sm:p-8">
            <div className="flex flex-col items-center">
              <div className="aspect-square w-full max-w-[260px] rounded border border-ink/10 bg-paper p-2">
                <QrMock value={payment.maQr} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
                <QrCode className="h-3.5 w-3.5" />
                Quét bằng ví MoMo hoặc app ngân hàng hỗ trợ VietQR
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-ink/8 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Số tiền cần thu (tiền cọc)
                </span>
                <span className="font-heading text-2xl font-bold text-wine">{formatVND(payment.soTien)}</span>
              </div>

              <ul className="my-4 flex flex-col gap-2.5">
                {payment.lines.map((l) => (
                  <li key={`${l.productName}-${l.startDate}`} className="flex items-start justify-between gap-4 text-sm">
                    <span>
                      <span className="font-heading font-semibold text-ink">{l.productName}</span>
                      <br />
                      <span className="text-xs text-ink-soft">
                        {l.startDate} → {l.endDate}
                      </span>
                    </span>
                    <span className="shrink-0 text-ink">{formatVND(l.tienCoc)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 rounded bg-cream p-4 text-xs text-ink-soft">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Mã QR hết hiệu lực sau
                  </span>
                  <Countdown hetHanLuc={payment.hetHanLuc} />
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-wine" />
                  Đang chờ MoMo xác nhận thanh toán...
                </div>
                <p className="flex items-start gap-1.5">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                  Hệ thống chỉ xác nhận khi nhận webhook từ cổng thanh toán, không có nút xác nhận thủ công
                  (FR-TTGV-07). Trang này tự cập nhật khi có kết quả.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV !== "production" && (
              <div className="col-span-full rounded border border-dashed border-sky/60 bg-sky/5 p-4 text-xs text-ink-soft">
                <p className="mb-1 font-semibold uppercase tracking-wider text-sky">
                  Giả lập MoMo (chỉ có ở môi trường dev)
                </p>
                Mở{" "}
                <a
                  href={`/mock-momo/${payment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-wine hover:underline"
                >
                  /mock-momo/{payment.id}
                </a>{" "}
                ở tab khác để gửi webhook thay cho việc quét QR thật.
              </div>
            )}
          </div>
        )}

        {payment.trangThai === "DaThanhToan" && payment.ketQua === "HetHang" && (
          <KetQua
            icon={<TriangleAlert className="h-7 w-7" />}
            tone="bg-amber/15 text-amber"
            tieuDe="Sản phẩm đã được người khác đặt trước"
            actions={
              <>
                <Link href="/products" className={btnPrimary}>
                  Chọn sản phẩm / ngày khác
                </Link>
                <Link href="/orders" className={btnGhost}>
                  Xem lịch sử đơn
                </Link>
              </>
            }
          >
            <p>
              <span className="font-semibold text-ink">{payment.dongHetHang.join(", ")}</span> đã được một khách khác
              thanh toán thành công trước bạn. Hệ thống ưu tiên theo thời điểm thanh toán thành công, không giữ chỗ
              trước (BRU-07), nên đơn của bạn không được tạo.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 rounded bg-cream px-4 py-3 text-left">
              <Wallet className="h-5 w-5 shrink-0 text-wine" />
              <p className="text-xs">
                Đã hoàn <span className="font-semibold text-ink">{formatVND(payment.soTienHoan)}</span> vào Ví điện
                tử nội bộ.
                <br />
                Số dư ví hiện tại: <span className="font-semibold text-ink">{formatVND(soDuVi)}</span>
              </p>
            </div>
          </KetQua>
        )}

        {payment.trangThai === "DaThanhToan" && payment.ketQua !== "HetHang" && (
          <KetQua
            icon={<CircleCheck className="h-7 w-7" />}
            tone="bg-forest/15 text-forest"
            tieuDe="Thanh toán thành công"
            actions={
              <>
                <Link href="/orders" className={btnPrimary}>
                  Xem lịch sử đơn
                </Link>
                <Link href="/products" className={btnGhost}>
                  Tiếp tục xem sản phẩm
                </Link>
              </>
            }
          >
            <p>
              Đã nhận <span className="font-semibold text-ink">{formatVND(payment.soTien)}</span> tiền cọc. Đơn thuê{" "}
              <span className="font-semibold text-ink">{payment.orderId}</span> đã được tạo ở trạng thái &quot;Chờ xác
              nhận&quot; và đang chờ nhân viên xác nhận (UC-05).
            </p>
            {payment.ketQua === "MotPhanHetHang" && (
              <div className="mt-4 flex items-center justify-center gap-3 rounded bg-cream px-4 py-3 text-left">
                <Wallet className="h-5 w-5 shrink-0 text-wine" />
                <p className="text-xs">
                  <span className="font-semibold text-ink">{payment.dongHetHang.join(", ")}</span> đã có khách khác
                  thanh toán trước (BRU-07) nên không nằm trong đơn. Đã hoàn{" "}
                  <span className="font-semibold text-ink">{formatVND(payment.soTienHoan)}</span> vào Ví điện tử nội
                  bộ (số dư: <span className="font-semibold text-ink">{formatVND(soDuVi)}</span>).
                </p>
              </div>
            )}
          </KetQua>
        )}

        {payment.trangThai === "HetHieuLuc" && (
          <KetQua
            icon={<Clock className="h-7 w-7" />}
            tone="bg-ink/10 text-ink-soft"
            tieuDe="Mã QR đã hết hiệu lực"
            actions={
              <Link href="/cart" className={btnPrimary}>
                Quay lại giỏ thuê để thử lại
              </Link>
            }
          >
            {payment.ketQua === "HoanQuaHan" ? (
              <>
                <p>
                  MoMo báo đã thu tiền sau khi mã QR hết hiệu lực nên đơn không được tạo. Giỏ thuê của bạn vẫn được
                  giữ nguyên.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3 rounded bg-cream px-4 py-3 text-left">
                  <Wallet className="h-5 w-5 shrink-0 text-wine" />
                  <p className="text-xs">
                    Đã hoàn <span className="font-semibold text-ink">{formatVND(payment.soTienHoan)}</span> vào Ví
                    điện tử nội bộ. Số dư ví hiện tại:{" "}
                    <span className="font-semibold text-ink">{formatVND(soDuVi)}</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                Hệ thống không nhận được xác nhận từ MoMo trong 15 phút kể từ lúc sinh mã. Giỏ thuê của bạn vẫn được
                giữ nguyên và chưa bị trừ tiền. Vui lòng thử lại từ bước thanh toán.
              </>
            )}
          </KetQua>
        )}
      </Reveal>

      {payment.trangThai === "ChoThanhToan" && payment.ketQua === "SaiSoTien" && (
        <Reveal className="mt-4 flex items-start gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Số tiền MoMo thu ({formatVND(payment.soTienHoan)}) không khớp số cần thanh toán (
            {formatVND(payment.soTien)}) nên đơn chưa được tạo. Đã hoàn {formatVND(payment.soTienHoan)} vào Ví điện
            tử nội bộ (số dư: {formatVND(soDuVi)}). Vui lòng quét lại mã QR để thanh toán đúng số tiền.
          </p>
        </Reveal>
      )}

      {payment.trangThai === "ChoThanhToan" && payment.ketQua === "ThatBai" && (
        <Reveal className="mt-4 flex items-start gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Thanh toán thất bại: MoMo báo giao dịch không thành công. Đơn chưa được tạo, giỏ thuê vẫn giữ nguyên và
            bạn chưa bị trừ tiền. Có thể quét lại mã QR trong thời hạn, hoặc{" "}
            <Link href="/cart" className="font-semibold underline">
              quay lại giỏ thuê
            </Link>{" "}
            để sinh mã mới.
          </p>
        </Reveal>
      )}
    </>,
  );
}
