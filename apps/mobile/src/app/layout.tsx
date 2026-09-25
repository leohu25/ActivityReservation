import React from "react";
import "./globals.css";
import { MobileGlassDock } from "../components/mobile-glass-dock";

export const metadata = {
  title: "宁卫场馆活动预约",
  description: "宁卫各场馆活动预约与电子通行码系统",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 pb-24">
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm flex flex-col">
          {children}
        </main>
        <MobileGlassDock />
      </body>
    </html>
  );
}
