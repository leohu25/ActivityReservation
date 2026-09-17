#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

export function checkRelationModeInContent(
  content,
  filePath = "schema.prisma",
) {
  const errors = [];
  const datasourceMatch = content.match(/datasource\s+\w+\s*\{([^}]+)\}/);
  if (!datasourceMatch) {
    errors.push({
      file: filePath,
      rule: "缺少 datasource 声明块",
    });
    return errors;
  }

  const datasourceBody = datasourceMatch[1];
  const relationModeMatch = datasourceBody.match(
    /relationMode\s*=\s*["']([^"']+)["']/,
  );
  if (!relationModeMatch) {
    errors.push({
      file: filePath,
      rule: '未配置 relationMode (租户库必须显式配置 relationMode = "prisma" 以消除物理外键和死锁)',
    });
  } else if (relationModeMatch[1] !== "prisma") {
    errors.push({
      file: filePath,
      rule: `relationMode 配置值错误: 当前为 "${relationModeMatch[1]}"，必须为 "prisma"`,
    });
  }

  return errors;
}

export function runRelationModeCheck(workspaceRoot = findWorkspaceRoot()) {
  const violations = [];

  const targetSchemas = [
    path.join(workspaceRoot, "packages/base/db-tenant/prisma/schema.prisma"),
    path.join(
      workspaceRoot,
      "packages/base/db-tenant/prisma/schema.generated.prisma",
    ),
  ];

  const domainsDir = path.join(workspaceRoot, "packages/domains");
  if (fs.existsSync(domainsDir)) {
    const entries = fs.readdirSync(domainsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const schemaPath = path.join(
          domainsDir,
          entry.name,
          "prisma/schema.prisma",
        );
        if (fs.existsSync(schemaPath)) {
          targetSchemas.push(schemaPath);
        }
      }
    }
  }

  for (const schemaPath of targetSchemas) {
    if (!fs.existsSync(schemaPath)) continue;
    const relPath = path
      .relative(workspaceRoot, schemaPath)
      .replace(/\\/g, "/");
    const content = fs.readFileSync(schemaPath, "utf-8");
    const fileErrors = checkRelationModeInContent(content, relPath);
    violations.push(...fileErrors);
  }

  const tenantMigrationsDir = path.join(
    workspaceRoot,
    "tooling/db-migrate/migrations/tenant",
  );
  if (fs.existsSync(tenantMigrationsDir)) {
    const migrationDirs = fs
      .readdirSync(tenantMigrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    const latestMigration = migrationDirs.at(-1);
    if (latestMigration) {
      const migSqlPath = path.join(
        tenantMigrationsDir,
        latestMigration,
        "migration.sql",
      );
      if (fs.existsSync(migSqlPath)) {
        const migSql = fs.readFileSync(migSqlPath, "utf-8");
        const relMigPath = path
          .relative(workspaceRoot, migSqlPath)
          .replace(/\\/g, "/");
        if (/ADD\s+CONSTRAINT\s+["`\w]+?\s+FOREIGN\s+KEY/i.test(migSql)) {
          violations.push({
            file: relMigPath,
            rule: "租户最新迁移脚本中发现物理 FOREIGN KEY 约束，违背 relationMode = 'prisma' 逻辑外键架构",
          });
        }
      }
    }
  }

  return violations;
}

let isDirectRun = false;
try {
  if (process.argv[1]) {
    const currentScript = fileURLToPath(import.meta.url);
    isDirectRun = path.resolve(process.argv[1]) === path.resolve(currentScript);
  }
} catch {
  isDirectRun = false;
}

if (isDirectRun) {
  const violations = runRelationModeCheck();
  if (violations.length > 0) {
    process.stderr.write(
      `\x1b[31m• 逻辑外键架构门禁检查失败: 发现 ${violations.length} 处违规\x1b[0m\n`,
    );
    for (const v of violations) {
      process.stderr.write(`  \x1b[33m${v.file}\x1b[0m: ${v.rule}\n`);
    }
    process.exit(1);
  } else {
    process.stdout.write(
      "\x1b[32m• 逻辑外键架构门禁: 租户 Schema 与最新迁移均已严格启用 relationMode = 'prisma' (100% 逻辑外键与死锁免疫)\x1b[0m\n",
    );
    process.exit(0);
  }
}
