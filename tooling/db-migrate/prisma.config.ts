import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { defineConfig } from "prisma/config";

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
  datasource: {
    url: process.env.CONTROL_DATABASE_URL ?? "",
  },
});
