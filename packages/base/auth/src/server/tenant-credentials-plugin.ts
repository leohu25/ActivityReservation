import { createAuthEndpoint, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { verifyPassword } from "better-auth/crypto";
import { generateUuidV7 } from "@base/shared";
import {
  createControlPrismaClient,
  type ControlPrismaClient,
} from "@base/db-control";
import { z } from "zod";

const signInTenantBodySchema = z.object({
  organizationSlug: z.string().meta({ description: "企业编码 (租户标识)" }),
  account: z.string().meta({ description: "员工账号 / 工号 / 手机号" }),
  password: z.string().meta({ description: "登录密码" }),
  rememberMe: z.boolean().optional(),
});

export interface TenantCredentialsPluginOptions {
  databaseUrl?: string;
  prisma?: ControlPrismaClient;
}

/**
 * 官方标准 Better Auth 自定义插件：租户独立凭证三要素认证插件 (Tenant Credentials Plugin)
 * 路由端点：POST /api/auth/sign-in/tenant
 * 职责：
 * 1. 在平台 Control DB 中根据 [organizationSlug, account] 进行租户作用域隔离鉴权；
 * 2. 校验通过后，使用 Better Auth internalAdapter 原生签发 Session；
 * 3. 使用 setSessionCookie 原生设置官方标准 HttpOnly Cookie 与 Context，杜绝外部中继胶水。
 */
export const tenantCredentialsPlugin = (options?: TenantCredentialsPluginOptions) => {
  return {
    id: "tenant-credentials",
    endpoints: {
      signInTenant: createAuthEndpoint(
        "/sign-in/tenant",
        {
          method: "POST",
          body: signInTenantBodySchema,
          metadata: {
            openapi: {
              summary: "租户专属三要素登录 (企业编码 + 账号 + 密码)",
              description: "在指定租户作用域下验证员工账号密码并签发官方标准会话",
            },
          },
        },
        async (ctx) => {
          const cleanSlug = ctx.body.organizationSlug.trim().toLowerCase();
          const cleanAccount = ctx.body.account.trim();
          const plainPassword = ctx.body.password;

          if (!cleanSlug || !cleanAccount || !plainPassword) {
            throw new APIError("BAD_REQUEST", {
              message: "企业编码、账号与密码均为必填项",
            });
          }

          const databaseUrl =
            options?.databaseUrl ??
            process.env.CONTROL_DATABASE_URL ??
            "";

          const prisma: ControlPrismaClient =
            options?.prisma ?? createControlPrismaClient(databaseUrl);

          // 1. 根据 Slug 查询唯一的租户企业
          const org = await prisma.organization.findUnique({
            where: { slug: cleanSlug },
            select: { id: true, name: true, slug: true },
          });

          if (!org) {
            throw new APIError("UNAUTHORIZED", {
              message: `企业编码 [${cleanSlug}] 不存在，请核对`,
            });
          }

          // 2. 在租户作用域下精确查询 TenantAccount 独立凭据（严格字面量匹配，绝不自作聪明猜测或截断）
          const tenantAccount = await prisma.tenantAccount.findUnique({
            where: {
              organizationId_account: {
                organizationId: org.id,
                account: cleanAccount,
              },
            },
          });

          if (!tenantAccount) {
            throw new APIError("UNAUTHORIZED", {
              message: "账号或密码错误",
            });
          }

          if (tenantAccount.status !== "ACTIVE") {
            throw new APIError("FORBIDDEN", {
              message: "该员工账号已被停用，请联系企业管理员",
            });
          }

          // 3. 校验租户私有加盐密码哈希
          const isMatch = await verifyPassword({
            hash: tenantAccount.password,
            password: plainPassword,
          });

          if (!isMatch) {
            throw new APIError("UNAUTHORIZED", {
              message: "账号或密码错误",
            });
          }

          // 4. 定位或自动挂载该租户员工对应的 User 载体
          let userId: string | null = null;
          if (tenantAccount.memberId) {
            const member = await prisma.member.findUnique({
              where: { id: tenantAccount.memberId },
              select: { userId: true },
            });
            userId = member?.userId ?? null;
          }

          if (!userId) {
            const namespacedUsername = `${cleanSlug}:${cleanAccount}`;
            let user = await prisma.user.findUnique({
              where: { username: namespacedUsername },
              select: { id: true },
            });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  id: generateUuidV7(),
                  username: namespacedUsername,
                  name: tenantAccount.name,
                  email: null,
                  emailVerified: false,
                },
                select: { id: true },
              });
            }
            userId = user.id;

            const member = await prisma.member.upsert({
              where: {
                organizationId_userId: {
                  organizationId: org.id,
                  userId,
                },
              },
              create: {
                id: generateUuidV7(),
                organizationId: org.id,
                userId,
                role: "member",
              },
              update: {},
              select: { id: true },
            });

            await prisma.tenantAccount.update({
              where: { id: tenantAccount.id },
              data: { memberId: member.id },
            });
          }

          // 5. 调用 Better Auth internalAdapter 官方底层机制原生签发 Session
          const session = await ctx.context.internalAdapter.createSession(
            userId,
            ctx.body.rememberMe === false,
          );

          if (!session) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "会话凭证签发失败",
            });
          }

          // 将当前激活组织同步更新至 session
          await prisma.session.update({
            where: { id: session.id },
            data: { activeOrganizationId: org.id },
          });

          const user = await ctx.context.internalAdapter.findUserById(userId);
          if (user) {
            // 6. 调用 Better Auth 原生 setSessionCookie 种植 HttpOnly 认证 Cookie
            await setSessionCookie(
              ctx,
              { session, user },
              ctx.body.rememberMe === false,
            );
          }

          return ctx.json({
            success: true,
            token: session.token,
            organizationId: org.id,
            organizationName: org.name,
            account: tenantAccount.account,
            name: tenantAccount.name,
          });
        },
      ),
    },
  };
};
