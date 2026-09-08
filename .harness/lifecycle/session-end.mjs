#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const workspaceRoot = path.resolve(process.cwd());
const localMember = path.join(workspaceRoot, "member.local.md");
const featureListPath = path.join(workspaceRoot, "feature_list.json");
const rootProgress = path.join(workspaceRoot, "progress.md");
const rootHandoff = path.join(workspaceRoot, "session-handoff.md");

let hasError = false;

process.stdout.write(">>> [Session End] 执行会话收尾与交接状态校验\n");

// 1. 检查根目录全局交接工件
if (fs.existsSync(rootProgress)) {
  process.stdout.write("  • 全局看板: progress.md 存在\n");
} else {
  process.stderr.write("  ✗ 缺少根目录推进看板: progress.md\n");
  hasError = true;
}

if (fs.existsSync(rootHandoff)) {
  process.stdout.write("  • 会话交接: session-handoff.md 存在\n");
} else {
  process.stderr.write("  ✗ 缺少根目录会话交接单: session-handoff.md\n");
  hasError = true;
}

// 2. 检查本地激活特性
let activeFeature = "none";
if (fs.existsSync(localMember)) {
  const content = fs.readFileSync(localMember, "utf-8");
  const matchFeature = content.match(
    /active_feature_id:\s*["']?([^"'\s]+)["']?/,
  );
  activeFeature = matchFeature ? matchFeature[1] : "none";
}

if (activeFeature && activeFeature !== "none") {
  process.stdout.write(`  • 当前激活特性: ${activeFeature}\n`);
  const featDir = path.join(
    workspaceRoot,
    `.harness/features/${activeFeature}`,
  );
  const featProgress = path.join(featDir, "progress.md");
  const featHandoff = path.join(featDir, "handoff.md");

  if (fs.existsSync(featProgress)) {
    process.stdout.write(
      `  • 沙盒进展: .harness/features/${activeFeature}/progress.md 就绪\n`,
    );
  } else {
    process.stderr.write(
      `  ✗ 特性沙盒缺少进展记录: .harness/features/${activeFeature}/progress.md\n`,
    );
    hasError = true;
  }

  if (fs.existsSync(featHandoff)) {
    process.stdout.write(
      `  • 沙盒交接: .harness/features/${activeFeature}/handoff.md 就绪\n`,
    );
  } else {
    process.stderr.write(
      `  ✗ 特性沙盒缺少交接单: .harness/features/${activeFeature}/handoff.md\n`,
    );
    hasError = true;
  }

  // 校验 feature_list.json 中对应的状态与 evidence
  if (fs.existsSync(featureListPath)) {
    try {
      const listData = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
      const featMeta = listData.features?.find((f) => f.id === activeFeature);
      if (featMeta) {
        if (
          featMeta.status === "completed" &&
          (!featMeta.evidence || featMeta.evidence.trim() === "")
        ) {
          process.stderr.write(
            `  ✗ 违规完成: 特性 ${activeFeature} 标记为 completed，但 evidence 证据为空！\n`,
          );
          hasError = true;
        } else {
          process.stdout.write(
            `  • 特性状态: [${activeFeature}] 状态=${featMeta.status}\n`,
          );
        }
      }
    } catch (e) {
      process.stderr.write(`  ✗ feature_list.json 解析失败: ${e.message}\n`);
      hasError = true;
    }
  }
} else {
  process.stdout.write("  • 协同模式: 公共协同 (无激活的单特性锁定)\n");
}

// 3. 检查 Git 工作区变动提示
try {
  const statusOutput = execSync("git status --porcelain", {
    cwd: workspaceRoot,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();

  if (statusOutput.length > 0) {
    const changeCount = statusOutput.split("\n").length;
    process.stdout.write(
      `  • 工作区提示: 检测到 ${changeCount} 个未提交/未暂存改动，请确保已在交接单中说明\n`,
    );
  } else {
    process.stdout.write("  • 工作区状态: 干净 (无未提交改动)\n");
  }
} catch {
  // 非 git 环境忽略
}

if (hasError) {
  process.stderr.write(
    "\n\x1b[31m✗ 会话收尾检查未通过，请补齐上述交接记录后再结束会话！\x1b[0m\n",
  );
  process.exit(1);
} else {
  process.stdout.write("\n\x1b[32m✔ 会话收尾检查通过，工程交接就绪！\x1b[0m\n");
  process.exit(0);
}
