#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const workspaceRoot = path.resolve(process.cwd());

// 1. 获取 Git 变动文件列表 (包含暂存区与工作区未跟踪文件)
function getChangedFiles() {
  try {
    // 检查是否有 HEAD commit
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
      // porcelain 格式前两个字符为状态标记，后面为文件路径（若重命名有 " -> "）
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

      // 若处于 0 commit 的初始仓库初始化阶段，已有的 docs/ 架构规范属于项目底座只读事实，予以放行
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
  // 规范化路径分隔符
  const normFile = filePath.replace(/\\/g, "/");
  let normPat = pattern.replace(/\\/g, "/").trim();

  // 去除可能的首尾反引号或引号
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
  // 目录无斜杠结尾但被当作目录写在白名单（如 scripts）
  if (normFile === normPat || normFile.startsWith(normPat + "/")) {
    return true;
  }
  return normFile === normPat;
}

// 3. 解析 active feature
const memberFile = path.join(workspaceRoot, "member.local.md");
if (!fs.existsSync(memberFile)) {
  process.stdout.write("• 沙盒边界: 未设定 member.local.md (跳过物理拦截)\n");
  process.exit(0);
}

const memberContent = fs.readFileSync(memberFile, "utf-8");
const matchFeature = memberContent.match(
  /active_feature_id:\s*["']?([^"'\s]+)["']?/,
);
const activeFeature = matchFeature ? matchFeature[1] : null;

if (!activeFeature || activeFeature === "none") {
  process.stdout.write("• 沙盒边界: 无激活特性 (跳过物理拦截)\n");
  process.exit(0);
}

const scopeFile = path.join(
  workspaceRoot,
  `.harness/features/${activeFeature}/scope.md`,
);
if (!fs.existsSync(scopeFile)) {
  process.stderr.write(
    `\x1b[31m[Boundary Error] 激活特性 [${activeFeature}] 缺少 .harness/features/${activeFeature}/scope.md 边界文件！\x1b[0m\n`,
  );
  process.exit(1);
}

// 4. 解析 scope.md 中的白名单
const scopeContent = fs.readFileSync(scopeFile, "utf-8");
const whitelist = [];

// 提取 "允许修改" 区块中的列表项
const lines = scopeContent.split("\n");
let inWhitelistSection = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("## 允许修改")) {
    inWhitelistSection = true;
    continue;
  }
  if (inWhitelistSection && trimmed.startsWith("## ")) {
    inWhitelistSection = false;
    continue;
  }
  if (inWhitelistSection && trimmed.startsWith("- ")) {
    const item = trimmed.slice(2).trim();
    if (item) {
      whitelist.push(item);
    }
  }
}

// 5. 注入通用合规放行项 (协同元数据、特性沙盒与公共记忆库)
const universalAllowed = [
  "member.local.md",
  "member.local.example.md",
  "feature_list.json",
  ".harness/memory/**",
  `.harness/features/${activeFeature}/**`,
];

const allPatterns = [...whitelist, ...universalAllowed];

// 6. 检查变动文件
const changedFiles = getChangedFiles();
if (changedFiles.length === 0) {
  process.stdout.write("• 沙盒边界: 工作区无修改 (合规)\n");
  process.exit(0);
}

const violations = [];

for (const file of changedFiles) {
  const isAllowed = allPatterns.some((pattern) => matchPattern(file, pattern));
  if (!isAllowed) {
    violations.push(file);
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `\x1b[31m✗ [Boundary Violation] 发现 ${violations.length} 个文件越权修改 (当前特性: ${activeFeature}):\x1b[0m\n`,
  );
  for (const v of violations) {
    process.stderr.write(`    \x1b[33m• ${v}\x1b[0m\n`);
  }
  process.stderr.write(
    `\x1b[31m请查阅 .harness/features/${activeFeature}/scope.md 白名单。若需记录非当前特性缺陷，请统一登记至 .harness/memory/technical-debt.md\x1b[0m\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `• 沙盒边界: \x1b[32m合规\x1b[0m (${changedFiles.length} 个变动文件均在 [${activeFeature}] 白名单内)\n`,
);
process.exit(0);
