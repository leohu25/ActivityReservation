import React from "react";
import { MigrationsPage } from "@chenrun/feature-control-admin";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 数据架构与迁移中枢路由挂载点
 */
export default function MigrationsRoute(): Promise<React.JSX.Element> {
 return MigrationsPage();
}
