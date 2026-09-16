import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("prisma.config.ts should safely load apps/control/.env.local and eliminate hardcoded fallbacks", async () => {
  const packageDir = path.resolve(import.meta.dirname, "..");
  const workspaceRoot = path.resolve(packageDir, "../..");
  const configPath = path.join(packageDir, "prisma.config.ts");
  const configContent = fs.readFileSync(configPath, "utf-8");

  // 1. 断言没有任何静默硬编码的本地兜底连接串 (防止环境穿透与隐性脏数据)
  assert.equal(
    configContent.includes("127.0.0.1:55433"),
    false,
    "prisma.config.ts 严禁包含静默硬编码的数据库连接兜底！",
  );
  assert.equal(
    configContent.includes("saas_control?schema=public"),
    false,
    "prisma.config.ts 严禁包含静默硬编码的数据库连接兜底！",
  );

  // 2. 断言已配置针对 apps/control/.env.local 的规范化路径加载
  assert.ok(
    configContent.includes("apps/control/.env.local"),
    "prisma.config.ts 必须声明对 apps/control/.env.local 的自动加载路径",
  );

  // 3. 动态加载 prisma.config.ts 验证其配置对象
  const configModule = await import(configPath);
  const config = configModule.default;
  assert.ok(config, "prisma.config.ts 必须有效导出配置对象");
  assert.equal(config.schema, "prisma/schema.prisma");
  assert.ok(config.datasource, "必须包含 datasource 配置");
  assert.equal(typeof config.datasource.url, "string");
});
