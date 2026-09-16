# @base/feature-tenant-admin

通用 SaaS 的 **Tenant Admin Business Area / Feature Group（租户管理中心业务领域 / 特性集群）**。

## 架构定位

本包是 Modular Monorepo 中的业务区域包，全面遵循 Feature-based Vertical Slice Architecture（基于特性的垂直切片架构）：

- `org-management/`：组织架构管理核心特性（包含员工管理、部门拓扑、岗位字典）；
- `role-management/`：角色与权限管理核心特性（包含四层权限矩阵、自定义角色分配）；
- `tenant-settings/`：租户企业系统设置核心特性（包含企业资料、基础偏好、安全策略）；
- `workbench/`：租户主工作台专属切片（包含准入门禁、拓扑自驱装配、数据看板）；
- `audit-log/`：审计追踪特性（登录审计、操作审计、权限变更审计契约）；
- `shared/`：仅供租户管理中心内多个 Feature 复用的基础设施、官方 CASL Ability 边界与公共类型。

各 Feature 内部均自闭环组织为：

- `contract.ts`：纯数据权限契约与 Subject/Field 常量 (SSoT)；
- `types.ts`：领域类型与 DTO 输入输出模型；
- `service.ts`：领域服务实现与防环/删除安全防护；
- `service.test.ts`：领域与边界专属单元测试；
- `queries.ts`：Server Component 专用的 `server-only` 只读查询（含租户物理库路由与 CASL 断言）；
- `actions.ts`：Client 调用的 `"use server"` 安全变更操作（通过 `defineServerAction` 认证与 CASL 校验）；
- `ui/`：现代化数智工业风展示与交互组件；
- `public.ts`：Client-Safe 客户端安全导出入口；
- `public.server.ts`：纯服务端 `server-only` 导出入口。

## 运行时边界与 Server/Client 物理隔离

严格遵守 Next.js App Router 运行时边界：

- **Server Component 读取**：`public.server.ts` → `queries.ts`（标注 `server-only`）→ Tenant Context / CASL 断言 → `service.ts`；
- **Client mutation**：UI 组件 → `actions.ts`（标注 `"use server"`）→ `defineServerAction` 认证与 CASL 拦截 → `service.ts`；
- **客户端安全出口**：`public.ts` 仅导出前端安全的 UI 视图、纯数据 Contract 与类型，绝不泄露 Node 运行时或 DB Client；
- **内部实现私有化**：Service 仅作为包内领域实现，严禁向外部直接暴露；
- **物理安全序列化**：原始 Prisma 数据在 Query 或 Action 出口处统一完成敏感字段脱敏裁剪（`pickReadableFields`）与安全序列化（`toPlainData`）。

## 官方规范公共 API (Package Subpath Exports)

本包遵循 Turborepo 与 Next.js 官方最佳实践，彻底废除根目录大杂烩 Barrel File 与内部 `/src/` 穿透，统一使用 `package.json#exports` 暴露强类型业务子路径：

```ts
// 1. 组织架构管理
import {
  DepartmentView,
  EmployeeView,
  PositionView,
} from "@base/feature-tenant-admin/org-management";
import {
  listDepartmentTreeQuery,
  listEmployeesQuery,
  listPositionsQuery,
} from "@base/feature-tenant-admin/org-management/server";

// 2. 角色与权限管理
import { RolePermissionManager } from "@base/feature-tenant-admin/role-management";
import { listTenantRolesQuery } from "@base/feature-tenant-admin/role-management/server";

// 3. 企业系统设置
import {
  CompanySettingsView,
  GeneralSettingsView,
  SecuritySettingsView,
} from "@base/feature-tenant-admin/tenant-settings";
import {
  getCompanyProfileQuery,
  getGeneralSettingsQuery,
  getSecuritySettingsQuery,
} from "@base/feature-tenant-admin/tenant-settings/server";

// 4. 工作台与公共能力
import { WorkbenchView } from "@base/feature-tenant-admin/workbench";
import { TenantAdminAbilityBoundary } from "@base/feature-tenant-admin/shared";
import { tenantAdminManifest } from "@base/feature-tenant-admin/manifest";
```

旧根入口和按技术层暴露的 `/types`、`/actions`、`/services`、`/components` 已彻底物理删除，零历史包袱。

## 验证

```bash
# 运行单元测试
pnpm --filter @base/feature-tenant-admin test

# 类型安全检查
pnpm --filter @base/feature-tenant-admin check
```
