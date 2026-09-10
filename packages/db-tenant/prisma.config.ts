import { defineConfig } from "prisma/config";

// 租户 Prisma 基础配置（指向全量聚合后的 Canonical Schema）
export default defineConfig({
  schema: "prisma/schema.generated.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.TENANT_DATABASE_URL ||
      "postgresql://gemini_local:gemini_local_only@127.0.0.1:55433/saas_control?schema=public",
    shadowDatabaseUrl:
      process.env.SHADOW_DATABASE_URL ||
      "postgresql://gemini_local:gemini_local_only@127.0.0.1:55433/saas_control?schema=public",
  },
});
