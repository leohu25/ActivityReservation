import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider, Toaster } from "@base/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "企业数字化协同平台",
  description: "现代化多租户 SaaS 数字化协同系统",
  icons: {
    icon: [
      { url: "/logo/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/logo/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/logo/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <NuqsAdapter>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
