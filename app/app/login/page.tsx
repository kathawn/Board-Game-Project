"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
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
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      router.push("/");
      router.refresh();
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
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              BoardVerse
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">
              {mode === "login" ? "Chào bạn trở lại" : "Tạo tài khoản mới"}
            </h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              {mode === "login"
                ? "Đăng nhập để tiếp tục mua và thuê board game."
                : "Đăng ký bằng email để bắt đầu mượn và mua board game."}
            </p>
          </div>

          <div className="mb-7 flex rounded border border-ink/18 bg-paper p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === "login" ? "bg-wine text-paper" : "text-ink-soft"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === "register" ? "bg-wine text-paper" : "text-ink-soft"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form
            className="flex flex-col gap-3.5 rounded bg-paper p-7 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]"
            onSubmit={handleSubmit}
          >
            {mode === "register" && (
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  placeholder="Họ và tên"
                  required
                  className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="email"
                placeholder="Email"
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>Sai mật khẩu 5 lần sẽ tạm khoá 15 phút.</span>
                <Link href="/forgot-password" className="font-semibold text-wine hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-soft">
            {mode === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-wine hover:underline"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-wine hover:underline"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
