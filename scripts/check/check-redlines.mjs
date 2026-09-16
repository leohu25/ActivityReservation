#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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

// 需要扫描的目录
const scanRoots = ["apps", "packages"];

// 忽略的文件和目录模式
const ignorePatterns = [
  /node_modules/,
  /\.next/,
  /dist/,
  /\.turbo/,
  /\.git/,
  /\.d\.ts$/,
  /permissions\.ts$/, // 权限声明文件本身允许定义字面量
  /test-fixtures/,
];

function shouldIgnore(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  return ignorePatterns.some((pattern) => pattern.test(norm));
}

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnore(fullPath)) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = [];
for (const root of scanRoots) {
  walkDir(path.join(workspaceRoot, root), allFiles);
}

if (allFiles.length === 0) {
  process.stdout.write("• 红线扫描: 业务源码目录尚未初始化 (跳过扫描)\n");
  process.exit(0);
}

const violations = [];

// 规则 1：严禁直接引用 process.env.DATABASE_URL (除 packages/base/db-control 允许连接 Control DB)
const databaseUrlRegex = /process\.env\.DATABASE_URL/;

// 规则 2：严禁手写旧版魔术权限字符串或绕过授权体系，例如 hasPermission("..."), <Can permission="..."
const magicPermissionRegexes = [
  /hasPermission\s*\(\s*["'`][a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+["'`]\s*\)/,
  /requirePermission\s*\(\s*["'`][a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+["'`]\s*\)/,
  /<Can\s+[^>]*permission\s*=\s*["'][a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+["']/,
];

// 规则 3：Server Component 内部严禁自发 HTTP fetch('/api/...') 绕调
const serverSelfFetchRegex =
  /fetch\s*\(\s*["'`](\/api\/|https?:\/\/[^/]+\/api\/)/;

for (const filePath of allFiles) {
  const relPath = path.relative(workspaceRoot, filePath).replace(/\\/g, "/");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // 1. 检查 DATABASE_URL 泄露
  if (!relPath.startsWith("packages/base/db-control/")) {
    lines.forEach((line, idx) => {
      if (databaseUrlRegex.test(line) && !line.includes("// redline-ignore")) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁业务代码直连 DATABASE_URL (必须通过 TenantDbManager 或 TenantContext)",
          code: line.trim(),
        });
      }
    });
  }

  // 1.1 检查 RSC 页面严禁将 Query 函数或普通服务端函数作为 prop 传递给 Client Component
  if (relPath.includes("apps/") && relPath.endsWith("/page.tsx")) {
    lines.forEach((line, idx) => {
      const passFunctionPropRegex =
        /<\w+[^>]*\b\w+(?:Action|Query|Handler|Fn)\s*=\s*\{(?:\s*[a-zA-Z0-9_]+Query|\s*(?:async\s*)?\([^)]*\)\s*=>)/;
      const directQueryPropRegex =
        /\b\w+(?:Action|Handler|Fn|Func)?\s*=\s*\{\s*([a-zA-Z0-9_]*Query)\s*\}/;
      if (
        (passFunctionPropRegex.test(line) || directQueryPropRegex.test(line)) &&
        !line.includes("// redline-ignore")
      ) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁在 RSC 页面中将 Query 函数作为 prop 直接传递给 Client 组件 (Functions cannot be passed directly to Client Components)",
          code: line.trim(),
        });
      }
    });
  }

  // 2. 检查裸写权限字符串
  lines.forEach((line, idx) => {
    for (const reg of magicPermissionRegexes) {
      if (reg.test(line) && !line.includes("// redline-ignore")) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁绕过授权体系或使用旧版裸写权限字符串 (必须使用 Better Auth statement 与 CASL Ability / @RequireAbility)",
          code: line.trim(),
        });
        break;
      }
    }
  });

  // 3. 检查 Server Component 自发 fetch
  const isClientComponent = lines.some((l) => /^\s*['"]use client['"]/.test(l));
  if (!isClientComponent && relPath.startsWith("apps/tenant/src/app/")) {
    lines.forEach((line, idx) => {
      if (
        serverSelfFetchRegex.test(line) &&
        !line.includes("// redline-ignore")
      ) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "Server Component 严禁 self-fetch 自调用内网 /api (必须直调 Service)",
          code: line.trim(),
        });
      }
    });
  }

  // 4. 检查全页强刷 window.location.reload()
  lines.forEach((line, idx) => {
    if (
      /window\.location\.reload\s*\(/.test(line) &&
      !line.includes("// redline-ignore") &&
      !relPath.includes("OrgSwitcher.tsx") && // 租户物理切换需强制刷新全量 Session 与物理库连接池
      !relPath.includes("RolePermissionManager.tsx")
    ) {
      violations.push({
        file: relPath,
        line: idx + 1,
        rule: "严禁在业务页面调用 window.location.reload() 强刷页面 (必须由 React 状态驱动或调用 router?.refresh())",
        code: line.trim(),
      });
    }
  });

  const isTestFile =
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(relPath) ||
    relPath.includes("/test/") ||
    relPath.includes("/tests/");

  // 4.1 检查原生 confirm / window.confirm 弹窗调用
  // 规则红线 8 / 20：交互单次确认，破坏性操作统一由 ConfirmDialog 提示一次，严禁原生 confirm(...)
  if (!isTestFile && !relPath.startsWith("packages/base/ui/")) {
    lines.forEach((line, idx) => {
      if (/\b(?:window\.)?confirm\s*\(/.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁在业务代码中调用浏览器原生 confirm(...) 弹窗 (必须使用 @base/ui ConfirmDialog 或模态对话框)",
          code: line.trim(),
        });
      }
    });
  }

  // 4.2 检查业务切片内手写裸 DOM 标签 (table / select 等)
  // 规则红线 3：严禁手写裸 DOM 与原生非受控控件，切片界面必须 100% 使用 @base/ui (Table / DataTable / DetailTable / Select / FormModal)
  if (
    !isTestFile &&
    (relPath.startsWith("packages/domains/") ||
      relPath.startsWith("packages/platform/"))
  ) {
    lines.forEach((line, idx) => {
      if (/<table[\s>]/.test(line) && !line.includes("// redline-ignore")) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁在业务切片内手写原生 <table> DOM (必须基于 @base/ui 的 Table / DataTable / DetailTable 套件开发)",
          code: line.trim(),
        });
      }
      if (/<select[\s>]/.test(line) && !line.includes("// redline-ignore")) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁在业务切片内手写原生 <select> DOM (必须使用 @base/ui Select 组件或 FormModal 声明式字段)",
          code: line.trim(),
        });
      }
    });
  }

  // 4.3 检查业务代码中裸写主数据启停状态魔法值 ("ACTIVE" / "DISABLED")
  // 规则红线：禁止使用裸字符串魔法值，必须使用 MasterDataStatus 常量对象 (as const 契约)
  if (
    !isTestFile &&
    (relPath.startsWith("packages/domains/") ||
      relPath.startsWith("packages/platform/") ||
      relPath.startsWith("apps/tenant/"))
  ) {
    const rawActiveDisabledRegex =
      /\bstatus\s*(?:===|!==)\s*["'](ACTIVE|DISABLED)["']|\b(?:nextStatus|targetStatus)\s*=\s*[^;\n]*["'](ACTIVE|DISABLED)["']|\bstatusOptions\s*=\s*\[[^\]]*["'](ACTIVE|DISABLED)["']/;
    lines.forEach((line, idx) => {
      if (
        rawActiveDisabledRegex.test(line) &&
        !line.includes("// redline-ignore")
      ) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "严禁在业务代码中裸写主数据启停状态魔法值 (必须使用 @base/shared 导出的 MasterDataStatus.ACTIVE / DISABLED)",
          code: line.trim(),
        });
      }
    });
  }

  // 5. 检查 UI 组件单元测试文件是否就近放置 (Colocation)
  // 规则：禁止在 UI 包 src 根目录下平铺 *.test.ts / *.test.tsx，组件测试必须与组件同级放置
  const isDirectlyUnderUiSrc =
    /^packages\/base\/ui\/src\/[^/]+\.test\.(ts|tsx)$/.test(relPath);
  if (isDirectlyUnderUiSrc) {
    violations.push({
      file: relPath,
      line: 1,
      rule: "严禁在 packages/base/ui/src 根目录平铺孤儿测试文件 (必须与被测组件同级放置 Colocation，如 components/layout/Sidebar.test.ts)",
      code: relPath,
    });
  }
}

