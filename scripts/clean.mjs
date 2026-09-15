#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "..");

const targets = [
  path.join(WORKSPACE_ROOT, ".turbo"),
  path.join(WORKSPACE_ROOT, "apps/control/.next"),
  path.join(WORKSPACE_ROOT, "apps/tenant/.next"),
];

let cleanedCount = 0;

for (const target of targets) {
  if (fs.existsSync(target)) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      const relPath = path.relative(WORKSPACE_ROOT, target);
      process.stdout.write(`  • 清理缓存: ${relPath}\n`);
      cleanedCount++;
    } catch {
      process.stderr.write(`  ! 清理失败: ${target}\n`);
    }
  }
}

if (cleanedCount === 0) {
  process.stdout.write("  • 缓存已是干净状态 (无残留 .turbo 或 .next)\n");
} else {
  process.stdout.write("✔ 缓存清理完成\n");
}
