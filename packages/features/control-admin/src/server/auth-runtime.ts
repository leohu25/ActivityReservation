import { createServerAuth, type ServerAuthRuntime } from "@chenrun/auth";
import { ControlAdminService } from "../services/control-admin";

let controlAuthSingleton: ServerAuthRuntime | undefined;
let controlAdminServiceSingleton: ControlAdminService | undefined;

/**
 * 获取控制平面 ServerAuthRuntime 单例
 * 独立配置 Better Auth，管理控制平面会话与超管账号
 */
export function getControlAuthRuntime(): ServerAuthRuntime {
  if (controlAuthSingleton) {
    return controlAuthSingleton;
  }
  const databaseUrl =
    process.env.CONTROL_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/saas_control";
  const secret =
    process.env.BETTER_AUTH_SECRET ??
    "control-default-auth-secret-32-chars-key";
  controlAuthSingleton = createServerAuth({
    databaseUrl,
    secret,
    baseURL:
      process.env.CONTROL_AUTH_URL ??
      process.env.PLATFORM_AUTH_URL ??
      "http://localhost:3001",
  });
  return controlAuthSingleton;
}

/**
 * 获取控制平面总控服务单例
 */
export function getControlAdminService(): ControlAdminService {
  if (controlAdminServiceSingleton) {
    return controlAdminServiceSingleton;
  }
  const runtime = getControlAuthRuntime();
  controlAdminServiceSingleton = ControlAdminService.create({
    prisma: runtime.prisma,
  });
  return controlAdminServiceSingleton;
}
