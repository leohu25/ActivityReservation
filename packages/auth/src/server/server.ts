import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import {
  createControlPrismaClient,
  PrismaControlDbRepository,
  type ControlPrismaClient,
} from "@chenrun/db-control";
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
    secret: options.secret,
    baseURL: options.baseURL,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      organization({
        // Better Auth's role types are invariant in the injected statement.
        // The factory above is the only constructor accepted at this boundary.
        ac: accessControl.ac as never,
        roles: accessControl.roles as never,
        dynamicAccessControl: { enabled: true },
      }),
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
  });
  return singleton;
}

export function getServerAuth(): ServerAuthRuntime["auth"] {
  return getServerAuthRuntime().auth;
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
  if (runtime) {
    await runtime.prisma.$disconnect();
  }
}

export type { ControlPrismaClient };
