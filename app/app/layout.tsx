import type { Metadata } from "next";
import { Fraunces, Italianno, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700", "800", "900"],
});

const italianno = Italianno({
  variable: "--font-italianno",
  subsets: ["latin"],
  weight: "400",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BoardVerse — Mua bán & cho thuê board game",
  description:
    "BoardVerse — cửa hàng board game chọn lọc. Mỗi hộp game một câu chuyện, một buổi tối đáng nhớ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${fraunces.variable} ${italianno.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
