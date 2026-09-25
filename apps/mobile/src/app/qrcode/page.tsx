import React from "react";
import { QrCode, ShieldCheck } from "lucide-react";

interface QrCodePageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function MobileQrCodePage({ searchParams }: QrCodePageProps) {
  const { code } = await searchParams;
  const displayCode = code || "APPT202609250001";

  return (
    <div className="flex-1 flex flex-col p-5">
      <header className="pt-4 pb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight">场馆入场通行码</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          请向现场讲解老师或安保人员出示此码核销入场
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
        <div className="size-52 bg-slate-50 border-2 border-primary/20 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <QrCode className="size-40 text-slate-800" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        </div>

        <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          <ShieldCheck className="size-4" />
          通行凭证有效 · 动态防伪
        </div>

        <div className="mt-4 text-center space-y-1 text-xs text-muted-foreground">
          <p className="font-mono font-medium text-slate-700">预约单号: {displayCode}</p>
          <p>适用场次: 2026-09-26 09:30-11:00</p>
        </div>
      </div>
    </div>
  );
}
