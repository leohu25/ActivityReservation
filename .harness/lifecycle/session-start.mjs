#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { resolveActiveFeature } from "./resolve-feature.mjs";

const workspaceRoot = path.resolve(process.cwd());
const active = resolveActiveFeature(workspaceRoot);

if (active.id) {
  process.stdout.write(
    `  • 会话锚点: 激活特性 ${active.id} (来源: ${active.source}) | 模式 @${active.role}\n`,
  );
  const sandbox = path.join(workspaceRoot, `.harness/features/${active.id}`);
  if (fs.existsSync(sandbox)) {
    process.stdout.write(
      `  • 特性沙盒: .harness/features/${active.id}/ 已就绪\n`,
    );
  } else {
    process.stdout.write(
      `  • 特性沙盒: .harness/features/${active.id}/ (目录不存在)\n`,
    );
  }
} else {
  process.stdout.write("  • 会话锚点: 全局基线模式 (无进行中特性锁定)\n");
}
