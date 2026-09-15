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

const PATCH_DIR = path.join(WORKSPACE_ROOT, ".harness/patches");
const TECH_DEBT_FILE = path.join(
  WORKSPACE_ROOT,
  ".harness/memory/technical-debt.md",
);

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    '用法: node scripts/tools/save-patch.mjs "补丁描述说明" [可选文件路径...]',
  );
  console.log(
    '示例: node scripts/tools/save-patch.mjs "修复采购计算溢出" packages/features/procurement-center/src/calc.ts',
  );
  process.exit(1);
}

const description = args[0];
const specificFiles = args.slice(1);

fs.mkdirSync(PATCH_DIR, { recursive: true });

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const readableDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

const slug =
  description
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "")
    .slice(0, 30) || "spillover";

const patchFilename = `${timestamp}_${slug}.patch`;
const patchPath = path.join(PATCH_DIR, patchFilename);

let diffOutput = "";
process.chdir(WORKSPACE_ROOT);

if (specificFiles.length === 0) {
  try {
    diffOutput = execSync("git diff HEAD", { encoding: "utf-8" });
  } catch {
    diffOutput = "";
  }
  if (!diffOutput.trim()) {
    try {
      diffOutput = execSync("git diff", { encoding: "utf-8" });
    } catch {
      diffOutput = "";
    }
  }
} else {
  const quotedFiles = specificFiles.map((f) => `"${f}"`).join(" ");
  try {
    diffOutput = execSync(`git diff HEAD -- ${quotedFiles}`, {
      encoding: "utf-8",
    });
  } catch {
    diffOutput = "";
  }
  if (!diffOutput.trim()) {
    try {
      diffOutput = execSync(`git diff -- ${quotedFiles}`, {
        encoding: "utf-8",
      });
    } catch {
      diffOutput = "";
    }
  }
}

if (!diffOutput.trim()) {
  if (fs.existsSync(patchPath)) {
    fs.unlinkSync(patchPath);
  }
  console.log("✗ 没有检测到可归档的代码变动 (diff 为空)。");
  process.exit(1);
}

fs.writeFileSync(patchPath, diffOutput, "utf-8");
console.log(`✔ 成功提取代码变动并保存补丁: .harness/patches/${patchFilename}`);

// 自动登记到 .harness/memory/technical-debt.md
if (fs.existsSync(TECH_DEBT_FILE)) {
  const record = `\n### 待合入补丁: ${description} (${timestamp})\n- **补丁归档**: \`.harness/patches/${patchFilename}\`\n- **产生时间**: ${readableDate}\n- **状态**: PENDING_MERGE\n`;
  fs.appendFileSync(TECH_DEBT_FILE, record, "utf-8");
  console.log("✔ 已自动登记至 .harness/memory/technical-debt.md");
}

console.log("\n💡 提示: 若需将该变动从当前工作区恢复/清理，可按需执行:");
if (specificFiles.length > 0) {
  console.log(`   git checkout -- ${specificFiles.join(" ")}`);
} else {
  console.log(
    "   git restore .  (或保留并另建分支 git checkout -b feat/spillover)",
  );
}
