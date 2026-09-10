import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient as ProcurementPrismaClient,
  Prisma as ProcurementPrisma,
} from "@prisma/client-procurement";

export { ProcurementPrismaClient, ProcurementPrisma };

const procurementClientCache = new Map<string, ProcurementPrismaClient>();

/**
 * 获取对应租户物理库的采购中心专属 Prisma Client
 * 连接复用，通过 PrismaPg Adapter 连接，严格避免重复构建实例
 */
export function getProcurementPrismaClient(
  databaseUrl: string,
): ProcurementPrismaClient {
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error(
      "TENANT_DATABASE_URL is required for ProcurementPrismaClient",
    );
  }

  const cached = procurementClientCache.get(databaseUrl);
  if (cached) {
    return cached;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const client = new ProcurementPrismaClient({ adapter });

  procurementClientCache.set(databaseUrl, client);
  return client;
}
