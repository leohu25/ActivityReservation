import { createServerAuth, type ServerAuthRuntime } from "@chenrun/auth";
import { PlatformAdminService } from "../services/platform-admin";

let authSingleton: ServerAuthRuntime | undefined;
let platformAdminServiceSingleton: PlatformAdminService | undefined;

/**
 * 获取平台端 ServerAuthRuntime 单例
 * 自包含在 @chenrun/feature-platform-admin 内部管理
 */
export function getPlatformAuthRuntime(): ServerAuthRuntime {
  if (authSingleton) {
    return authSingleton;
  }
  const databaseUrl =
    process.env.CONTROL_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/saas_control";
  const secret =
    process.env.BETTER_AUTH_SECRET ??
    "platform-default-auth-secret-32-chars-key";
  authSingleton = createServerAuth({
    databaseUrl,
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
  });
  return authSingleton;
}

/**
 * 获取平台总控服务单例
 * 自包含在 @chenrun/feature-platform-admin 内部提供
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
