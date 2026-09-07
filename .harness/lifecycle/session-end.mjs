#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const workspaceRoot = path.resolve(process.cwd());
const localMember = path.join(workspaceRoot, "member.local.md");

if (fs.existsSync(localMember)) {
  const content = fs.readFileSync(localMember, "utf-8");
  const matchFeature = content.match(
    /active_feature_id:\s*["']?([^"'\s]+)["']?/,
  );
  const feat = matchFeature ? matchFeature[1] : "none";

  if (feat && feat !== "none") {
    const featDir = path.join(workspaceRoot, `.harness/features/${feat}`);
    const progressPath = path.join(featDir, "progress.md");
    const handoffPath = path.join(featDir, "handoff.md");

    if (!fs.existsSync(progressPath) || !fs.existsSync(handoffPath)) {
      process.stderr.write(
        `[Session End] 警告: 特性 ${feat} 的 progress.md 或 handoff.md 缺失，请先更新交接状态！\n`,
      );
      process.exit(1);
    }
  }
}

process.stdout.write("  ✔ 会话收尾检查通过，工作区状态安全就绪\n");
