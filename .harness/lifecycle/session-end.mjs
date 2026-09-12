#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { resolveActiveFeature } from "./resolve-feature.mjs";

const workspaceRoot = path.resolve(process.cwd());
const featureListPath = path.join(workspaceRoot, "feature_list.json");

// Fail-only：错误进 errors[]，成功静默（至多一行）
const errors = [];
const active = resolveActiveFeature(workspaceRoot);

// 1. 总账与公共记忆检查
if (!fs.existsSync(featureListPath)) {
  errors.push("缺少全局特性总账: feature_list.json");
}
for (const rel of [
  ".harness/memory/learnings.md",
  ".harness/memory/technical-debt.md",
]) {
  if (!fs.existsSync(path.join(workspaceRoot, rel))) {
    errors.push(`缺少 ${rel}`);
  }
}

// 2. 激活特性沙盒工件与防虚假完成检查
if (active.id) {
  const featDir = path.join(workspaceRoot, `.harness/features/${active.id}`);
  for (const name of ["progress.md", "handoff.md"]) {
    if (!fs.existsSync(path.join(featDir, name))) {
      errors.push(
        `特性沙盒缺少 ${name}: .harness/features/${active.id}/${name}`,
      );
    }
  }
}

if (fs.existsSync(featureListPath)) {
  try {
    const listData = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
    // 防虚假完成：任何标记为 completed 的特性必须具备真实 evidence
    for (const f of listData.features ?? []) {
      if (
        f.status === "completed" &&
        (!f.evidence || f.evidence.trim() === "")
      ) {
        errors.push(`违规完成: ${f.id} 标记 completed 但 evidence 为空`);
      }
    }
  } catch (e) {
    errors.push(`feature_list.json 解析失败: ${e.message}`);
  }
}

// 3. Git 未提交提示（软提示，不计入失败）
let dirtyCount = 0;
try {
  const statusOutput = execSync("git status --porcelain", {
    cwd: workspaceRoot,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();
  dirtyCount = statusOutput
    ? statusOutput.split("\n").filter((l) => l.trim()).length
    : 0;
} catch {
  // 非 git 环境忽略
}

if (errors.length > 0) {
  process.stderr.write("✗ 会话收尾检查未通过:\n");
  for (const e of errors) process.stderr.write(`  • ${e}\n`);
  process.exit(1);
}

const featNote = active.id ? `${active.id} (${active.source})` : "global";
const dirtyNote = dirtyCount > 0 ? ` | dirty ${dirtyCount}` : "";
process.stdout.write(`✔ session-end ok (${featNote}${dirtyNote})\n`);
process.exit(0);
