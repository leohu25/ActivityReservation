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
  const matchDev = content.match(/developer:\s*["']?([^"'\s]+)["']?/);
  const matchRole = content.match(/role_focus:\s*["']?([^"'\s]+)["']?/);
  const dev = matchDev ? matchDev[1] : "unknown";
  const feat = matchFeature ? matchFeature[1] : "none";
  const role = matchRole ? matchRole[1] : "coordinator";
  process.stdout.write(
    `  • 会话锚点: 开发者 ${dev} | 特性 ${feat} | 角色 @${role}\n`,
  );

  if (feat && feat !== "none") {
    const sandbox = path.join(workspaceRoot, `.harness/features/${feat}`);
    if (fs.existsSync(sandbox)) {
      process.stdout.write(`  • 特性沙盒: .harness/features/${feat}/ 已就绪\n`);
    } else {
      process.stdout.write(`  • 特性沙盒: .harness/features/${feat}/ 待创建\n`);
    }
  }
} else {
  process.stdout.write("  • 会话锚点: 未设定 member.local.md (公共协同模式)\n");
}
