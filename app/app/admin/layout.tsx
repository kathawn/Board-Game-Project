"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Package, Tag, ChartColumn, Menu, X } from "lucide-react";

/** MOCKUP — khung dùng chung cho toàn bộ khu vực Admin (UC-13/15/16): một lần đăng nhập nội bộ, một
 * sidebar duy nhất dẫn tới mọi công cụ (Dashboard tổng quan, Sản phẩm & giá, Báo cáo chi tiết) thay vì
 * mỗi trang tự vẽ Header/Footer của khách như trước. Staff (không phải Admin) bị chặn ngay ở đây —
 * từng trang con không cần tự kiểm tra lại quyền. */

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Sản phẩm & giá", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: Tag },
  { href: "/admin/reports", label: "Báo cáo chi tiết", icon: ChartColumn },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<{ email: string; hoTen: string; vaiTro: string } | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/staff/me");
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.vaiTro !== "Admin") setForbidden(true);
        setMe(data);
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
  };

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-5">
        <div className="max-w-[420px] rounded bg-paper p-8 text-center shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
          <h1 className="mb-2 font-heading text-xl text-ink">Không đủ quyền truy cập</h1>
          <p className="mb-5 text-sm text-ink-soft">
            Khu vực quản trị (sản phẩm, giá, báo cáo) chỉ dành cho tài khoản Admin. Tài khoản Staff của bạn chỉ vào
            được khu vực xử lý đơn.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-wine px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-wine-deep"
          >
            Đăng nhập tài khoản khác
          </button>
        </div>
      </main>
    );
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[240px_1fr]">
      {/* ===== Sidebar (desktop cố định, mobile ẩn sau nút) ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-ink text-cream transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Link href="/admin" className="font-heading text-lg font-bold tracking-tight text-cream">
            Board<span className="text-gold">Verse</span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="text-cream/70 lg:hidden" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-6 pb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40">Quản trị hệ thống</p>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href, exact) ? "bg-cream/10 text-cream" : "text-cream/65 hover:bg-cream/5 hover:text-cream"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-cream/10 px-6 py-4">
          <p className="truncate text-xs font-medium text-cream">{me?.hoTen ?? ""}</p>
          <p className="truncate text-[11px] text-cream/50">{me?.email ?? ""}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-cream/70 hover:text-cream"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        />
      )}

      {/* ===== Nội dung ===== */}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 border-b border-ink/10 bg-paper px-5 py-3 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu" className="text-ink">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-heading text-base font-bold text-ink">
            Board<span className="text-wine">Verse</span> — Admin
          </span>
        </header>
        <main className="flex-1 px-5 pb-16 pt-8 sm:px-8 lg:pt-10">
          <div className="mx-auto max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
