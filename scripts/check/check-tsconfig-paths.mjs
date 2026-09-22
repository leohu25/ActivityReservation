#!/usr/bin/env node

/**
 * 架构规范硬门禁：拦截 tsconfig 跨包路径穿透与非法别名覆盖 (Check TSConfig Path Integrity)
 *
 * 核心规约：
 * 1. 在 pnpm workspace 架构下，工作区兄弟包必须通过 package.json dependencies ("workspace:*")
 *    及 exports 字段由 node_modules 符号链接自然解析，严禁在子包 tsconfig.json 中声明其他包的别名；
 * 2. 严禁在任何子包的 tsconfig.json 中使用以 ".." 开头的相对路径穿透到外部目录（如 "../../domains/..."）；
 * 3. 子包内部的 paths 仅允许映射当前包内部源码（如 "@/*": ["./src/*"] 或私有路径 "#components/*"）。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

/**
 * 健壮的 JSONC 去注释与尾随逗号处理（不破坏字符串内部的 /* 或 //）
 */
export function stripJsonComments(jsonString) {
  let isInsideString = false;
  let isInsideSingleLineComment = false;
  let isInsideMultiLineComment = false;
  let stringDelimiter = "";
  let result = "";

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    const nextChar = jsonString[i + 1];

    if (isInsideSingleLineComment) {
      if (char === "\n" || char === "\r") {
        isInsideSingleLineComment = false;
        result += char;
      }
    } else if (isInsideMultiLineComment) {
      if (char === "*" && nextChar === "/") {
        isInsideMultiLineComment = false;
        i++;
      }
    } else if (isInsideString) {
      result += char;
      if (char === "\\" && i + 1 < jsonString.length) {
        result += jsonString[++i];
      } else if (char === stringDelimiter) {
        isInsideString = false;
      }
    } else {
      if (char === "/" && nextChar === "/") {
        isInsideSingleLineComment = true;
        i++;
      } else if (char === "/" && nextChar === "*") {
        isInsideMultiLineComment = true;
        i++;
      } else if (char === '"' || char === "'") {
        isInsideString = true;
        stringDelimiter = char;
        result += char;
      } else {
        result += char;
      }
    }
  }

  // 移除对象或数组末尾的多余逗号 (trailing commas)
  return result.replace(/,\s*([\]}])/g, "$1");
}

/**
 * 扫描指定目录下的所有子包 tsconfig 文件（排除 node_modules, .next, dist 等缓存构建产物）
 */
export function findTsconfigFiles(workspaceRoot) {
  const tsconfigFiles = [];
  const scanDirs = [
    path.join(workspaceRoot, "apps"),
    path.join(workspaceRoot, "packages"),
    path.join(workspaceRoot, "tooling"),
  ];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist" ||
        entry.name === ".turbo" ||
        entry.name === ".git"
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.startsWith("tsconfig") && entry.name.endsWith(".json")) {
        tsconfigFiles.push(fullPath);
      }
    }
  }

  for (const d of scanDirs) {
    walk(d);
  }

  return tsconfigFiles;
}

/** 保护的 Monorepo 工作区包前缀 */
const WORKSPACE_PACKAGE_PREFIXES = [
  "@base/",
  "@domain/",
  "@platform/",
  "@biz/",
  "@runtime/",
  "@tool/",
];

/**
 * 校验单个 tsconfig.json 文件中的 paths 配置
 *
 * @param {string} tsconfigPath 绝对路径
 * @param {string} [rawContent] 可选直接传入内容（便于单测）
 * @param {string} [customWorkspaceRoot] 可选根目录
 * @returns {Array<{ file: string, key: string, target: string, message: string }>} 违规项列表
 */
export function validateTsconfigPaths(
  tsconfigPath,
  rawContent,
  customWorkspaceRoot,
) {
  const workspaceRoot = customWorkspaceRoot || findWorkspaceRoot();
  const pkgDir = path.dirname(tsconfigPath);
  const relConfigPath = path.relative(workspaceRoot, tsconfigPath).replace(/\\/g, "/");

  const content = rawContent !== undefined ? rawContent : fs.readFileSync(tsconfigPath, "utf-8");
  let parsed;
  try {
    const cleanJson = stripJsonComments(content);
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    return [
      {
        file: relConfigPath,
        key: "syntax",
        target: "",
        message: `tsconfig 文件 JSON 语法解析失败: ${err.message}`,
      },
    ];
  }

  const paths = parsed.compilerOptions?.paths;
  if (!paths || typeof paths !== "object") {
    return [];
  }

  // 尝试读取当前包自身的 package.json 名称
  let currentPkgName = "";
  const pkgJsonPath = path.join(pkgDir, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      currentPkgName = pkg.name || "";
    } catch {}
  }

  const violations = [];

  for (const [key, targets] of Object.entries(paths)) {
    const targetList = Array.isArray(targets) ? targets : [targets];

    // 规则 1：严禁在子包中定义其他 workspace 包的映射（必须依赖 pnpm workspace 与 node_modules）
    const isOtherWorkspacePackage =
      WORKSPACE_PACKAGE_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      (!currentPkgName || (!key.startsWith(currentPkgName) && key !== currentPkgName));

    if (isOtherWorkspacePackage) {
      violations.push({
        file: relConfigPath,
        key,
        target: targetList.join(", "),
        message: `严禁在子包 tsconfig.json 中覆写工作区包 [${key}] 的路径映射。请在 package.json 显式声明 dependencies 并通过 node_modules 自然解析。`,
      });
      continue;
    }

    // 规则 2：严禁任何指向子包外部目录的相对路径穿透（例如以 ".." 开头）
    for (const target of targetList) {
      if (typeof target !== "string") continue;

      const normTarget = target.replace(/\\/g, "/");
      const isLeaky =
        normTarget.startsWith("../") ||
        normTarget.includes("/../") ||
        path.isAbsolute(normTarget);

      if (isLeaky) {
        violations.push({
          file: relConfigPath,
          key,
          target: normTarget,
          message: `严禁在 tsconfig paths 中使用跨包相对路径穿透 [${normTarget}]。子包内部别名只允许映射自身源码（如 "./src/*"）。`,
        });
      }
    }
  }

  return violations;
}

export function checkAllTsconfigs(workspaceRoot = findWorkspaceRoot()) {
  const tsconfigFiles = findTsconfigFiles(workspaceRoot);
  const allViolations = [];

  for (const file of tsconfigFiles) {
    const fileViolations = validateTsconfigPaths(file, undefined, workspaceRoot);
    allViolations.push(...fileViolations);
  }

  return allViolations;
}

function main() {
  const workspaceRoot = findWorkspaceRoot();
  const violations = checkAllTsconfigs(workspaceRoot);

  if (violations.length > 0) {
    process.stderr.write(
      `\x1b[31m✗ [TSConfig Path Violations] 发现 ${violations.length} 处违背工作区包解析规范的 tsconfig 路径映射:\x1b[0m\n`,
    );
    for (const v of violations) {
      process.stderr.write(
        `    \x1b[33m• ${v.file}\x1b[0m -> 别名: \x1b[36m"${v.key}"\x1b[0m 映射: \x1b[90m"${v.target}"\x1b[0m\n      \x1b[31m${v.message}\x1b[0m\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    "• TSConfig 规范: \x1b[32m通过\x1b[0m (全仓子包零跨包相对路径穿透与非法别名覆盖)\n",
  );
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
