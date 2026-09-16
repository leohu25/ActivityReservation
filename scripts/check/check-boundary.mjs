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
  "packages/base/db-tenant/prisma/schema.generated.prisma",
  "packages/domains/*/prisma/schema.prisma",
  "packages/platform/*/prisma/schema.prisma",
  "apps/tenant/src/kernel/registry.generated.ts",
  ".harness/features/**",
  ".harness/memory/**",
  ".harness/patches/**",
  "scripts/**",
  "docs/**",
  "AGENTS.md",
  ".agents/**",
];

// 5. 校验工作区全部变动
const changedFiles = getChangedFiles();
const violations = [];

// 自动向当前激活特性的 scope.md 追加白名单条目（格式对齐 ADR-006）
function appendToScope(newRelPath) {
  try {
    let gitHash = "historical";
    try {
      gitHash = execSync(`git log -n 1 --pretty=format:%h -- "${newRelPath}"`, {
        cwd: workspaceRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {}

    const comment = ` # 1 file @ ${gitHash || "head"}，联动修改自动登记`;
    const entry = `- \`${newRelPath}\`${comment}\n`;

    const current = fs.readFileSync(scopeFile, "utf-8");
    if (current.includes(`- \`${newRelPath}\``)) return;

    // 智能插入：优先追加到 ### 联动修改 或 ### 修改白名单，兜底追加到末尾
    if (current.includes("### 联动修改")) {
      const parts = current.split("### 联动修改");
      const updated = parts[0] + "### 联动修改\n" + entry + parts[1];
      fs.writeFileSync(scopeFile, updated, "utf-8");
    } else if (current.includes("## 修改白名单")) {
      const parts = current.split("## 修改白名单");
      const updated = parts[0] + "## 修改白名单\n" + entry + parts[1];
      fs.writeFileSync(scopeFile, updated, "utf-8");
    } else {
      fs.appendFileSync(scopeFile, "\n" + entry, "utf-8");
    }
  } catch (err) {
    console.warn(
      `[Boundary] 自动登记 scope.md 失败 (${newRelPath}):`,
      err.message,
    );
  }
}

for (const file of changedFiles) {
  // 检查是否命中安全基础设施
  const isSafe = safeInfrastructurePatterns.some((pattern) =>
    matchPattern(file, pattern),
  );
  if (isSafe) continue;

  // 检查是否在白名单中
  const isAllowed = whitelist.some((pattern) => matchPattern(file, pattern));

  if (!isAllowed) {
    // 联动智能自动扩围规则：
    // 当变动属于当前特性目录下的测试、文档或衍生配置时，自动追加入 scope.md
    const isUnderFeatureDir = matchPattern(
      file,
      `.harness/features/${activeFeature}/**`,
    );
    const isAutoRecordCandidate =
      file.includes(".test.") ||
      file.includes(".spec.") ||
      file.endsWith(".md") ||
      file.endsWith("tsconfig.json") ||
      file.endsWith("prisma.config.ts");

    if (isUnderFeatureDir || isAutoRecordCandidate) {
      appendToScope(file);
      whitelist.push(file); // 本次检查立即生效
      process.stdout.write(
        `  \x1b[36mℹ [Boundary Auto-Recorded]\x1b[0m 自动登记联动变动至 scope.md: ${file}\n`,
      );
      continue;
    }

    violations.push(file);
  }
}

if (violations.length > 0) {
  process.stdout.write(
    `\x1b[33m⚠ [Sandbox Boundary Warning] 检测到扩展改动文件，已自动记录至 scope.md\x1b[0m\n` +
      `当前激活特性: \x1b[33m${activeFeature}\x1b[0m\n` +
      `白名单配置文件: \x1b[34m.harness/features/${activeFeature}/scope.md\x1b[0m\n\n`,
  );
  for (const v of violations) {
    appendToScope(v);
    process.stdout.write(`    \x1b[33m• [Auto-Recorded] ${v}\x1b[0m\n`);
  }
}

process.stdout.write(
  `• 沙盒边界: \x1b[32m合规/已告警记录\x1b[0m (${changedFiles.length} files checked)\n`,
);
process.exit(0);
