import React from "react";
import type { Metadata } from "next";
import { ThemeProvider, Toaster } from "@chenrun/ui";
import "./globals.css";

export const metadata: Metadata = {
 title: "宸润数智 ERP · 控制平面 (Control Plane)",
 description:
  "Control Plane Super Admin & Multi-Tenant Database Provisioning Central",
};

/**
 * 控制平面独立应用全局根布局
 * 遵循现代数智工业风规范：极浅冷灰蓝背景 (#F4F7FB) 与纯净抗锯齿文字排版
 */
export default function RootLayout({
 children,
}: {
 readonly children: React.ReactNode;
}) {
 return (
  <html lang="zh-CN" suppressHydrationWarning>
   <body
    className="min-h-screen bg-[#F4F7FB] text-slate-900 font-sans antialiased"
    suppressHydrationWarning
   >
    <ThemeProvider>
     {children}
     <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
   </body>
  </html>
 );
}
