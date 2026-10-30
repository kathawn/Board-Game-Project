"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/** SCR-08 / UC-13 (FR-ADM-01): đăng nhập nội bộ Staff/Admin, tách khỏi /login của khách. Gọi POST /api/staff/login
 * (xác thực theo bảng NhanVien, cookie riêng) rồi chuyển Admin về trang quản lý sản phẩm, Staff về trang đơn thuê. */
export default function StaffLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      router.push(data.vaiTro === "Admin" ? "/admin/products" : "/staff/rental-orders");
    } catch {
      setError("Không kết nối được máy chủ, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex min-h-screen items-center justify-center bg-cream px-5 pb-16 pt-32 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Khu vực nội bộ
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">Đăng nhập nhân viên</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Dành cho Staff và Admin của BoardVerse. Tài khoản khách hàng không dùng được ở đây.
            </p>
          </div>

          <form
            className="flex flex-col gap-3.5 rounded bg-paper p-7 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]"
            onSubmit={handleSubmit}
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="email"
                placeholder="Email nội bộ"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-11 text-sm text-ink focus:border-wine focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Chừa sẵn chỗ cho thông báo lỗi để nút không bị đẩy xuống khi lỗi xuất hiện. */}
            <p className="min-h-[1rem] text-xs font-medium text-destructive">{error}</p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

        </div>
      </main>

      <Footer />
    </>
  );
}
