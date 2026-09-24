"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, QrCode, User } from "lucide-react";

export function MobileGlassDock() {
  const pathname = usePathname();

  const tabs = [
    { label: "活动大厅", href: "/", icon: Compass },
    { label: "通行码", href: "/qrcode", icon: QrCode },
    { label: "我的预约", href: "/my-bookings", icon: User },
  ];

  return (
    <div className="glass-dock">
      <nav className="glass-tabbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-full transition-all ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.75px]"}`} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
