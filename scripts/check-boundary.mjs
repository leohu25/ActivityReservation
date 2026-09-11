#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const workspaceRoot = path.resolve(process.cwd());

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

// 4. 解析 scope.md 中的白名单（支持主白名单与附带联动修改 Spillover 白名单）
const scopeContent = fs.readFileSync(scopeFile, "utf-8");
const whitelist = [];
const spilloverList = [];

const lines = scopeContent.split("\n");
let currentSection = null;

for (const line of lines) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith("## 允许修改") ||
    trimmed.startsWith("## 修改白名单")
  ) {
    currentSection = "whitelist";
    continue;
  }
  if (
    trimmed.startsWith("## 附带修改") ||
    trimmed.startsWith("## 联动修改") ||
    trimmed.startsWith("## 附带与前置联动") ||
    trimmed.toLowerCase().includes("spillover")
  ) {
    currentSection = "spillover";
    continue;
  }
  if (trimmed.startsWith("## ")) {
    currentSection = null;
    continue;
  }

  if (currentSection && trimmed.startsWith("- ")) {
    // 允许在列表项后附加注释，如 `- packages/db-tenant/** # 理由：新增字段`
    let item = trimmed.slice(2).trim();
    if (item.includes("#")) {
      item = item.split("#")[0].trim();
    }
    if (item) {
      if (currentSection === "whitelist") {
        whitelist.push(item);
      } else {
        spilloverList.push(item);
      }
    }
  }
}

// 5. 注入通用合规放行项 (协同元数据、特性沙盒、公共记忆库与技能、临时补丁区、旧废弃文件删除放行)
const universalAllowed = [
  "member.local.md",
  "member.local.example.md",
  "feature_list.json",
  "skills-lock.json",
  "progress.md",
  "session-handoff.md",
  ".agents/skills/**",
  ".harness/memory/**",
  ".harness/patches/**",
  `.harness/features/${activeFeature}/**`,
];

// 6. 检查变动文件
const changedFiles = getChangedFiles();
if (changedFiles.length === 0) {
  process.stdout.write("• 沙盒边界: 工作区无修改 (合规)\n");
  process.exit(0);
}

const violations = [];
const spilloverHits = [];

for (const file of changedFiles) {
  const inMainOrUniversal = [...whitelist, ...universalAllowed].some((pat) =>
    matchPattern(file, pat),
  );
  if (inMainOrUniversal) {
    continue;
  }

  const inSpillover = spilloverList.some((pat) => matchPattern(file, pat));
  if (inSpillover) {
    spilloverHits.push(file);
    continue;
  }

  violations.push(file);
}

if (spilloverHits.length > 0) {
  process.stdout.write(
    `  ℹ 检测到 ${spilloverHits.length} 个合法附带联动修改 (Spillover)，请确保已在沙盒 handoff.md 记录理由。\n`,
  );
}

if (violations.length > 0) {
  process.stdout.write(
    `  \x1b[33m⚠ [Boundary Warning] 检测到 ${violations.length} 个非白名单边界文件变动 (当前特性: ${activeFeature}):\x1b[0m\n`,
  );
  for (const v of violations) {
    process.stdout.write(`      \x1b[33m• ${v}\x1b[0m\n`);
  }
  process.stdout.write(
    `    \x1b[90m> 提示：当前已由阻断改为告警模式，不会拦截提交。请确保已在特性沙盒 handoff.md 或 scope.md 中记录扩围理由。\x1b[0m\n`,
  );
  process.stdout.write(
    `• 沙盒边界: \x1b[33m告警通过\x1b[0m (${changedFiles.length} 个变动文件，其中 ${violations.length} 个附带修改已提示记录)\n`,
  );
  process.exit(0);
}

process.stdout.write(
  `• 沙盒边界: \x1b[32m合规\x1b[0m (${changedFiles.length} 个变动文件均在 [${activeFeature}] 授权范围内核准)\n`,
);
process.exit(0);
