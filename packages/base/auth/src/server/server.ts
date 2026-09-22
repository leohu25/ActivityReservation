import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, username } from "better-auth/plugins";
import { generateUuidV7 } from "@base/shared";
import { tenantCredentialsPlugin } from "./tenant-credentials-plugin";
import {
  createControlPrismaClient,
  PrismaControlDbRepository,
  type ControlPrismaClient,
} from "@base/db-control";
import {
  getMigrationCatalog,
  platformBootstrapAdminFromEnv,
  PlatformMigrationRunner,
  seedPlatformBootstrapAdmin,
} from "@tool/db-migrate/platform";
import {
  createTrustedTenantContextResolver,
  type TrustedSessionReader,
} from "../context/trusted-tenant-context";
import {
  createOrganizationAccessControl,
  type OrganizationAccessControl,
} from "./access-control";
import type { TenantContext } from "../context/tenant-context";

export interface ServerAuthOptions {
  databaseUrl: string;
  secret: string;
  baseURL?: string;
  organizationAccessControl?: OrganizationAccessControl;
  /** 平台管控端可开启邮箱密码；租户端必须关闭，仅保留三要素插件 */
  enableEmailAndPassword?: boolean;
}

export function createServerAuth(options: ServerAuthOptions) {
  if (options.secret.trim().length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }

  const prisma = createControlPrismaClient(options.databaseUrl);
  const accessControl =
    options.organizationAccessControl ?? createOrganizationAccessControl({});
  const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    advanced: {
      database: {
        generateId: () => generateUuidV7(),
        // 显式关闭 Better Auth 内部的硬编码 schema 结构校验。
        // 因为我们采用了定制的 Database-per-tenant 架构，收敛移除了无用的 invitation 冗余表，
        // 且采用命名空间 username 隔离，避免框架在运行时因缺少模板表报错。
        validateSchema: false,
      },
    },
    secret: options.secret,
    baseURL: options.baseURL,
    // 动态信任所有客户端来源，支持内网穿透、任意反向代理域名及跨域调试
    trustedOrigins: async (request) => {
      if (!request) return [];
      const origin = request.headers.get("origin");
      return origin ? [origin] : [];
    },
    emailAndPassword: {
      // 租户端默认关闭，仅保留 /sign-in/tenant 单分支；平台管控端可显式开启
      enabled: options.enableEmailAndPassword === true,
    },
    plugins: [
      // 官方标准 username 插件：解绑强制邮箱依赖，支持用户以命名空间用户名运作
      username(),
      organization({
        // Better Auth's role types are invariant in the injected statement.
        // The factory above is the only constructor accepted at this boundary.
        ac: accessControl.ac as never,
        roles: accessControl.roles as never,
        dynamicAccessControl: { enabled: true },
      }),
      // 官方标准自定义扩展插件：支持企业编码+账号/工号/手机号三要素登录
      tenantCredentialsPlugin({ prisma }),
    ],
  });

  return {
    auth,
    prisma,
    tenantContextRepository: new PrismaControlDbRepository(prisma),
  };
}

export type ServerAuthRuntime = ReturnType<typeof createServerAuth>;

let singleton: ServerAuthRuntime | undefined;
let ensurePromise: Promise<void> | undefined;

/** Ensures the platform baseline exists before any Better Auth database query. */
export async function ensureServerAuthDatabase(
  databaseUrl = process.env.CONTROL_DATABASE_URL,
): Promise<void> {
  if (!databaseUrl) {
    throw new Error("CONTROL_DATABASE_URL is required");
  }
  if (!ensurePromise) {
    const runner = new PlatformMigrationRunner(
      databaseUrl,
      getMigrationCatalog("platform"),
      { seedBootstrapAdmin: seedPlatformBootstrapAdmin },
    );
    ensurePromise = runner
      .ensureInitialized(platformBootstrapAdminFromEnv())
      .then(() => undefined)
      .catch((error) => {
        ensurePromise = undefined;
        throw error;
      });
  }
  return ensurePromise;
}

/** Lazily initializes server auth so build-time module evaluation needs no secrets. */
export function getServerAuthRuntime(
  options?: ServerAuthOptions,
): ServerAuthRuntime {
  if (singleton) {
    return singleton;
  }

  const databaseUrl = options?.databaseUrl ?? process.env.CONTROL_DATABASE_URL;
  const secret = options?.secret ?? process.env.BETTER_AUTH_SECRET;
  if (!databaseUrl) {
    throw new Error("CONTROL_DATABASE_URL is required");
  }
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  singleton = createServerAuth({
    databaseUrl,
    secret,
    baseURL: options?.baseURL ?? process.env.BETTER_AUTH_URL,
    organizationAccessControl: options?.organizationAccessControl,
    enableEmailAndPassword: options?.enableEmailAndPassword === true,
  });
  return singleton;
}

export function getServerAuth(): ServerAuthRuntime["auth"] {
  return getServerAuthRuntime().auth;
}

export async function getEnsuredServerAuthRuntime(
  options?: ServerAuthOptions,
): Promise<ServerAuthRuntime> {
  const databaseUrl = options?.databaseUrl ?? process.env.CONTROL_DATABASE_URL;
  await ensureServerAuthDatabase(databaseUrl);
  return getServerAuthRuntime(options);
}

/** Resolves tenant context from Better Auth's signed server session only. */
export async function getCurrentTenantContext(
  headers: Headers,
): Promise<TenantContext> {
  const runtime = getServerAuthRuntime();
  const sessionReader: TrustedSessionReader = {
    getSession: (input: { headers: Headers }) =>
      runtime.auth.api.getSession(input),
  };
  return createTrustedTenantContextResolver({
    sessionReader,
    repository: runtime.tenantContextRepository,
  })(headers);
}

export async function closeServerAuth(): Promise<void> {
  const runtime = singleton;
  singleton = undefined;
  ensurePromise = undefined;
  if (runtime) {
    await runtime.prisma.$disconnect();
  }
}

export type { ControlPrismaClient };
