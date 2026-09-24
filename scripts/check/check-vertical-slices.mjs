#!/usr/bin/env node

/**
 * 业务垂直切片架构完整性门禁检查脚本 (Vertical Slice Architecture Integrity Checker)
 *
 * 严格校验 packages/features/* 下业务特性包的规范结构：
 * 1. 基础契约：manifest.ts、catalog.ts、shared/server/context.ts (或 tenant-context.ts)、shared/public.ts；
 * 2. package.json 规范：exports 必须为语义子路径，严禁导出 "." 根大杂烩桶；
 * 3. 根目录平铺文件清空：严禁存在 index.ts, actions.ts, types.ts, components/, services/, contracts/, server/ 等历史遗留；
 * 4. Feature / Sub-Feature 切片内聚：contract.ts、public.ts、public.server.ts、queries.ts、actions.ts、service.ts 等；
 * 5. 运行时边界与物理隔离：public.server.ts 与 queries.ts 必须标注 server-only，actions.ts 必须标注 use server，
 *    public.ts 与 ui/ 严禁泄露 Node 运行时或数据库客户端。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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

/** 历史平铺废弃文件清单：垂直切片重构后必须物理彻底清理，严禁死灰复燃 */
const RETIRED_FLAT_ENTRIES = [
  "index.ts",
  "actions.ts",
  "types.ts",
  "permission-registry.ts",
  "components",
  "services",
  "contracts",
  "server",
];

const PENDING_MIGRATION_PACKAGES = new Set([]);

/** 存量历史超长 UI 巨石组件白名单 (待后续技术债迭代逐步拆解，新切片严禁增量引入) */
const LEGACY_MONOLITH_WHITELIST = new Set([
  "packages/platform/control-admin/src/features/tenant-management/ui/TenantDetailDrawer.tsx",
  "packages/platform/tenant-admin/src/features/nav-management/ui/NavigationConfigView.tsx",
  "packages/platform/tenant-admin/src/features/role-management/role-permission/ui/RolePermissionManager.tsx",
]);

/** 存量历史子切片逆向引用父级实现白名单 (待后续技术债迭代逐步解耦，新切片严禁增量引入) */
const LEGACY_SUB_SLICE_IMPORT_WHITELIST = new Set([
  "packages/domains/customer-center/src/features/customer-management/category/ui/CategoryFormModal.tsx",
  "packages/domains/customer-center/src/features/customer-management/category/ui/CategoryView.tsx",
  "packages/domains/customer-center/src/features/customer-management/tag/ui/TagFormModal.tsx",
  "packages/domains/customer-center/src/features/customer-management/tag/ui/TagView.tsx",
  "packages/platform/tenant-admin/src/features/org-management/department/ui/DepartmentFormModal.tsx",
  "packages/platform/tenant-admin/src/features/org-management/department/ui/DepartmentView.tsx",
  "packages/platform/tenant-admin/src/features/org-management/employee/ui/EmployeeFormModal.tsx",
  "packages/platform/tenant-admin/src/features/org-management/employee/ui/EmployeeView.tsx",
  "packages/platform/tenant-admin/src/features/org-management/position/ui/PositionFormModal.tsx",
  "packages/platform/tenant-admin/src/features/org-management/position/ui/PositionView.tsx",
  "packages/platform/tenant-admin/src/features/role-management/role-definition/actions.ts",
  "packages/platform/tenant-admin/src/features/role-management/role-definition/queries.ts",
  "packages/platform/tenant-admin/src/features/role-management/role-definition/ui/RoleFormModal.tsx",
  "packages/platform/tenant-admin/src/features/role-management/role-definition/ui/RoleListView.tsx",
  "packages/platform/tenant-admin/src/features/role-management/role-permission/actions.ts",
]);

/**
 * 收集目录下的所有切片路径（包含 Feature 与嵌套的 Sub-Feature）
 * 排除 ui/, node_modules, __tests__ 等非切片目录
 */
