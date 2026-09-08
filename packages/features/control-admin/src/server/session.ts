import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkIsControlAdmin } from "../auth/control-guard";
import { getControlAuthRuntime } from "./auth-runtime";

export interface ControlSessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

/**
 * 获取当前请求的控制平面会话用户信息，并执行总控管理员校验
 * 自包含在 @chenrun/feature-control-admin 内部，Fail-Closed 判定
 */
export async function requireControlAdminSession(): Promise<ControlSessionUser> {
  const runtime = getControlAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (!checkIsControlAdmin(session.user)) {
    throw new Error(
      "访问受限：需要控制平面超级管理员权限 (Control Plane Super Admin)",
    );
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
