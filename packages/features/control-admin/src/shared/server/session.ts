import { headers } from "next/headers";
import { getControlAuthRuntime } from "./auth-runtime";
import { assertControlAdmin, type ControlAdminIdentity } from "./control-guard";

/**
 * 校验当前请求上下文是否具备控制平面超级管理员会话
 * 若未登录或非超级管理员邮箱，直接抛出异常 (Fail-Closed)
 */
export async function requireControlAdminSession(): Promise<ControlAdminIdentity> {
 const runtime = getControlAuthRuntime();
 const reqHeaders = await headers();
 const session = await runtime.auth.api.getSession({
  headers: reqHeaders,
 });

 if (!session || !session.user) {
  throw new Error("未登录或控制台登录已失效，请重新登录超级管理员账号");
 }

 assertControlAdmin(session.user);

 return session.user;
}
