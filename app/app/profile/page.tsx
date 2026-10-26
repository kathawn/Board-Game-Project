"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, MapPin, Phone, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      setEmail(data.profile.email);
      setHoTen(data.profile.hoTen);
      setSdt(data.profile.sdt);
      setDiaChi(data.profile.diaChi);
      setLoading(false);
    })();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hoTen, sdt, diaChi }),
      });
      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      setProfileMessage("Đã lưu thông tin cá nhân.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!matKhauCu || !matKhauMoi) {
      setPasswordError("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword: matKhauCu, newPassword: matKhauMoi }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      setPasswordMessage("Đã đổi mật khẩu.");
      setMatKhauCu("");
      setMatKhauMoi("");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-cream px-5 pt-32">
          <p className="text-sm text-ink-soft">Đang tải...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-[640px]">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Hồ sơ cá nhân
            </span>
            <h1 className="font-heading text-3xl font-semibold text-ink">
              Thông tin của bạn
            </h1>
            <p className="mt-2 text-sm font-light text-ink-soft">
              Cập nhật họ tên, số điện thoại, địa chỉ nhận/trả hàng và mật khẩu đăng nhập.
            </p>
          </div>

          {/* FORM THÔNG TIN CÁ NHÂN */}
          <form
            className="mb-8 flex flex-col gap-3.5 rounded bg-paper p-7 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]"
            onSubmit={handleSaveProfile}
          >
            <h2 className="mb-1 font-heading text-lg font-semibold text-ink">
              Thông tin cá nhân
            </h2>

            <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Email
            </label>
            <div className="rounded border border-ink/12 bg-cream/60 px-4 py-3.5 text-sm text-ink-soft">
              {email}
            </div>

            <label className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Họ và tên
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                required
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </div>

            <label className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="tel"
                required
                value={sdt}
                onChange={(e) => setSdt(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </div>

            <label className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Địa chỉ nhận/trả hàng
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                required
                value={diaChi}
                onChange={(e) => setDiaChi(e.target.value)}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-11 pr-4 text-sm text-ink focus:border-wine focus:outline-none"
              />
            </div>
            <p className="text-xs text-ink-soft">
              Địa chỉ này sẽ được dùng làm mặc định khi đặt mua/đặt thuê sau này; bạn vẫn có thể
              sửa riêng cho từng đơn.
            </p>

            {profileError && (
              <p className="text-xs font-medium text-destructive">{profileError}</p>
            )}
            {profileMessage && (
              <p className="text-xs font-medium text-forest">{profileMessage}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-2 w-full bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep disabled:opacity-60"
            >
              {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>

          {/* FORM ĐỔI MẬT KHẨU */}
          <form
            className="flex flex-col gap-3.5 rounded bg-paper p-7 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]"
            onSubmit={handleChangePassword}
          >
            <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
              <KeyRound className="h-4 w-4 text-wine" />
              Đổi mật khẩu
            </h2>

            <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                required
                value={matKhauCu}
                onChange={(e) => setMatKhauCu(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-4 pr-11 text-sm text-ink focus:border-wine focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                aria-label={showOld ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <label className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={matKhauMoi}
                onChange={(e) => setMatKhauMoi(e.target.value)}
                className="w-full rounded border border-ink/18 bg-cream py-3.5 pl-4 pr-11 text-sm text-ink focus:border-wine focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs font-medium text-destructive">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="text-xs font-medium text-forest">{passwordMessage}</p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="mt-2 w-full border border-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-wine transition-colors hover:bg-wine hover:text-paper disabled:opacity-60"
            >
              {savingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
