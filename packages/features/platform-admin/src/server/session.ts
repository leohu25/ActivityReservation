import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkIsPlatformAdmin } from "../auth/platform-admin-guard";
import { getPlatformAuthRuntime } from "./auth-runtime";

export interface PlatformSessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

/**
 * 获取当前请求的会话用户信息，并执行平台超管校验
 * 自包含在 @chenrun/feature-platform-admin 内部，Fail-Closed 判定
 */
export async function requirePlatformAdminSession(): Promise<PlatformSessionUser> {
  const runtime = getPlatformAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (!checkIsPlatformAdmin(session.user)) {
    throw new Error("访问受限：需要平台超级管理员权限 (Platform Super Admin)");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
