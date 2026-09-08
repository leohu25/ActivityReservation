/**
 * 平台超级管理员（Platform Super Admin）判定与鉴权守卫
 * 平台超管负责总控平台所有租户、开通物理独立数据库及租户生命周期管控。
 */

/**
 * 获取系统配置的平台超级管理员邮箱列表
 * 优先级：环境变量 PLATFORM_ADMIN_EMAILS（逗号分隔） > 缺省包含 admin@chenrun.com
 */
export function getPlatformAdminEmails(): string[] {
 const envEmails = process.env.PLATFORM_ADMIN_EMAILS;
 if (!envEmails || envEmails.trim().length === 0) {
  return ["admin@chenrun.com"];
 }
 return envEmails
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.length > 0);
}

/**
 * 判定指定邮箱是否属于平台超级管理员
 */
export function isPlatformAdminEmail(
 email: string | null | undefined,
): boolean {
 if (!email || email.trim().length === 0) {
  return false;
 }
 const cleanEmail = email.trim().toLowerCase();
 const admins = getPlatformAdminEmails();
 return admins.includes(cleanEmail);
}

/**
 * 判定会话用户信息是否属于平台超级管理员
 */
export function checkIsPlatformAdmin(
 user: { email?: string | null } | null | undefined,
): boolean {
 if (!user || !user.email) {
  return false;
 }
 return isPlatformAdminEmail(user.email);
}

/**
 * 平台超级管理员断言守卫
 * 若非平台超管，抛出无权限异常
 */
export function assertPlatformAdmin(
 user: { email?: string | null } | null | undefined,
): void {
 if (!checkIsPlatformAdmin(user)) {
  throw new Error("访问受限：需要平台超级管理员权限 (Platform Super Admin)");
 }
}
