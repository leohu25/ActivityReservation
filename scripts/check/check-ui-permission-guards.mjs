#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * 查找工作区根目录
 */
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
 * 收集指定目录下的所有 .tsx 视图文件
 */
export function walkUiFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (
      entry.name === "node_modules" ||
      entry.name.startsWith(".") ||
      entry.name.includes(".test.") ||
      entry.name.includes(".spec.")
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      walkUiFiles(full, files);
    } else if (entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * 检查单个 UI 文件是否符合权限受控规范
 */
export function checkUiFile(_filePath, content) {
  const issues = [];

  // 1. 检测是否调用了写操作 Action（以 Action 结尾的引入或函数调用）
  const writeActionRegex =
    /(?:create|delete|update|audit|void|submit|batch)\w*Action\b/i;
  const hasWriteAction = writeActionRegex.test(content);

  // 2. 检测是否具备合法的权限受控标记
  // A. 模板级闭环组件（自带字段三态与操作权限）：DataTable、HierarchyWorkspace、FormModal 等，或属于 FormModal 专属子表单
  const hasTemplateGuard =
    /\b(DataTable|HierarchyWorkspace|FormModal|CrudFormModal)\b/.test(
      content,
    ) ||
    /FormModal\.tsx/.test(_filePath) ||
    /Modal\.tsx/.test(_filePath);
  // B. 分子级受控组件
  const hasMoleculeGuard =
    /\b(ActionButton|ActionGroup|AuthGuard|DataTableRowActions)\b/.test(
      content,
    );
  // C. 权限 Hook 判定
  const hasHookGuard = /\b(useAbility|useSubjectCan|useUiAbility)\b/.test(
    content,
  );

  const isGuardProtected = hasTemplateGuard || hasMoleculeGuard || hasHookGuard;

  // 规则 A：调用了写操作 Action，却完全没有受控防线
  if (hasWriteAction && !isGuardProtected) {
    issues.push({
      type: "MISSING_ACTION_GUARD",
      message:
        "文件引入并调用了写操作 Server Action，但未接入任何模板组件 (DataTable/HierarchyWorkspace/FormModal)、受控分子组件 (ActionButton/AuthGuard) 或 useAbility 权限判定。",
    });
  }

  // 规则 B：检测非 Modal 页面中未被受控包裹的高危写操作按钮
  // 排除：表单 Modal 内部的提交按钮（受 FormModal 或 Dialog 提交动作接管）
  const isModalFile = /Modal\.tsx$/.test(_filePath);
  if (!isModalFile) {
    const rawDestructiveButtonRegex =
      /<Button\b(?![^>]*\btype=["']submit["'])[^>]*>(?:(?!<\/Button>)[\s\S])*?(删除|作废|审核|批量删除)[\s\S]*?<\/Button>/g;
    let match;
    while ((match = rawDestructiveButtonRegex.exec(content)) !== null) {
      const matchedSnippet = match[0];
      if (
        !content.includes("AuthGuard") &&
        !content.includes("ActionButton") &&
        !content.includes("DataTableRowActions")
      ) {
        issues.push({
          type: "RAW_DESTRUCTIVE_BUTTON",
          message: `检测到裸渲染的高危操作按钮 [${match[1]}]，未见受控分子组件包裹。请改用 <ActionButton action="..." subject={...}> 或使用 <AuthGuard>。`,
          snippet: matchedSnippet.slice(0, 100),
        });
        break;
      }
    }
  }

  return issues;
}

/**
 * 严格仅扫描业务垂直切片 (packages/domains/*) 下的 UI 视图，不扫描底层基建与平台设置
 */
export function runUiPermissionCheck(workspaceRoot = findWorkspaceRoot()) {
  const domainsDir = path.join(workspaceRoot, "packages/domains");

  if (!fs.existsSync(domainsDir)) return [];
  const allUiFiles = walkUiFiles(domainsDir);

  const results = [];
  for (const file of allUiFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const fileIssues = checkUiFile(file, content);
    if (fileIssues.length > 0) {
      results.push({
        file: path.relative(workspaceRoot, file),
        issues: fileIssues,
      });
    }
  }

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = findWorkspaceRoot();
  console.log("正在执行 UI 权限受控与分子组件门禁扫描...");
  const failures = runUiPermissionCheck(root);

  if (failures.length === 0) {
    console.log("✓ 全量业务 UI 权限受控规范检测通过，未发现裸奔写操作！");
    process.exit(0);
  } else {
    console.error(
      `\n❌ 检测到 ${failures.length} 个 UI 组件存在权限受控隐患：\n`,
    );
    for (const f of failures) {
      console.error(`• 文件: ${f.file}`);
      for (const issue of f.issues) {
        console.error(`  - [${issue.type}] ${issue.message}`);
      }
    }
    console.error(
      "\n请根据 Atomic Design 规范，改用分子级组件 (ActionButton/AuthGuard) 或标准模板 (DataTable/HierarchyWorkspace)。\n",
    );
    process.exit(1);
  }
}
