import { createServerAuth, type ServerAuthRuntime } from "@chenrun/auth";

let controlAuthSingleton: ServerAuthRuntime | undefined;

/**
 * 获取控制平面 ServerAuthRuntime 单例
 * 独立配置 Better Auth，管理控制平面会话与超管账号
 */
export function getControlAuthRuntime(): ServerAuthRuntime {
  if (controlAuthSingleton) {
    return controlAuthSingleton;
  }
  const databaseUrl = process.env.CONTROL_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "缺少 CONTROL_DATABASE_URL 环境变量，数据库未连接！请检查 apps/control/.env.local 配置文件是否就绪。",
    );
  }
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "缺少 BETTER_AUTH_SECRET 环境变量！请检查 apps/control/.env.local 配置文件。",
    );
  }
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
