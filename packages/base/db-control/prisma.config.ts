import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { defineConfig } from "prisma/config";

// 按照 Monorepo 应用隔离规范加载环境变量（保证无论本地还是远程配置均真实生效）
const packageDir = import.meta.dirname;
const workspaceRoot = path.resolve(packageDir, "../..");
const candidateEnvFiles = [
  path.join(workspaceRoot, "apps/control/.env.local"),
  path.join(workspaceRoot, "apps/control/.env"),
  path.join(packageDir, ".env.local"),
  path.join(packageDir, ".env"),
];

for (const envFile of candidateEnvFiles) {
  if (fs.existsSync(envFile) && "loadEnvFile" in process) {
    try {
      process.loadEnvFile(envFile);
    } catch {
      // 容错处理
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 遵循 Fail-Fast 原则：绝不设任何静默默认连接串，避免环境穿透或掩盖配置缺失
    // 静态代码生成 (prisma generate) 阶段 Prisma 允许空串，真实连库操作将在未配置时明确快速失败
    url: process.env.CONTROL_DATABASE_URL ?? "",
  },
});
