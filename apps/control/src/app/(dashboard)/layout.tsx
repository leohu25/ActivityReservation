import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ControlLayout } from "@platform/control-admin/shared";
import {
  getControlAuthRuntime,
  assertControlAdmin,
} from "@platform/control-admin/shared/server";

export interface DashboardGroupLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 控制平面总控后台 (dashboard) 路由组统一布局
 * 引入 @base/feature-control-admin 导出的现代数智风自包含布局外壳
 */
export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps): Promise<React.JSX.Element> {
  const reqHeaders = await headers();
  const runtime = getControlAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  assertControlAdmin(session.user);

  const user = {
    name: session.user.name,
    email: session.user.email ?? "",
    role: "平台超管",
  };

  return <ControlLayout user={user}>{children}</ControlLayout>;
}
