#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "..");

process.chdir(WORKSPACE_ROOT);

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const NC = "\x1b[0m";

console.log(`${BLUE}>>> 全栈 Harness 启动自检 (Environment Check & Test)${NC}`);

// 1. 检查根目录治理底座
console.log(`${BLUE}[1/7] 治理底座:${NC}`);
const bootstrapScript = path.join(
  WORKSPACE_ROOT,
  ".harness/lifecycle/bootstrap.mjs",
);
const bootstrapRes = spawnSync(process.execPath, [bootstrapScript], {
  stdio: "inherit",
});
if (bootstrapRes.status !== 0) {
  process.exit(bootstrapRes.status ?? 1);
}

// 2. 检查跨平台脚本规范（强制全部使用 .mjs，严禁 .sh 脚本）
console.log(`${BLUE}[2/7] 跨平台脚本规范检查:${NC}`);
function scanShellScripts(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === ".turbo" ||
      entry.name === ".next" ||
      entry.name === "dist"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanShellScripts(fullPath, list);
    } else if (/\.(sh|bash)$/i.test(entry.name)) {
      list.push(fullPath);
    }
  }
  return list;
}

const illegalShellScripts = scanShellScripts(WORKSPACE_ROOT);
if (illegalShellScripts.length > 0) {
  console.log(
    `  ${RED}✗ 跨平台规范违规：检测到 ${illegalShellScripts.length} 个平台相关的 Shell 脚本 (*.sh/*.bash)${NC}`,
  );
  for (const item of illegalShellScripts) {
    const rel = path.relative(WORKSPACE_ROOT, item);
    console.log(`    ${RED}• ${rel}${NC}`);
  }
  console.log(
    `  ${YELLOW}💡 规范指引：为了确保 Windows/Mac/Linux 跨平台无缝协同，所有脚本必须统一使用 Node.js (*.mjs)${NC}`,
  );
  process.exit(1);
}
console.log(
  `  • 脚本生态: ${GREEN}合规 (100% 纯 Node.js/*.mjs，无平台耦合 .sh 脚本)${NC}`,
);

// 3. 检查开发环境 (Node / pnpm / Git / Hooks)
console.log(`${BLUE}[3/7] 开发环境:${NC}`);
const REQ_NODE = 22;
const nodeVer = process.version;
const majorNodeVer = Number.parseInt(
  nodeVer.replace(/^v/, "").split(".")[0],
  10,
);
if (Number.isNaN(majorNodeVer) || majorNodeVer < REQ_NODE) {
  console.log(
    `  ${RED}✗ Node.js 版本过低或未识别: ${nodeVer} (需 >= v${REQ_NODE})${NC}`,
  );
  process.exit(1);
}
console.log(`  • Node.js : ${GREEN}${nodeVer}${NC}`);

let pnpmVer = "none";
try {
  pnpmVer = execSync("pnpm -v", { encoding: "utf-8" }).trim();
  console.log(`  • pnpm    : ${GREEN}v${pnpmVer}${NC}`);
} catch {
  console.log(`  ${RED}✗ pnpm 未安装${NC}`);
  process.exit(1);
}

// 配置 Git pre-commit 物理门禁
const gitDir = path.join(WORKSPACE_ROOT, ".git");
if (fs.existsSync(gitDir)) {
  const hookDir = path.join(gitDir, "hooks");
  fs.mkdirSync(hookDir, { recursive: true });
  const preCommitHook = path.join(hookDir, "pre-commit");
  // 跨平台兼容 hook 内容：调用 node scripts/verify.mjs
  const hookContent = `#!/bin/sh
node scripts/verify.mjs
`;
  fs.writeFileSync(preCommitHook, hookContent, {
    encoding: "utf-8",
    mode: 0o755,
  });
  try {
    fs.chmodSync(preCommitHook, 0o755);
  } catch {
    // Windows 上 chmod 可能会静默忽略，无妨
  }
  console.log(`  • Git     : ${GREEN}就绪 (已装载 pre-commit 物理门禁)${NC}`);
} else {
  console.log(`  • Git     : ${GREEN}就绪 (clean restartable)${NC}`);
}

// 4. 环境变量引导检查
console.log(`${BLUE}[4/7] 环境变量检查:${NC}`);
const tenantEnv = path.join(WORKSPACE_ROOT, "apps/tenant/.env.local");
if (!fs.existsSync(tenantEnv)) {
  console.log(
    `  • apps/tenant/.env.local : ${RED}未配置${NC} (可通过复制 apps/tenant/.env.example apps/tenant/.env.local 初始化)`,
  );
} else {
  console.log(`  • apps/tenant/.env.local : ${GREEN}已就绪${NC}`);
}

const controlEnv = path.join(WORKSPACE_ROOT, "apps/control/.env.local");
if (!fs.existsSync(controlEnv)) {
  console.log(
    `  • apps/control/.env.local: ${RED}未配置${NC} (可通过复制 apps/control/.env.example apps/control/.env.local 初始化)`,
  );
} else {
  console.log(`  • apps/control/.env.local: ${GREEN}已就绪${NC}`);
}

// 5. 离线类型与客户端生成（自愈确保干净克隆后开箱即用）
console.log(`${BLUE}[5/7] Prisma 客户端自愈生成 (Turborepo Pipeline):${NC}`);
try {
  execSync("pnpm turbo run generate --output-logs=errors-only", {
    stdio: "inherit",
  });
} catch {
  execSync("pnpm turbo run generate", { stdio: "inherit" });
}
console.log(`  • Prisma Client: ${GREEN}已就绪 (db-control & db-tenant)${NC}`);

// 6. Control DB Day 0 自愈初始化（开发与生产使用相同运行时机制）
if (fs.existsSync(controlEnv)) {
  console.log(`${BLUE}[6/7] Control DB 基线检查:${NC}`);
  try {
    execSync("pnpm db:platform:ensure", { stdio: "inherit" });
  } catch {
    console.error(`  ${RED}✗ Control DB 基线检查失败${NC}`);
    process.exit(1);
  }
} else {
  console.log(`${BLUE}[6/7] Control DB 基线检查:${NC}`);
  console.log("  • 跳过：apps/control/.env.local 未配置");
}

// 7. 会话状态与沙盒检测
console.log(`${BLUE}[7/7] 会话上下文:${NC}`);
const sessionStartScript = path.join(
  WORKSPACE_ROOT,
  ".harness/lifecycle/session-start.mjs",
);
const sessionRes = spawnSync(process.execPath, [sessionStartScript], {
  stdio: "inherit",
});
if (sessionRes.status !== 0) {
  process.exit(sessionRes.status ?? 1);
}

console.log(`${GREEN}✔ 全部自检通过，环境就绪${NC}`);