// 规则 6：严禁引入跨包幽灵依赖 (Ghost Dependency)
// 源码中引用了 @base/* 内部包，但该包所在模块的 package.json 中未显式声明依赖
const workspacePackages = [];
function findPackageJsonDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const pkgPath = path.join(full, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          workspacePackages.push({
            dir: full,
            relDir: path.relative(workspaceRoot, full).replace(/\\/g, "/"),
            name: pkgJson.name,
            declaredDeps: new Set([
              ...Object.keys(pkgJson.dependencies || {}),
              ...Object.keys(pkgJson.devDependencies || {}),
              ...Object.keys(pkgJson.peerDependencies || {}),
            ]),
          });
        } catch {}
      }
      findPackageJsonDirs(full);
    }
  }
}

for (const root of scanRoots) {
  const fullRoot = path.join(workspaceRoot, root);
  if (fs.existsSync(fullRoot)) {
    findPackageJsonDirs(fullRoot);
  }
}

const internalImportRegex =
  /from\s+["'](@base\/[^"'/]+)(?:\/[^"']*)?["']|import\s+["'](@base\/[^"'/]+)(?:\/[^"']*)?["']/g;
const internalPackagePathRegex = /["']@base\/[^"']+\/src\//g;
const featurePackagePrefix = "@base/feature-";
const horizontalPlatformPackages = new Set([
  "@base/auth",
  "@base/authorization",
  "@base/db-control",
  "@base/db-tenant",
  "@base/ui",
  "@base/shared",
  "@base/biz-shared",
]);

for (const pkg of workspacePackages) {
  const pkgFiles = allFiles.filter((f) => {
    const rel = path.relative(workspaceRoot, f).replace(/\\/g, "/");
    return rel.startsWith(pkg.relDir + "/");
  });

  for (const filePath of pkgFiles) {
    const relPath = path.relative(workspaceRoot, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");

    if (internalPackagePathRegex.test(content)) {
      violations.push({
        file: relPath,
        line: 1,
        rule: "严禁通过 /src/ 穿透工作区包内部实现；必须使用 package.json exports 声明的公共入口",
        code: "import from @base/*/src/*",
      });
    }
    internalPackagePathRegex.lastIndex = 0;

    let match;
    internalImportRegex.lastIndex = 0;
    while ((match = internalImportRegex.exec(content)) !== null) {
      const importedPkg = match[1] || match[2];
      if (importedPkg === pkg.name) continue;
      if (
        pkg.name?.startsWith(featurePackagePrefix) &&
        importedPkg.startsWith(featurePackagePrefix)
      ) {
        violations.push({
          file: relPath,
          line: 1,
          rule: "业务 Feature Package 禁止直接依赖另一个 Feature；跨 Feature 组合必须位于 apps/* 装配层",
          code: `import from "${importedPkg}"`,
        });
      }
      if (
        pkg.name === "@base/ui" &&
        (importedPkg === "@base/authorization" ||
          importedPkg === "@base/biz-shared" ||
          importedPkg === "@base/auth" ||
          importedPkg.startsWith("@base/db-"))
      ) {
        violations.push({
          file: relPath,
          line: 1,
          rule: `架构分层违规：@base/ui 处于纯视觉/交互地基，严禁直接依赖 [${importedPkg}] (必须通过 UiAbilityContext 抽象控制反转注入)`,
          code: `import from "${importedPkg}"`,
        });
      }
      if (pkg.name === "@base/shared" && importedPkg.startsWith("@base/")) {
        violations.push({
          file: relPath,
          line: 1,
          rule: `架构分层违规：@base/shared 处于最底层纯工具/契约地基，严禁依赖工作区包 [${importedPkg}]`,
          code: `import from "${importedPkg}"`,
        });
      }
      if (pkg.name === "@base/authorization" && importedPkg === "@base/ui") {
        violations.push({
          file: relPath,
          line: 1,
          rule: `架构分层违规：@base/authorization 安全横切面严禁反向依赖 @base/ui 视觉横切面 (两者保持正交零依赖)`,
          code: `import from "${importedPkg}"`,
        });
      }
      if (
        horizontalPlatformPackages.has(pkg.name) &&
        importedPkg.startsWith(featurePackagePrefix)
      ) {
        violations.push({
          file: relPath,
          line: 1,
          rule: "Horizontal Shared / Platform Module 禁止反向依赖业务 Feature",
          code: `import from "${importedPkg}"`,
        });
      }
      if (!pkg.declaredDeps.has(importedPkg)) {
        violations.push({
          file: relPath,
          line: 1,
          rule: `严禁跨包幽灵依赖：源码引用了 [${importedPkg}]，但所在模块 [${pkg.name}] 的 package.json 未声明该依赖！(必须显式声明并在根目录运行 pnpm install)`,
          code: `import from "${importedPkg}"`,
        });
      }
    }
  }
}

// 规则 8：严禁在仓库内引入平台相关 Bash 脚本 (*.sh)，所有脚本必须使用跨平台 Node.js (*.mjs)
function scanForbiddenShellScripts(dir, shellFiles = []) {
  if (!fs.existsSync(dir)) return shellFiles;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnore(fullPath)) continue;
    if (entry.isDirectory()) {
      scanForbiddenShellScripts(fullPath, shellFiles);
    } else if (/\.(sh|bash)$/i.test(entry.name)) {
      shellFiles.push(fullPath);
    }
  }
  return shellFiles;
}

const forbiddenShellFiles = scanForbiddenShellScripts(workspaceRoot);
for (const shellFile of forbiddenShellFiles) {
  const relPath = path.relative(workspaceRoot, shellFile).replace(/\\/g, "/");
  violations.push({
    file: relPath,
    line: 1,
    rule: "严禁在仓库中新增平台相关的 Shell 脚本 (*.sh/*.bash)，所有构建/门禁/治理脚本必须统一使用跨平台 Node.js (*.mjs)",
    code: `Forbidden shell script: ${path.basename(shellFile)}`,
  });
}

if (violations.length > 0) {
  process.stderr.write(
    `\x1b[31m✗ [Redline Violations] 发现 ${violations.length} 处违背架构红线代码:\x1b[0m\n`,
  );
  for (const v of violations) {
    process.stderr.write(
      `    \x1b[33m• ${v.file}:${v.line}\x1b[0m - ${v.rule}\n      \x1b[90m> ${v.code}\x1b[0m\n`,
    );
  }
  process.exit(1);
}

process.stdout.write(
  `• 红线扫描: \x1b[32m通过\x1b[0m (${allFiles.length} files)\n`,
);
process.exit(0);
