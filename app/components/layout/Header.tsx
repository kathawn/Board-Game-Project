"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ShoppingCart, User, Settings, LogOut, Receipt, Menu, X, Wallet, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";

const NAV_LINKS = [
  { href: "/products", label: "Sản phẩm" },
  { href: "/#featured", label: "Sản phẩm nổi bật" },
  { href: "/#contact", label: "Liên hệ" },
];

/** Khu vực nội bộ (/staff/**): dùng menu riêng của nhân viên, không có giỏ hàng và nút đăng nhập của khách. */
const STAFF_LINKS = [
  { href: "/staff/rental-orders", label: "Đơn thuê" },
  { href: "/staff/sale-orders", label: "Đơn mua" },
  { href: "/staff/returns", label: "Nhận hàng trả & kho" },
];

interface StaffMe {
  hoTen: string;
  email: string;
  vaiTro: string;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Lưu trang lúc mở menu: đổi trang thì menuOpen tự thành false, không cần effect đóng menu.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenAt(open ? pathname : null);
  const { totalItems, loggedIn, refresh } = useCart();
  const isStaffArea = pathname.startsWith("/staff");
  const isStaffLogin = pathname === "/staff/login";
  const [staff, setStaff] = useState<StaffMe | null>(null);

  // Trang chủ có hero nền tối (bg-wine-deep) phía sau header trong suốt —
  // chữ phải sáng màu ở đó để không "chìm" vào nền; mọi trang khác nền sáng
  // ngay từ đầu nên luôn dùng chữ tối.
  const onDarkHero = pathname === "/" && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isStaffArea) return; // khu nội bộ dùng phiên nhân viên, không liên quan tài khoản khách
    // Trạng thái đăng nhập lấy từ /api/cart/summary (luôn 200, không sinh lỗi 401 cho khách chưa đăng nhập);
    // gọi lại mỗi lần Header mount để sau khi đăng nhập/đăng xuất ở trang khác thì badge và nút tài khoản đúng ngay.
    void refresh();
  }, [isStaffArea, refresh]);

  useEffect(() => {
    if (!isStaffArea || isStaffLogin) return;
    fetch("/api/staff/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setStaff(data))
      .catch(() => setStaff(null));
  }, [isStaffArea, isStaffLogin]);

  const handleStaffLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    setStaff(null);
    router.push("/staff/login");
  };

  const navLinks = isStaffArea
    ? isStaffLogin
      ? []
      : [...STAFF_LINKS, ...(staff?.vaiTro === "Admin" ? [{ href: "/admin", label: "Quản trị" }] : [])]
    : NAV_LINKS;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ${
        scrolled || menuOpen
          ? "py-3.5 bg-cream/90 backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(42,31,26,0.15)]"
          : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link
          href={isStaffArea && !isStaffLogin ? "/staff/rental-orders" : "/"}
          className={`font-heading text-xl font-bold tracking-tight ${
            onDarkHero ? "text-cream" : "text-ink"
          }`}
        >
          Board<span className={onDarkHero ? "text-gold" : "text-wine"}>Verse</span>
        </Link>

        <nav className="hidden gap-9 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium uppercase tracking-wider ${
                onDarkHero ? "text-cream/85" : "text-ink"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {isStaffArea ? (
          <div className="flex items-center gap-4">
            {isStaffLogin ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                <ShieldCheck className="h-3.5 w-3.5" /> Khu vực nội bộ
              </span>
            ) : (
              staff && (
                <>
                  <span className="hidden text-right leading-tight sm:block">
                    <span className="block text-xs font-semibold text-ink">{staff.hoTen}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-ink-soft">{staff.vaiTro}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleStaffLogout}
                    className="flex items-center gap-2 border border-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất
                  </button>
                </>
              )
            )}
            {navLinks.length > 0 && (
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={menuOpen}
                className="text-ink md:hidden"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        ) : (
        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className={`relative ${onDarkHero ? "text-cream" : "text-ink"}`}
            aria-label="Giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[10px] font-semibold text-paper">
                {totalItems}
              </span>
            )}
          </Link>
          {loggedIn ? (
            <MenuPrimitive.Root>
              <MenuPrimitive.Trigger
                className={onDarkHero ? "text-cream" : "text-ink"}
                aria-label="Tài khoản"
              >
                <User className="h-5 w-5" />
              </MenuPrimitive.Trigger>
              <MenuPrimitive.Portal>
                <MenuPrimitive.Positioner align="end" sideOffset={10}>
                  <MenuPrimitive.Popup className="min-w-[200px] rounded border border-ink/12 bg-paper py-2 shadow-[0_20px_40px_-20px_rgba(42,31,26,0.3)]">
                    <MenuPrimitive.Item
                      render={<Link href="/profile" />}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink data-[highlighted]:bg-cream"
                    >
                      <User className="h-4 w-4" />
                      Hồ sơ cá nhân
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      render={<Link href="/orders" />}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink data-[highlighted]:bg-cream"
                    >
                      <Receipt className="h-4 w-4" />
                      Lịch sử đơn
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      render={<Link href="/wallet" />}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink data-[highlighted]:bg-cream"
                    >
                      <Wallet className="h-4 w-4" />
                      Ví của tôi
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      render={<Link href="/account" />}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink data-[highlighted]:bg-cream"
                    >
                      <Settings className="h-4 w-4" />
                      Cài đặt tài khoản
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Separator className="my-2 h-px bg-ink/12" />
                    <MenuPrimitive.Item
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-wine data-[highlighted]:bg-cream"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </MenuPrimitive.Item>
                  </MenuPrimitive.Popup>
                </MenuPrimitive.Positioner>
              </MenuPrimitive.Portal>
            </MenuPrimitive.Root>
          ) : pathname === "/login" ? null : (
            // Đang ở trang đăng nhập thì không cần nút "Đăng nhập" nữa.
            <Link
              href="/login"
              className={`flex items-center gap-2 border px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                onDarkHero
                  ? "border-cream/50 text-cream hover:border-cream hover:bg-cream/10"
                  : "border-ink text-ink hover:bg-ink hover:text-cream"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Đăng nhập
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            className={`md:hidden ${onDarkHero ? "text-cream" : "text-ink"}`}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        )}
      </div>

      {menuOpen && (
        <nav className="border-t border-ink/10 bg-cream px-5 py-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[13px] font-medium uppercase tracking-wider text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
