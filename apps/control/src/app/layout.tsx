import React from "react";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider, Toaster } from "@base/ui";
import "./globals.css";

export const metadata: Metadata = {
 title: "宸润数智 ERP · 控制平面 (Control Plane)",
 description:
  "Control Plane Super Admin & Multi-Tenant Database Provisioning Central",
};

/**
 * 控制平面全局根布局
 * 纯粹由 CSS 语义变量 (--background, --foreground) 与 ThemeProvider 驱动主题
 */
export default function RootLayout({
 children,
}: {
 readonly children: React.ReactNode;
}) {
 return (
  <html lang="zh-CN" suppressHydrationWarning>
   <body
    className="min-h-screen bg-background text-foreground font-sans antialiased"
    suppressHydrationWarning
   >
    <ThemeProvider>
     <NuqsAdapter>
      {children}
      <Toaster position="top-right" richColors closeButton />
     </NuqsAdapter>
    </ThemeProvider>
   </body>
  </html>
 );
}
