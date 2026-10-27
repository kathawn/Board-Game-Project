"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ShoppingCart, User, Settings, LogOut, Receipt } from "lucide-react";

const NAV_LINKS = [
  { href: "/products", label: "Bộ sưu tập" },
  { href: "/#featured", label: "Sản phẩm nổi bật" },
  { href: "/#occasions", label: "Phù hợp cho" },
  { href: "/#contact", label: "Liên hệ" },
];

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => setLoggedIn(response.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ${
        scrolled
          ? "py-3.5 bg-cream/90 backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(42,31,26,0.15)]"
          : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight">
          Board<span className="text-wine">Verse</span>
        </Link>

        <nav className="hidden gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative text-ink"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {loggedIn ? (
            <MenuPrimitive.Root>
              <MenuPrimitive.Trigger
                className="text-ink"
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
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 border border-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-ink hover:text-cream"
            >
              <User className="h-3.5 w-3.5" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
