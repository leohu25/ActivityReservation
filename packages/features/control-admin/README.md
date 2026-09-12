# @base/feature-control-admin

通用 SaaS 的**平台总控端垂直切片模块（Control Plane Admin Feature）**。

## 1. 模块定位与职责

本模块为 SaaS 平台超级管理员（Control Admin）提供全局管控、租户生命周期管理与跨租户运维支撑：

- **总控安全守卫与鉴权 (`auth/control-guard`)**：基于 Better Auth 验证全局平台管理员身份，断言超级管理权限并阻止普通租户用户越权。
- **租户全生命周期管理 (`services/`)**：涵盖新租户开户（Provision）、租户停用/启用、租户物理库分配与生命周期状态流转。
- **跨租户物理库数据库迁移 (`MigrationsView`)**：下发与追踪所有租户物理库（Tenant Database）的 Prisma Schema 迁移进度与版本台账。
- **全局管控大盘与指标洞察 (`ControlMetrics`)**：汇总租户总数、活跃组织数、物理库分布及异常健康状况。
- **全闭环 UI 视图 (`components/`)**：提供开箱即用的总控大盘页面（`OverviewPage`）、租户管理页面（`TenantsPage`）、迁移流水页面（`MigrationsPage`）及登录页（`ControlLogin`）。

## 2. 内部架构与目录结构

```text
packages/features/control-admin/
├── src/
│   ├── auth/                 # 总控身份验证与安全守卫 (control-guard.ts)
│   ├── components/           # 总控端专属业务视图与弹窗
│   │   ├── ControlLayout.tsx # 总控独立布局骨架
│   │   ├── ControlLogin.tsx  # 总控登录界面
│   │   ├── ControlMetrics.tsx# 全局指标监控卡
│   │   ├── OverviewPage.tsx  # 概览总览页
│   │   ├── ProvisionTenantDialog.tsx # 租户快速创建弹窗
│   │   ├── TenantLifecycleTable.tsx  # 租户生命周期管理列表
│   │   ├── TenantsPage.tsx   # 租户主页
│   │   ├── MigrationsPage.tsx# 数据库迁移页面
│   │   └── index.ts
│   ├── server/               # 服务端 Session 与认证运行时桥接
│   ├── services/             # 领域服务实现 (control-admin.ts)
│   ├── actions.ts            # Next.js Server Actions (开户、启停、执行迁移等)
│   ├── types.ts              # DTO 与展示数据类型定义
│   └── index.ts              # 统一平滑导出入口
└── package.json
```

## 3. 核心 API 与使用示例

### 3.1 总控身份硬断言

```ts
import { assertControlAdmin } from "@base/feature-control-admin";

// 在 Server Actions 或 Server Component 入口断言超级管理员
const adminUser = await assertControlAdmin();
```

### 3.2 消费总控服务

```ts
import { getControlAdminService } from "@base/feature-control-admin";

const service = getControlAdminService();
const metrics = await service.getSystemMetrics();
const tenants = await service.listTenants({ page: 1, pageSize: 20 });
```

## 4. 架构原则与红线

1. **严格限制在管控面操作**：本模块直接操作 Control DB（`@base/db-control`），严禁在无租户凭据的情况下直连单一租户业务库。
2. **所有操作均受安全守卫保护**：导出的所有 Server Actions 必须前置调用 `assertControlAdmin`，杜绝未认证调用。
3. **数据跨边界序列化**：通过 `toPlainData` 保证传输给客户端的数据均为纯对象（Plain Objects）。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @base/feature-control-admin check

# 运行单元测试
pnpm --filter @base/feature-control-admin test
```
