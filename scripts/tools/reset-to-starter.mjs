#!/usr/bin/env node

/**
 * 通用 SaaS 基座一键纯净还原工具 (Reset to Starter Base)
 *
 * 核心设计目标：
 * 当需要将本工程作为全新业务系统的空白底座使用时，执行此脚本：
 * 1. 彻底清除除数据字典 (base-archives) 之外的所有具体业务切片 (packages/domains/*)；
 * 2. 彻底清除除字典路由 (archives) 之外的所有具体业务路由页面 (apps/tenant/.../(domains)/*)；
 * 3. 自动同步 apps/tenant/package.json 依赖列表（保留 @domain/base-archives）；
 * 4. 自动重新执行构建期代码生成与特性自发现，输出纯净通用的 SaaS 工业级底座。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function findWorkspaceRoot(startDir = __dirname) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(startDir, "../..");
}

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const NC = "\x1b[0m";

/** 无论何时都必须保留的基础资产白名单 */
export const PRESERVED_DOMAINS = new Set(["base-archives"]);
export const PRESERVED_DOMAIN_ROUTES = new Set(["archives"]);

/**
 * 分析当前工作区待清除的业务切片与待保留的底座
 */
export function analyzeStarterResetPlan(workspaceRoot = findWorkspaceRoot()) {
  const domainsDir = path.join(workspaceRoot, "packages/domains");
  const tenantDomainRoutesDir = path.join(
    workspaceRoot,
    "apps/tenant/src/app/(dashboard)/(domains)",
  );

  const domainsToKeep = [];
  const domainsToRemove = [];
  if (fs.existsSync(domainsDir)) {
    const entries = fs.readdirSync(domainsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (PRESERVED_DOMAINS.has(entry.name)) {
        domainsToKeep.push(entry.name);
      } else {
        domainsToRemove.push({
          name: entry.name,
          fullPath: path.join(domainsDir, entry.name),
        });
      }
    }
  }

  const routesToKeep = [];
  const routesToRemove = [];
  if (fs.existsSync(tenantDomainRoutesDir)) {
    const entries = fs.readdirSync(tenantDomainRoutesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (PRESERVED_DOMAIN_ROUTES.has(entry.name)) {
        routesToKeep.push(entry.name);
      } else {
        routesToRemove.push({
          name: entry.name,
          fullPath: path.join(tenantDomainRoutesDir, entry.name),
        });
      }
    }
  }

  return {
    domainsToKeep,
    domainsToRemove,
    routesToKeep,
    routesToRemove,
  };
}

/**
 * 执行清理与纯净底座自愈
 */
export function executeStarterReset(workspaceRoot = findWorkspaceRoot(), options = { dryRun: false }) {
  const plan = analyzeStarterResetPlan(workspaceRoot);

  if (options.dryRun) {
    return { plan, executed: false };
  }

  // 1. 删除具体的业务领域包 (保留 base-archives)
  for (const domain of plan.domainsToRemove) {
    if (fs.existsSync(domain.fullPath)) {
      fs.rmSync(domain.fullPath, { recursive: true, force: true });
    }
  }

  // 2. 删除应用层具体业务路由 (保留 archives)
  for (const route of plan.routesToRemove) {
    if (fs.existsSync(route.fullPath)) {
      fs.rmSync(route.fullPath, { recursive: true, force: true });
    }
  }

  // 3. 净化 apps/tenant/package.json 依赖
  const tenantPkgPath = path.join(workspaceRoot, "apps/tenant/package.json");
  if (fs.existsSync(tenantPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(tenantPkgPath, "utf-8"));
      if (pkg.dependencies) {
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith("@domain/") && dep !== "@domain/base-archives") {
            delete pkg.dependencies[dep];
          }
        }
        fs.writeFileSync(tenantPkgPath, JSON.stringify(pkg, null, "\t") + "\n", "utf-8");
      }
    } catch (err) {
      console.warn("更新 apps/tenant/package.json 依赖警告:", err.message);
    }
  }

  // 4. 重新触发特性扫描与 Schema 聚合自愈
  const syncFeaturesScript = path.join(workspaceRoot, "apps/tenant/scripts/sync-features.mjs");
  const syncSchemaScript = path.join(workspaceRoot, "packages/runtime/db/scripts/sync-schema.mjs");

  if (fs.existsSync(syncFeaturesScript)) {
    try {
      execSync(`node "${syncFeaturesScript}"`, { cwd: workspaceRoot, stdio: "ignore" });
    } catch {}
  }
  if (fs.existsSync(syncSchemaScript)) {
    try {
      execSync(`node "${syncSchemaScript}"`, { cwd: workspaceRoot, stdio: "ignore" });
    } catch {}
  }

  return { plan, executed: true };
}

async function promptConfirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const workspaceRoot = findWorkspaceRoot();
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isForce = args.includes("--force") || args.includes("-y");

  console.log(`${BLUE}>>> 通用 SaaS 底座一键纯净还原工具 (Reset to Starter Base)${NC}`);
  console.log(`• 根目录: ${workspaceRoot}\n`);

  const plan = analyzeStarterResetPlan(workspaceRoot);

  console.log(`• 待保留的系统基础资产:`);
  console.log(`  - 基础设施套件 : @base/*, @platform/*, @biz/shared, @runtime/db, tooling/*`);
  console.log(`  - 租户系统域页面: apps/tenant/.../(system)/* (workbench, organization, settings)`);
  console.log(`  - 基础数据字典 : @domain/base-archives, (domains)/archives`);

  console.log(`\n• ${YELLOW}即将清除的业务资产清单:${NC}`);
  if (plan.domainsToRemove.length === 0 && plan.routesToRemove.length === 0) {
    console.log(`  ${GREEN}✓ 当前工程已是纯净底座状态，未发现需清理的业务切片。${NC}`);
    process.exit(0);
  }

  for (const d of plan.domainsToRemove) {
    console.log(`  - [业务包] packages/domains/${d.name}`);
  }
  for (const r of plan.routesToRemove) {
    console.log(`  - [业务路由] apps/tenant/src/app/(dashboard)/(domains)/${r.name}`);
  }

  if (isDryRun) {
    console.log(`\n${GREEN}✓ [Dry-Run 预览模式] 未执行实际删除。添加 --force 参数以真实执行。${NC}`);
    process.exit(0);
  }

  if (!isForce) {
    const answer = await promptConfirm(
      `\n${RED}⚠️ 警告：该操作将物理删除上述所有业务代码，仅保留通用底座与数据字典！是否确认执行？(y/N): ${NC}`,
    );
    if (answer !== "y" && answer !== "yes") {
      console.log("操作已取消。");
      process.exit(0);
    }
  }

  console.log(`\n正在执行清理与纯净底座自愈...`);
  executeStarterReset(workspaceRoot, { dryRun: false });

  console.log(`${GREEN}✔ 纯净底座重置完成！${NC}`);
  console.log(`提示：请执行 ${BLUE}pnpm install && pnpm generate${NC} 刷新锁文件并更新客户端。`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("执行失败:", err);
    process.exit(1);
  });
}
