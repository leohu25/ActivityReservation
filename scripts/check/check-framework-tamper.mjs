#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

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

/** 框架级核心基础设施匹配规则 */
export const FRAMEWORK_PATTERNS = [
  /^packages\/base\//,
  /^packages\/platform\//,
  /^apps\/[a-zA-Z0-9_-]+\/src\/kernel\//,
  /^tooling\//,
  /^scripts\//,
  /^eslint.*\.mjs$/,
];

/** 自动生成的动态派生产物规则（由构建/扫描脚本动态生成，属于编译衍生品，一律豁免防篡改告警） */
export const EXEMPT_GENERATED_PATTERNS = [
  /\.generated\.(ts|tsx|js|mjs)$/,
  /\/registry\.generated\.ts$/,
  /packages\/runtime\/db\/prisma\/schema\.prisma$/,
];

/**
 * 判定指定文件是否属于平台/框架基础设施
 */
export function isFrameworkFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  // 优先排除自动生成的构建衍生品
  if (EXEMPT_GENERATED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }
  return FRAMEWORK_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * 获取本次即将提交/变动的 Git 文件清单
 * 优先取暂存区 (staged files)，如果在 pre-commit 之外运行则取当前变动文件
 */
export function getStagedOrChangedFiles(workspaceRoot) {
  try {
    // 优先读取 Git 暂存区 (git diff --cached)
    const stagedOutput = execSync("git diff --cached --name-only", {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();

    if (stagedOutput.length > 0) {
      return stagedOutput
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
    }

    // 若暂存区为空（如脱机手动运行 scripts/verify.mjs），检查当前工作区变动
    const statusOutput = execSync("git status --porcelain -uall", {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const lines = statusOutput.split("\n").filter((l) => l.trim().length > 0);
    const files = [];

    for (const line of lines) {
      let rawPath = line.slice(3).trim();
      if (rawPath.startsWith('"') && rawPath.endsWith('"')) {
        rawPath = rawPath.slice(1, -1);
      }
      let finalPath = rawPath.includes(" -> ")
        ? rawPath.split(" -> ")[1].trim()
        : rawPath;
      files.push(finalPath);
    }

    return files;
  } catch {
    return [];
  }
}

/**
 * 检查当前会话是否具备框架层级改动的人工明确授权
 */
export function hasFrameworkChangeConfirmation(workspaceRoot) {
  if (process.env.FRAMEWORK_CHANGE_CONFIRMED === "1") {
    return true;
  }
  const flagFile = path.join(
    workspaceRoot,
    ".git/FRAMEWORK_CHANGE_CONFIRMED",
  );
  if (fs.existsSync(flagFile)) {
    // 成功读取后自动消费清理，保证单次提交单次生效
    try {
      fs.unlinkSync(flagFile);
    } catch {}
    return true;
  }
  return false;
}

/**
 * 核心检查执行器
 */
export function checkFrameworkTamper(
  workspaceRoot = findWorkspaceRoot(),
  customFiles,
  customConfirmed,
) {
  const files = customFiles || getStagedOrChangedFiles(workspaceRoot);
  const isConfirmed =
    customConfirmed !== undefined
      ? customConfirmed
      : hasFrameworkChangeConfirmation(workspaceRoot);

  const frameworkFiles = files.filter((f) => isFrameworkFile(f));

  if (frameworkFiles.length === 0) {
    return {
      passed: true,
      hasFrameworkChanges: false,
      frameworkFiles: [],
    };
  }

  // 检测到框架核心改动
  if (isConfirmed) {
    return {
      passed: true,
      hasFrameworkChanges: true,
      frameworkFiles,
      confirmed: true,
    };
  }

  return {
    passed: false,
    hasFrameworkChanges: true,
    frameworkFiles,
    confirmed: false,
  };
}

function main() {
  const workspaceRoot = findWorkspaceRoot();
  const result = checkFrameworkTamper(workspaceRoot);

  if (!result.hasFrameworkChanges) {
    process.stdout.write(
      "• 框架保护: \x1b[32m通过\x1b[0m (未触碰底层框架与平台基础设施)\n",
    );
    process.exit(0);
  }

  if (result.passed && result.confirmed) {
    process.stdout.write(
      `• 框架保护: \x1b[33m已人工确认授权\x1b[0m (包含 ${result.frameworkFiles.length} 个框架基础设施文件)\n`,
    );
    process.exit(0);
  }

  // 触发阻断告警
  process.stderr.write(
    `\n\x1b[41m\x1b[37m 🚨【框架基础设施改动拦截告警 (Framework Modification Alert)】 \x1b[0m\n\n`,
  );
  process.stderr.write(
    `\x1b[31m检测到本次提交涉及底层平台框架核心资产，改动影响范围较大，为防止误触底座已自动阻断提交！\x1b[0m\n\n`,
  );
  process.stderr.write(`\x1b[33m受影响的框架级核心文件清单:\x1b[0m\n`);
  for (const file of result.frameworkFiles) {
    process.stderr.write(`  \x1b[31m✗ ${file}\x1b[0m\n`);
  }

  process.stderr.write(
    `\n\x1b[36m👉 智能体指引: 立即停止自动提交，向用户展示上述变更并主动询问：\x1b[0m\n`,
  );
  process.stderr.write(
    `   \x1b[33m"检测到框架/平台层面的基础设施改动，是否确认提交？"\x1b[0m\n`,
  );
  process.stderr.write(
    `   只有当用户在会话中明确回复确认后，方可带上授权标识进行提交。\n\n`,
  );

  process.exit(1);
}

if (process.argv[1] === path.resolve(process.cwd(), "scripts/check/check-framework-tamper.mjs")) {
  main();
}
