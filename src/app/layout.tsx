import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ISBN Price Checker",
  description:
    "ISBNから書籍情報を取得し、各販売サイト(メルカリ, Amazon)の価格を確認することができます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
