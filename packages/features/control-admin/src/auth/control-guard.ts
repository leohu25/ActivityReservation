/**
 * 控制平面超级管理员（Control Plane Super Admin）判定与鉴权守卫
 * 负责总控平台所有租户、开通物理独立数据库及租户生命周期管控。
 */

/**
 * 获取系统配置的控制平面超级管理员邮箱列表
 * 优先级：
 * 1. 环境变量 CONTROL_ADMIN_EMAILS / PLATFORM_ADMIN_EMAILS
 * 2. 回退检查环境变量 CONTROL_BOOTSTRAP_ADMIN_EMAIL (Day 0 超管)
 * 3. 开发环境缺省包含 admin@chenrun.com (生产环境未显式配置时严格返回空，Fail-Closed)
 */
export function getControlAdminEmails(): string[] {
 const envEmails =
  process.env.CONTROL_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS;
 if (envEmails && envEmails.trim().length > 0) {
  return envEmails
   .split(",")
   .map((e) => e.trim().toLowerCase())
   .filter((e) => e.length > 0);
 }

 const bootstrapEmail = process.env.CONTROL_BOOTSTRAP_ADMIN_EMAIL;
 if (bootstrapEmail && bootstrapEmail.trim().length > 0) {
  return [bootstrapEmail.trim().toLowerCase()];
 }

 // 生产环境下若未配置任何超管白名单或引导邮箱，严格返回空列表 (Fail-Closed)
 if (process.env.NODE_ENV === "production") {
  return [];
 }

 return ["admin@chenrun.com"];
}

/**
 * 判定指定邮箱是否属于控制平面超级管理员
 */
export function isControlAdminEmail(email: string | null | undefined): boolean {
 if (!email || email.trim().length === 0) {
  return false;
 }
 const cleanEmail = email.trim().toLowerCase();
 const admins = getControlAdminEmails();
 return admins.includes(cleanEmail);
}

/**
 * 判定会话用户信息是否属于控制平面超级管理员
 */
export function checkIsControlAdmin(
 user: { email?: string | null } | null | undefined,
): boolean {
 if (!user || !user.email) {
  return false;
 }
 return isControlAdminEmail(user.email);
}

/**
 * 控制平面超级管理员断言守卫
 * 若非总控管理员，抛出无权限异常 (Fail-Closed)
 */
export function assertControlAdmin(
 user: { email?: string | null } | null | undefined,
): void {
 if (!checkIsControlAdmin(user)) {
  throw new Error(
   "访问受限：需要控制平面超级管理员权限 (Control Plane Super Admin)",
  );
 }
}
