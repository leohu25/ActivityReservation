import { PrismaPg } from "@prisma/adapter-pg";
import {
 PrismaClient as CustomerPrismaClient,
 Prisma as CustomerPrisma,
} from "@prisma/client-customer";

export { CustomerPrismaClient, CustomerPrisma };

const customerClientCache = new Map<string, CustomerPrismaClient>();

/**
 * 获取对应租户物理库的客户中心专属 Prisma Client
 * 连接复用，通过 PrismaPg Adapter 连接，严格避免重复构建实例
 */
export function getCustomerPrismaClient(
 databaseUrl: string,
): CustomerPrismaClient {
 if (!databaseUrl || databaseUrl.trim().length === 0) {
  throw new Error("TENANT_DATABASE_URL is required for CustomerPrismaClient");
 }

 const cached = customerClientCache.get(databaseUrl);
 if (cached) {
  return cached;
 }

 const adapter = new PrismaPg({ connectionString: databaseUrl });
 const client = new CustomerPrismaClient({ adapter });

 customerClientCache.set(databaseUrl, client);
 return client;
}
