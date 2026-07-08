import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "城配末端分单配送系统",
  description:
    "面向 2B 仓城配末端：承运商无系统、无面单场景下的司机分单与配送解决方案",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-800 min-h-screen">
        <Nav />
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