function discoverSlices(dir, baseDir = dir) {
  const slices = [];
  if (!fs.existsSync(dir)) return slices;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const isSlice =
    fs.existsSync(path.join(dir, "public.ts")) ||
    fs.existsSync(path.join(dir, "contract.ts")) ||
    fs.existsSync(path.join(dir, "types.ts")) ||
    fs.existsSync(path.join(dir, "actions.ts"));

  if (isSlice && dir !== baseDir) {
    const relPath = path.relative(baseDir, dir).replace(/\\/g, "/");
    slices.push({
      relPath,
      fullPath: dir,
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (
      entry.name === "ui" ||
      entry.name === "node_modules" ||
      entry.name === "__tests__" ||
      entry.name === "test" ||
      entry.name.startsWith(".")
    ) {
      continue;
    }
    const subDir = path.join(dir, entry.name);
    slices.push(...discoverSlices(subDir, baseDir));
  }

  return slices;
}

/**
 * 扫描目录下的所有代码文件
 */
function walkCodeFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      walkCodeFiles(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

export function checkVerticalSlices(workspaceRoot = findWorkspaceRoot()) {
  const scanDirs = [
    {
      dir: path.join(workspaceRoot, "packages/domains"),
      isDomainPackage: true,
    },
    {
      dir: path.join(workspaceRoot, "packages/platform"),
      isDomainPackage: false,
    },
  ];

  const violations = [];

  for (const { dir: dirPath, isDomainPackage } of scanDirs) {
    if (!fs.existsSync(dirPath)) continue;
    const pkgEntries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of pkgEntries) {
      if (!entry.isDirectory()) continue;
      const pkgName = entry.name;

      const pkgDir = path.join(dirPath, pkgName);
      const srcDir = path.join(pkgDir, "src");
      const pkgJsonPath = path.join(pkgDir, "package.json");

      if (!fs.existsSync(pkgJsonPath)) continue;

      let pkgJson;
      try {
        pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      } catch (err) {
        violations.push({
          file: path.relative(workspaceRoot, pkgJsonPath).replace(/\\/g, "/"),
          line: 1,
          rule: "package.json 无法解析为有效 JSON",
          code: String(err.message),
        });
        continue;
      }

      const hasFeaturesDir = fs.existsSync(path.join(srcDir, "features"));
      // 凡是未标记 pending migration 的包，或者已经创建了 src/features 的包，均须严格遵守
      const isTarget =
        hasFeaturesDir || !PENDING_MIGRATION_PACKAGES.has(pkgName);

      if (!isTarget) continue;

      const relPkgDir = path.relative(workspaceRoot, pkgDir).replace(/\\/g, "/");

      // 1. 检查是否存在 src/features 目录
      if (!hasFeaturesDir) {
        violations.push({
          file: `${relPkgDir}/src`,
          line: 1,
          rule: "业务特性包必须采用 Feature-based Vertical Slice 架构，缺少 src/features/ 目录",
          code: `${relPkgDir}/src/features`,
        });
        continue;
      }

      // 2. 检查租户域切片基础契约文件 (仅租户业务域与租户系统管理必须具备 manifest/catalog/租户上下文)
      const isTenantSaaS = isDomainPackage || pkgName === "tenant-admin";

      if (isTenantSaaS) {
        const manifestPath = path.join(srcDir, "manifest.ts");
        if (!fs.existsSync(manifestPath)) {
          violations.push({
            file: `${relPkgDir}/src/manifest.ts`,
            line: 1,
            rule: "业务特性包必须在 src/manifest.ts 导出自描述特性清单 TenantFeatureManifest (ADR-005/006)",
            code: "manifest.ts missing",
          });
        }

        const catalogPath = path.join(srcDir, "catalog.ts");
        if (!fs.existsSync(catalogPath)) {
          violations.push({
            file: `${relPkgDir}/src/catalog.ts`,
            line: 1,
            rule: "业务特性包必须在 src/catalog.ts 导出 CASL 权限目录 PermissionCatalog",
            code: "catalog.ts missing",
          });
        }

        // 检查 shared/server 租户上下文隔离
        const sharedServerContext = path.join(srcDir, "shared/server/context.ts");
        const sharedServerTenantContext = path.join(
          srcDir,
          "shared/server/tenant-context.ts",
        );
        if (
          !fs.existsSync(sharedServerContext) &&
          !fs.existsSync(sharedServerTenantContext)
        ) {
          violations.push({
            file: `${relPkgDir}/src/shared/server`,
            line: 1,
            rule: "业务特性包必须在 src/shared/server/ 下维护租户物理库与鉴权上下文 (context.ts 或 tenant-context.ts)",
            code: "shared/server context missing",
          });
        }

        // 检查 AbilityBoundary 权限能力边界组件规范与 "use client" 强约束
        const allSrcFiles = walkCodeFiles(srcDir);
        const boundaryFiles = allSrcFiles.filter((f) =>
          /AbilityBoundary\.tsx$/.test(f),
        );

        if (boundaryFiles.length === 0) {
          violations.push({
            file: `${relPkgDir}/src`,
            line: 1,
            rule: "租户业务特性包必须在 src/shared/ui/ 或类似共享路径下定义 *AbilityBoundary.tsx 权限能力边界组件 (ADR-003/008)",
            code: "*AbilityBoundary.tsx missing",
          });
        }

        for (const boundaryFile of boundaryFiles) {
          const relBoundaryPath = path
            .relative(workspaceRoot, boundaryFile)
            .replace(/\\/g, "/");
          const content = fs.readFileSync(boundaryFile, "utf-8");

          // 强校验 1: 必须在头部声明 "use client";
          if (!/^\s*["']use client["'];/m.test(content)) {
            violations.push({
              file: relBoundaryPath,
              line: 1,
              rule: '权限能力边界组件 (*AbilityBoundary.tsx) 必须在文件头部显式声明 "use client"; 作为 Client Component 容器运行，防止内部实例化 CASL Ability 并在透传给 UI Provider 时触发 Next.js RSC 跨端序列化异常 (ADR-003/008)',
              code: 'missing "use client"',
            });
          }

          // 强校验 2: 组件命名规范必须为 export function/const *AbilityBoundary
          const hasBoundaryExport =
            /export\s+(function|const)\s+([A-Za-z0-9_]*AbilityBoundary)\b/.exec(
              content,
            );
          if (!hasBoundaryExport) {
            violations.push({
              file: relBoundaryPath,
              line: 1,
              rule: "权限能力边界组件导出名称必须遵循 *AbilityBoundary 统一语义规范 (如 CustomerAbilityBoundary)",
              code: "export *AbilityBoundary missing",
            });
          } else {
            // 强校验 3: 切片导出的 AbilityBoundary 必须在 apps/tenant 专属 layout.tsx 中被实际消费，严禁闲置或借道寄生
            const boundaryExportName = hasBoundaryExport[2];
            const tenantAppDir = path.join(
              workspaceRoot,
              "apps/tenant/src/app/(dashboard)",
            );
            let isConsumedInTenantLayout = false;

            if (fs.existsSync(tenantAppDir)) {
              const appFiles = walkCodeFiles(tenantAppDir);
              const layoutFiles = appFiles.filter((f) =>
                /[\\/]layout\.(tsx|jsx)$/.test(f),
              );

              for (const lf of layoutFiles) {
                const layoutContent = fs.readFileSync(lf, "utf-8");
                if (layoutContent.includes(boundaryExportName)) {
                  isConsumedInTenantLayout = true;
                  break;
                }
              }

              if (!isConsumedInTenantLayout) {
                violations.push({
                  file: relBoundaryPath,
                  line: 1,
                  rule: `业务切片导出的权限边界组件 [${boundaryExportName}] 必须在 apps/tenant 专属父级 layout.tsx 中实际挂载消费，严禁借道其他模块 Layout 寄生或闲置`,
                  code: `${boundaryExportName} not mounted in apps/tenant/**/layout.tsx`,
                });
              }
            }
          }
        }
      }

    // 检查 shared/public.ts
    const sharedPublic = path.join(srcDir, "shared/public.ts");
    if (!fs.existsSync(sharedPublic)) {
      violations.push({
        file: `${relPkgDir}/src/shared/public.ts`,
        line: 1,
        rule: "业务特性包必须在 src/shared/public.ts 暴露 Client-Safe 跨切片共享组件与公共类型",
        code: "shared/public.ts missing",
      });
    }

    // 3. 检查 package.json exports 规范
    const exportsField = pkgJson.exports;
    if (!exportsField || typeof exportsField !== "object") {
      violations.push({
        file: `${relPkgDir}/package.json`,
        line: 1,
        rule: "业务特性包必须在 package.json#exports 中显式暴露语义子路径，禁止无 exports 字段",
        code: "exports field missing",
      });
    } else {
      // 严禁根导出 "."
      if (exportsField["."]) {
        violations.push({
          file: `${relPkgDir}/package.json`,
          line: 1,
          rule: '业务特性包严禁导出根路径 "." 大杂烩桶；必须按业务切片暴露语义子路径',
          code: `"exports": { ".": "${exportsField["."]}" }`,
        });
      }

      // 业务领域包必须导出 ./manifest (平台总控 control-admin 无租户动态菜单 manifest)
      if (isTenantSaaS && !exportsField["./manifest"]) {
        violations.push({
          file: `${relPkgDir}/package.json`,
          line: 1,
          rule: '业务特性包 exports 必须显式导出 "./manifest"',
          code: 'exports["./manifest"] missing',
        });
      }

      // 必须导出 ./shared
      if (!exportsField["./shared"]) {
        violations.push({
          file: `${relPkgDir}/package.json`,
          line: 1,
          rule: '业务特性包 exports 必须显式导出 "./shared"',
          code: 'exports["./shared"] missing',
        });
      }
    }

    // 4. 检查 src 根目录历史平铺文件清空
    for (const retired of RETIRED_FLAT_ENTRIES) {
      const retiredPath = path.join(srcDir, retired);
      if (fs.existsSync(retiredPath)) {
        violations.push({
          file: path.relative(workspaceRoot, retiredPath).replace(/\\/g, "/"),
          line: 1,
          rule: `业务特性包已重构为 Vertical Slice，严禁在 src 根目录下保留历史平铺文件/目录 [${retired}]`,
          code: retired,
        });
      }
    }

    // 5. 检查 src/features 下的各切片规范
    const featuresRootDir = path.join(srcDir, "features");
    const slices = discoverSlices(featuresRootDir);

    if (slices.length === 0) {
      violations.push({
        file: `${relPkgDir}/src/features`,
        line: 1,
        rule: "业务特性包 src/features/ 目录下未发现任何业务切片",
        code: "no slices found",
      });
      continue;
    }

    for (const slice of slices) {
      const relSliceDir = path
        .relative(workspaceRoot, slice.fullPath)
        .replace(/\\/g, "/");
      const sliceSubpath = slice.relPath;

      // 必须包含 public.ts (Client-Safe 出口)
      const publicPath = path.join(slice.fullPath, "public.ts");
      if (!fs.existsSync(publicPath)) {
        violations.push({
          file: `${relSliceDir}/public.ts`,
          line: 1,
          rule: `业务切片 [${sliceSubpath}] 必须提供 public.ts 作为 Client-Safe 唯一前端暴露入口`,
          code: "public.ts missing",
        });
      }

      // 校验子切片嵌套深度（最多允许 1 层子切片，即 features/<feature>/<sub-feature>）
      const pathSegments = slice.relPath.split("/");
      if (pathSegments.length > 2) {
        violations.push({
          file: `${relSliceDir}`,
          line: 1,
          rule: `【架构红线】子切片最大嵌套深度为 1 层（当前为 ${pathSegments.length} 层: [${slice.relPath}]）。严禁无限嵌套子切片形成目录深渊，请提升为一级 Feature`,
          code: slice.relPath,
        });
      }

      // package.json#exports 必须包含对应的 Client-Safe 子路径
      if (exportsField && !exportsField[`./${sliceSubpath}`]) {
        violations.push({
          file: `${relPkgDir}/package.json`,
          line: 1,
          rule: `业务特性包 exports 缺少切片 [${sliceSubpath}] 的公共子路径 "./${sliceSubpath}"`,
          code: `exports["./${sliceSubpath}"] missing`,
        });
      }

      const hasContract = fs.existsSync(
        path.join(slice.fullPath, "contract.ts"),
      );
      const hasPublicServer = fs.existsSync(
        path.join(slice.fullPath, "public.server.ts"),
      );
      const hasQueries = fs.existsSync(path.join(slice.fullPath, "queries.ts"));
      const hasActions = fs.existsSync(path.join(slice.fullPath, "actions.ts"));
      const hasTypes = fs.existsSync(path.join(slice.fullPath, "types.ts"));

      const sliceEntries = fs.readdirSync(slice.fullPath);
      const hasService = sliceEntries.some(
        (f) =>
          f === "service.ts" ||
          (f.endsWith("-service.ts") && !f.endsWith(".test.ts")),
      );

      // 规范业务切片强契约要求 (所有切片均须结构同构，彻底废除纯契约/纯视图豁免后门)
      if (!hasContract) {
        violations.push({
          file: `${relSliceDir}/contract.ts`,
          line: 1,
          rule: `业务切片 [${sliceSubpath}] 必须提供 contract.ts 定义权限契约与 Subject 常量 (SSoT)`,
          code: "contract.ts missing",
        });
      }
      if (!hasTypes) {
        violations.push({
          file: `${relSliceDir}/types.ts`,
          line: 1,
          rule: `业务切片 [${sliceSubpath}] 必须提供 types.ts 集中管理切片内领域类型与 DTO`,
          code: "types.ts missing",
        });
      }
      // 如果包含写操作 Action，必须提供匹配的独立 Zod Schema 校验与单测
      if (hasActions) {
        const hasSchema = fs.existsSync(
          path.join(slice.fullPath, "schema.ts"),
        );
        if (!hasSchema) {
          violations.push({
            file: `${relSliceDir}/schema.ts`,
            line: 1,
            rule: `包含写操作 Server Actions 的切片 [${sliceSubpath}] 必须提供独立的 schema.ts 进行运行时 Zod 强校验，严禁堆砌在 contract.ts`,
            code: "schema.ts missing",
          });
        }
      }
      if (hasQueries || hasActions || hasService) {
        if (!hasPublicServer) {
          violations.push({
            file: `${relSliceDir}/public.server.ts`,
            line: 1,
            rule: `包含服务端能力的业务切片 [${sliceSubpath}] 必须提供 public.server.ts 作为纯服务端安全导出入口`,
            code: "public.server.ts missing",
          });
        }
      }

      // 如果有 public.server.ts，exports 必须暴露 "./<slice>/server"
      if (hasPublicServer && exportsField) {
        if (!exportsField[`./${sliceSubpath}/server`]) {
          violations.push({
            file: `${relPkgDir}/package.json`,
            line: 1,
            rule: `具有服务端能力的切片 [${sliceSubpath}] 必须在 package.json#exports 暴露 "./${sliceSubpath}/server"`,
            code: `exports["./${sliceSubpath}/server"] missing`,
          });
        }
      }

      // 6. 校验切片内部代码文件的运行时边界规范
      const sliceCodeFiles = walkCodeFiles(slice.fullPath);
      for (const codeFilePath of sliceCodeFiles) {
        const relCodePath = path
          .relative(workspaceRoot, codeFilePath)
          .replace(/\\/g, "/");
        const content = fs.readFileSync(codeFilePath, "utf-8");

        // 契约纯洁性约束：contract.ts 仅收敛权限与元数据常量，严禁导入 Zod 变成大杂烩
        if (codeFilePath.endsWith("contract.ts")) {
          if (/from\s+["']zod["']|import\s+.*\{.*z.*\}.*from\s+["']@base\/ui["']/.test(content)) {
            violations.push({
              file: relCodePath,
              line: 1,
              rule: "契约纯洁性违规：contract.ts 只能定义权限 Subject/Resource 与列表 URL 参数契约，严禁导入 Zod 定义业务实体 Schema (业务 Schema 请移至 schema.ts)",
              code: "zod import in contract.ts",
            });
          }
        }

        // 服务端入口与 Query 必须标记 server-only
        if (
          codeFilePath.endsWith("public.server.ts") ||
          codeFilePath.endsWith("queries.ts")
        ) {
          if (!/^import\s+["']server-only["'];/m.test(content)) {
            violations.push({
              file: relCodePath,
              line: 1,
              rule: `纯服务端文件必须在头部显式声明 import "server-only"; 防止被前端组件误打包`,
              code: 'missing import "server-only"',
            });
          }
        }

        // mutation actions.ts 必须标记 "use server" (仅针对定义了具体 action 的叶子文件，不包含仅做 export * 聚合的中转文件)
        if (codeFilePath.endsWith("actions.ts")) {
          const isReExportOnly = /^\s*(export\s+\*\s+from\s+["'][^"']+["'];?\s*)+$/.test(
            content.trim(),
          );
          if (!isReExportOnly && !/^\s*["']use server["'];/m.test(content)) {
            violations.push({
              file: relCodePath,
              line: 1,
              rule: `Server Actions 模块必须在头部显式声明 "use server";`,
              code: 'missing "use server"',
            });
          }
        }

        // Client-Safe 出口 (public.ts) 与 UI 组件严禁直接导入服务端敏感库
        const isClientCode =
          codeFilePath.endsWith("public.ts") ||
          /[\\/]ui[\\/]/.test(codeFilePath) ||
          /^\s*["']use client["'];/m.test(content);

        if (isClientCode) {
          const dangerousServerPatterns = [
            /from\s+["']next\/(headers|cache)["']/,
            /from\s+["']@base\/db-tenant["']/,
            /from\s+["'][^"']*\.server["']/,
            /from\s+["'][^"']*\/queries["']/,
          ];
          for (const pattern of dangerousServerPatterns) {
            if (pattern.test(content)) {
              violations.push({
                file: relCodePath,
                line: 1,
                rule: "Client-Safe API (public.ts) 与 UI 组件严禁导入数据库、Next.js 服务端能力或 queries 入口",
                code: content.match(pattern)?.[0] || "server import in client",
              });
              break;
            }
          }
        }

        // 严禁通过相对路径直接越权调用兄弟 Feature 的私有实现文件 (如 ../other/service, ../other/actions)
        // 注意：同一切片聚合包内（如 org-management 下的子切片 employee 引用 department/public.server 或兄弟目录）跨 Feature 聚合检查
        const siblingPrivateImport =
          /from\s+["']\.\.\/(?!public)(?!shared)([a-zA-Z0-9_-]+)\/(queries|actions|service|.*-service)["']/;
        const matchSibling = content.match(siblingPrivateImport);
        if (matchSibling) {
          violations.push({
            file: relCodePath,
            line: 1,
            rule: `严禁通过相对路径直接调用兄弟切片私有实现 [${matchSibling[1]}]: 跨切片集成必须通过 public.server 或共享契约`,
            code: matchSibling[0],
          });
        }

        // 子切片单向依赖铁律：子切片严禁逆向引用父级主切片的私有实现 (../service, ../actions, ../queries)
        if (pathSegments.length === 2 && !LEGACY_SUB_SLICE_IMPORT_WHITELIST.has(relCodePath)) {
          const parentPrivateImport =
            /from\s+["']\.\.\/(service|actions|queries|.*-service)["']/;
          const matchParent = content.match(parentPrivateImport);
          if (matchParent) {
            violations.push({
              file: relCodePath,
              line: 1,
              rule: `【架构红线】子切片 [${sliceSubpath}] 严禁逆向引用父级主切片的私有实现 [${matchParent[1]}]: 子切片必须保持自身独立自治，由主切片单向调用编排`,
              code: matchParent[0],
            });
          }
        }

        // UI 防巨石单文件行数硬门禁：防止 AI 或开发者产生千行巨石组件
        if (
          /[\\/]ui[\\/]/.test(codeFilePath) &&
          /\.(tsx|jsx)$/.test(codeFilePath) &&
          !LEGACY_MONOLITH_WHITELIST.has(relCodePath)
        ) {
          const lineCount = content.split("\n").length;
          if (lineCount > 500) {
            violations.push({
              file: relCodePath,
              line: 1,
              rule: `【架构红线】UI 组件单文件行数不得超过 500 行（当前 ${lineCount} 行），必须拆解为 Level 2 积木组件并抽离 useFormState 纯逻辑 Hook`,
              code: `Line count: ${lineCount} > 500`,
            });
          }
        }
      }
    }
  }
}

  return { violations };
}

function main() {
  const { violations } = checkVerticalSlices();

  if (violations.length > 0) {
    process.stderr.write(
      `\x1b[31m✗ [Vertical Slice Violations] 发现 ${violations.length} 处违背业务垂直切片架构规范:\x1b[0m\n`,
    );
    for (const v of violations) {
      process.stderr.write(
        `    \x1b[33m• ${v.file}:${v.line}\x1b[0m - ${v.rule}\n      \x1b[90m> ${v.code}\x1b[0m\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    `• 业务切片: \x1b[32m规范完整\x1b[0m (packages/domains/* 垂直切片全部合规)\n`,
  );
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
