#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * 架构规范硬门禁：防止跨包组件穿透与导入坏味道 (No Leaky Imports)
 * 
 * 铁律：
 * 1. 严禁外部包穿透引用 @base/ui 内部私有源码路径（如 @base/ui/src/*、../../base/ui/src/*）；
 * 2. 外部包引用 UI 组件，唯一合法入口必须是 @base/ui（或公共对外导出的标准子包）；
 * 3. 严禁在代码中出现 '@/components/ui/*'、'#/components/ui/*' 跨包翻墙别名。
 */

function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

const workspaceRoot = findWorkspaceRoot();

function scanFiles(dir, exts, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "dist" ||
      entry.name === ".git"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFiles(fullPath, exts, results);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const scanDirs = [
  path.join(workspaceRoot, "apps"),
  path.join(workspaceRoot, "packages/domains"),
  path.join(workspaceRoot, "packages/platform"),
  path.join(workspaceRoot, "packages/runtime"),
  path.join(workspaceRoot, "packages/biz-shared"),
];

const targetFiles = scanDirs.flatMap((d) => scanFiles(d, [".ts", ".tsx"]));
const violations = [];

const FORBIDDEN_PATTERNS = [
  {
    regex: /from\s+["'].*\/base\/ui\/src\/.*["']/g,
    message: "严禁跨包通过相对路径 ../../base/ui/src/ 穿透引用组件库私有源码，请统一使用 import from '@base/ui'",
  },
  {
    regex: /from\s+["']@base\/ui\/src\/.*["']/g,
    message: "严禁直接引用 @base/ui/src/* 私有源码路径，请统一使用 import from '@base/ui'",
  },
  {
    regex: /from\s+["']@\/components\/ui\/.*["']/g,
    message: "严禁使用单体遗留别名 @/components/ui/*，请统一使用 import from '@base/ui'",
  },
];

// 1. 扫描源码文件中的穿透 import
for (const file of targetFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = path.relative(workspaceRoot, file);

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.regex.test(content)) {
      violations.push({
        file: relPath,
        message: rule.message,
      });
    }
  }
}

// 2. 扫描所有子包的 tsconfig.json，严禁在子包 paths 中手写跨包相对路径穿透 (如 ../../base/ui/src/*)
const allTsConfigFiles = scanFiles(workspaceRoot, ["tsconfig.json"]).filter(
  (f) => !f.includes("node_modules") && !f.includes(".next") && !f.includes("dist"),
);

for (const tsconfigFile of allTsConfigFiles) {
  const relPath = path.relative(workspaceRoot, tsconfigFile);
  // 根目录 tsconfig.base.json 属于统一定义，跳过本项子包私有穿透校验
  if (relPath === "tsconfig.base.json" || relPath === "tsconfig.json") {
    continue;
  }

  try {
    const raw = fs.readFileSync(tsconfigFile, "utf-8");
    // 去除注释后解析 JSON
    const cleanJson = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    const parsed = JSON.parse(cleanJson);
    const paths = parsed.compilerOptions?.paths || {};

    for (const [alias, targets] of Object.entries(paths)) {
      const targetArray = Array.isArray(targets) ? targets : [targets];
      for (const t of targetArray) {
        if (typeof t === "string" && (t.includes("../") || t.includes("..\\"))) {
          // 允许当前包针对内部源码目录的相对定位（例如在 packages/runtime/tenant 中指向本地），严禁指向兄弟包源码 packages/ 或 apps/
          if (t.includes("base/ui/src") || t.includes("packages/") || t.includes("apps/")) {
            violations.push({
              file: relPath,
              message: `严禁在子包 tsconfig 的 paths 中手写跨包穿透路径 "${alias}": ["${t}"]，请统一使用 pnpm workspace 与标准包导出！`,
            });
          }
        }
      }
    }
  } catch {}
}

if (violations.length > 0) {
  console.error("\x1b[41m\x1b[37m 门禁阻断: 检测到破坏组件库封装边界的穿透引用坏味道 (Leaky Imports) \x1b[0m\n");
  for (const v of violations) {
    console.error(`  \x1b[31m✖\x1b[0m \x1b[33m${v.file}\x1b[0m: ${v.message}`);
  }
  console.error("\n\x1b[90m请修复上述违规引用，遵循 Workspace 单向依赖契约。\x1b[0m\n");
  process.exit(1);
}

console.log("✔ [check-import-encapsulation] 组件库封装防线检查通过，无穿透导入坏味道。");
