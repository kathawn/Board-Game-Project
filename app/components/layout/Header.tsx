"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";

const NAV_LINKS = [
  { href: "/products", label: "Bộ sưu tập" },
  { href: "/#featured", label: "Sản phẩm nổi bật" },
  { href: "/#occasions", label: "Phù hợp cho" },
  { href: "/#contact", label: "Liên hệ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();

  // Trang chủ có hero nền tối (bg-wine-deep) phía sau header trong suốt —
  // chữ phải sáng màu ở đó để không "chìm" vào nền; mọi trang khác nền sáng
  // ngay từ đầu nên luôn dùng chữ tối.
  const onDarkHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ${
        scrolled
          ? "py-3.5 bg-cream/90 backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(42,31,26,0.15)]"
          : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className={`font-heading text-xl font-bold tracking-tight ${
            onDarkHero ? "text-cream" : "text-ink"
          }`}
        >
          Board<span className={onDarkHero ? "text-gold" : "text-wine"}>Verse</span>
        </Link>

        <nav className="hidden gap-9 md:flex">
          {NAV_LINKS.map((link) => (
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
        </div>
      </div>
    </header>
  );
}
