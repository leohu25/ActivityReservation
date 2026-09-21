#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { resolveActiveFeature } from "../../.harness/lifecycle/resolve-feature.mjs";

function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

const workspaceRoot = findWorkspaceRoot();

// 1. 获取 Git 变动文件列表 (包含暂存区与工作区未跟踪文件)
function getChangedFiles() {
  try {
    let hasHead = true;
    try {
      execSync("git rev-parse --verify HEAD", {
        cwd: workspaceRoot,
        stdio: "ignore",
      });
    } catch {
      hasHead = false;
    }

    const output = execSync("git status --porcelain -uall", {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const lines = output.split("\n").filter((l) => l.trim().length > 0);
    const files = [];

    for (const line of lines) {
      let rawPath = line.slice(3).trim();
      if (rawPath.startsWith('"') && rawPath.endsWith('"')) {
        rawPath = rawPath.slice(1, -1);
      }
      let finalPath = rawPath.includes(" -> ")
        ? rawPath.split(" -> ")[1].trim()
        : rawPath;
      if (finalPath.startsWith('"') && finalPath.endsWith('"')) {
        finalPath = finalPath.slice(1, -1);
      }

      if (!hasHead && (finalPath === "docs" || finalPath.startsWith("docs/"))) {
        continue;
      }

      files.push(finalPath);
    }
    return files;
  } catch {
    return [];
  }
}

// 2. 匹配规则转换 (支持目录前缀与简单 glob)
function matchPattern(filePath, pattern) {
  const normFile = filePath.replace(/\\/g, "/");
  let normPat = pattern.replace(/\\/g, "/").trim();
  normPat = normPat.replace(/^[`"']|[`"']$/g, "");

  if (normPat.endsWith("/**")) {
    const prefix = normPat.slice(0, -3);
    return normFile.startsWith(prefix);
  }
  if (normPat.endsWith("/")) {
    return normFile.startsWith(normPat);
  }
  if (normPat.includes("*")) {
    const escaped = normPat
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/(?<!\.)\*/g, "[^/]*");
    return new RegExp(`^${escaped}$`).test(normFile);
  }
  if (normFile === normPat || normFile.startsWith(normPat + "/")) {
    return true;
  }
  return normFile === normPat;
}

// 3. 解析当前激活特性 (三级自适应：member.local.md -> Git 分支 -> feature_list.json)
const active = resolveActiveFeature(workspaceRoot);
const activeFeature = active.id;

if (!activeFeature) {
  process.stdout.write("• 沙盒边界: 全局基线模式 (跳过物理拦截)\n");
  process.exit(0);
}

const scopeFile = path.join(
  workspaceRoot,
  `.harness/features/${activeFeature}/scope.md`,
);
if (!fs.existsSync(scopeFile)) {
  process.stderr.write(
    `\x1b[31m✗ [Sandbox Boundary Error] 激活特性 [${activeFeature}] 缺少沙盒白名单配置文件: .harness/features/${activeFeature}/scope.md\x1b[0m\n`,
  );
  process.exit(1);
}

// 4. 解析白名单条目
const scopeContent = fs.readFileSync(scopeFile, "utf-8");
const whitelist = [];
const lines = scopeContent.split("\n");

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("- ")) {
    let item = trimmed.slice(2).trim();
    if (item.includes("#")) {
      item = item.split("#")[0].trim();
    }
    item = item.replace(/^[`"']|[`"']$/g, "");
    if (item.length > 0) {
      whitelist.push(item);
    }
  }
}

// 始终允许的基础协作系统文件 (全局基础设施安全区)
const safeInfrastructurePatterns = [
  "feature_list.json",
  "pnpm-lock.yaml",
  "package.json",
  "packages/**/package.json",
  "apps/**/package.json",
  "tooling/**/package.json",
  "packages/runtime/**",
  "packages/domains/*/prisma/schema.prisma",
  "packages/platform/*/prisma/schema.prisma",
  ".harness/**",
  "scripts/**",
  "docs/**",
  "AGENTS.md",
  ".agents/**",
];

// 5. 校验工作区全部变动
const changedFiles = getChangedFiles();
const warnings = [];

for (const file of changedFiles) {
  // 检查是否命中安全基础设施
  const isSafe = safeInfrastructurePatterns.some((pattern) =>
    matchPattern(file, pattern),
  );
  if (isSafe) continue;

  // 检查是否在白名单中
  const isAllowed = whitelist.some((pattern) => matchPattern(file, pattern));

  if (!isAllowed) {
    const isUnderFeatureDir = matchPattern(
      file,
      `.harness/features/${activeFeature}/**`,
    );
    const isDerived =
      file.includes(".test.") ||
      file.includes(".spec.") ||
      file.endsWith(".md") ||
      file.endsWith("tsconfig.json") ||
      file.endsWith("prisma.config.ts");

    if (isUnderFeatureDir || isDerived) {
      continue;
    }

    warnings.push(file);
  }
}

if (warnings.length > 0) {
  process.stdout.write(
    `\x1b[33m⚠ [Sandbox Boundary Warning] 检测到未在 scope.md 中的扩展改动文件:\x1b[0m\n` +
      `  当前激活特性: \x1b[33m${activeFeature}\x1b[0m\n` +
      `  白名单配置文件: \x1b[34m.harness/features/${activeFeature}/scope.md\x1b[0m\n`,
  );
  for (const w of warnings) {
    process.stdout.write(`    \x1b[33m• ${w}\x1b[0m\n`);
  }
}

process.stdout.write(
  `• 沙盒边界: \x1b[32m通过${warnings.length > 0 ? " (已提示边界警告，不污染文件)" : ""}\x1b[0m (${changedFiles.length} files checked)\n`,
);
process.exit(0);
