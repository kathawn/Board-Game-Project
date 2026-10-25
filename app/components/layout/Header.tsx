"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, User } from "lucide-react";

const NAV_LINKS = [
  { href: "#collection", label: "Bộ sưu tập" },
  { href: "#featured", label: "Sản phẩm nổi bật" },
  { href: "#occasions", label: "Phù hợp cho" },
  { href: "#contact", label: "Liên hệ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

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
          <Link
            href="/login"
            className="flex items-center gap-2 border border-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-ink hover:text-cream"
          >
            <User className="h-3.5 w-3.5" />
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
