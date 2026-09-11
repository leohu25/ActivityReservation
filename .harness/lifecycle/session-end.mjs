#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const workspaceRoot = path.resolve(process.cwd());
const localMember = path.join(workspaceRoot, "member.local.md");
const featureListPath = path.join(workspaceRoot, "feature_list.json");

// Fail-only：错误进 errors[]，成功静默（至多一行）
const errors = [];
let activeFeature = "none";

if (fs.existsSync(localMember)) {
  const content = fs.readFileSync(localMember, "utf-8");
  const matchFeature = content.match(
    /active_feature_id:\s*["']?([^"'\s]+)["']?/,
  );
  activeFeature = matchFeature ? matchFeature[1] : "none";
}

// 1. 总账与公共记忆
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

// 2. 激活特性沙盒工件
if (activeFeature && activeFeature !== "none") {
  const featDir = path.join(
    workspaceRoot,
    `.harness/features/${activeFeature}`,
  );
  for (const name of ["progress.md", "handoff.md"]) {
    if (!fs.existsSync(path.join(featDir, name))) {
      errors.push(
        `特性沙盒缺少 ${name}: .harness/features/${activeFeature}/${name}`,
      );
    }
  }

  if (fs.existsSync(featureListPath)) {
    try {
      const listData = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
      const featMeta = listData.features?.find((f) => f.id === activeFeature);
      if (
        featMeta?.status === "completed" &&
        (!featMeta.evidence || featMeta.evidence.trim() === "")
      ) {
        errors.push(
          `违规完成: ${activeFeature} 标记 completed 但 evidence 为空`,
        );
      }
    } catch (e) {
      errors.push(`feature_list.json 解析失败: ${e.message}`);
    }
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

const featNote =
  activeFeature && activeFeature !== "none" ? activeFeature : "global";
const dirtyNote = dirtyCount > 0 ? ` | dirty ${dirtyCount}` : "";
process.stdout.write(`✔ session-end ok (${featNote}${dirtyNote})\n`);
process.exit(0);
