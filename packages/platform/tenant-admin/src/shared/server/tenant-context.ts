import {
  getSharedTenantDbContext,
  type SharedTenantDbContext,
} from "@base/authorization/server";
import type { ControlPrismaClient } from "@base/db-control";

export type TenantDbContext = SharedTenantDbContext;

export const getTenantDbContext = getSharedTenantDbContext;

/**
 * 获取 Control DB 客户端
 */
export async function getControlDbClient(): Promise<ControlPrismaClient> {
  const { getServerAuthRuntime } = await import("@base/auth");
  const runtime = getServerAuthRuntime();
  return runtime.prisma;
}

export {
  assertTenantAdminAbility,
  type TenantAdminContext,
} from "../../assembly/context";
