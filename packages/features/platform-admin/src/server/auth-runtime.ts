import { createServerAuth, type ServerAuthRuntime } from "@chenrun/auth";
import { PlatformAdminService } from "../services/platform-admin";

let platformAuthSingleton: ServerAuthRuntime | undefined;
let platformAdminServiceSingleton: PlatformAdminService | undefined;

/**
 * 获取平台端 ServerAuthRuntime 单例
 * 平台端独立配置 Better Auth，管理会话与超管账号
 */
export function getPlatformAuthRuntime(): ServerAuthRuntime {
  if (platformAuthSingleton) {
    return platformAuthSingleton;
  }
  const databaseUrl =
    process.env.CONTROL_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/saas_control";
  const secret =
    process.env.BETTER_AUTH_SECRET ??
    "platform-default-auth-secret-32-chars-key";
  platformAuthSingleton = createServerAuth({
    databaseUrl,
    secret,
    baseURL: process.env.PLATFORM_AUTH_URL ?? "http://localhost:3001",
  });
  return platformAuthSingleton;
}

/**
 * 获取平台总控服务单例
 */
export function getPlatformAdminService(): PlatformAdminService {
  if (platformAdminServiceSingleton) {
    return platformAdminServiceSingleton;
  }
  const runtime = getPlatformAuthRuntime();
  platformAdminServiceSingleton = PlatformAdminService.create({
    prisma: runtime.prisma,
  });
  return platformAdminServiceSingleton;
}
