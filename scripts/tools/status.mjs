#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let WORKSPACE_ROOT = "";

try {
  WORKSPACE_ROOT = execSync("git rev-parse --show-toplevel", {
    encoding: "utf-8",
  }).trim();
} catch {
  WORKSPACE_ROOT = path.resolve(__dirname, "../..");
}

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

console.log(`${BLUE}>>> 工作区协同状态${NC}`);

// 1. 检查当前激活特性 (三级自适应解析)
const resolveFeatureScript = path.join(
  WORKSPACE_ROOT,
  ".harness/lifecycle/resolve-feature.mjs",
);
let featInfo = "none|global";
try {
  featInfo = execSync(`node "${resolveFeatureScript}" --source`, {
    encoding: "utf-8",
  }).trim();
} catch {
  featInfo = "none|global";
}
const [activeFeat, featSource] = featInfo.split("|");

if (activeFeat && activeFeat !== "none") {
  console.log(
    `• 协同上下文: 激活特性: ${GREEN}${activeFeat}${NC} (来源: ${featSource || "unknown"})`,
  );
} else {
  console.log(`• 协同上下文: ${YELLOW}全局基线模式 (未锁定特性)${NC}`);
}

// 2. 检查 Git 仓库状态
const gitDir = path.join(WORKSPACE_ROOT, ".git");
if (fs.existsSync(gitDir)) {
  process.chdir(WORKSPACE_ROOT);
  let currentBranch = "main";
  try {
    currentBranch =
      execSync("git branch --show-current", { encoding: "utf-8" }).trim() ||
      "main";
  } catch {
    currentBranch = "main";
  }

  let currentHash = "init";
  try {
    currentHash =
      execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim() ||
      "init";
  } catch {
    currentHash = "init";
  }

  console.log(
    `• Git 状态  : 分支 ${GREEN}${currentBranch}${NC} (${currentHash})`,
  );

  let repoChanges = "";
  try {
    repoChanges = execSync("git status --short", {
      encoding: "utf-8",
    }).trimEnd();
  } catch {
    repoChanges = "";
  }

  if (!repoChanges) {
    console.log(`• 工作区    : ${GREEN}干净 (无未提交更改)${NC}`);
  } else {
    const lines = repoChanges.split("\n").filter(Boolean);
    console.log(
      `• 工作区    : ${YELLOW}存在 ${lines.length} 处未提交改动:${NC}`,
    );
    for (const line of lines) {
      console.log(`    ${line}`);
    }
  }
}
