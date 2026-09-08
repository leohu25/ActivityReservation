import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthRuntime } from "@/lib/auth";

/**
 * 根门户路由 (App Router Root Page)
 * 纯粹的认证状态判定与网关路由分发：
 * - 已登录用户：直接分发至主系统工作台 (/workbench)
 * - 未登录访客：直接分发至独立认证登录页 (/login)
 */
export default async function RootPage() {
 const runtime = getServerAuthRuntime();
 const session = await runtime.auth.api.getSession({
  headers: await headers(),
 });

 if (session) {
  redirect("/workbench");
 } else {
  redirect("/login");
 }
}
