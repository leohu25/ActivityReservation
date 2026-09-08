import { defineConfig } from "prisma/config";

// 租户 Prisma 基础配置
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.TENANT_DATABASE_URL ||
      "postgresql://dummy:dummy@localhost:5432/tenant_dummy?schema=public",
  },
});
