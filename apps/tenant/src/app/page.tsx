import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthRuntime } from "@base/auth";
import { getTenantLandingPath } from "@/kernel";

/**
 * 根门户路由 (App Router Root Page)
 * 纯粹的认证状态判定与网关路由分发：
 * - 已登录用户：自适应动态计算首选落地页 (有工作台跳工作台，无工作台无缝跳入首个可用业务页)
 * - 未登录访客：直接分发至独立认证登录页 (/login)
 */
export default async function RootPage() {
 const runtime = getServerAuthRuntime();
 const session = await runtime.auth.api.getSession({
  headers: await headers(),
 });

 if (session) {
  const landingPath = await getTenantLandingPath();
  redirect(landingPath);
 } else {
  redirect("/login");
 }
}
