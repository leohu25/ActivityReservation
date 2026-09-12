# @base/feature-customer-center

通用 SaaS 的 **Customer Center Business Area / Feature Group（客户中心业务领域 / 特性集群）**。

## 架构定位

本包是 Modular Monorepo 中的业务区域包，内部采用 Feature-based Vertical Slice Architecture（基于特性的垂直切片架构）：

- `customer-management/`：Customer Management Feature（客户管理核心特性）；
- `customer-management/classification/`：Classification Sub-Feature（分类与标签子特性）；
- `store-management/`：Store Management Feature（门店管理核心特性）；
- `quotation-management/`：Quotation Management Feature（报价管理核心特性）；
- `shared/`：仅供 Customer Center 内多个 Feature 复用的基础设施与 UI 能力。

`Create Customer`（创建客户）、`Create Classification`（创建分类）、`Disable Store`（停用门店）、`Activate Quote`（生效报价）等是 Vertical Slice / Use Case（垂直切片 / 业务用例）。当前规模下，同一 Feature 的用例集中在 `queries.ts`、`actions.ts` 与 `service.ts` 中，不机械创建“一用例一目录”，兼顾高内聚与防过度设计。

```text
packages/features/customer-center/
├── prisma/schema.prisma
└── src/
    ├── features/
    │   ├── customer-management/
    │   │   ├── classification/
    │   │   ├── contract.ts
    │   │   ├── types.ts
    │   │   ├── service.ts
    │   │   ├── queries.ts
    │   │   ├── actions.ts
    │   │   ├── ui/
    │   │   ├── public.ts
    │   │   └── public.server.ts
    │   ├── store-management/
    │   └── quotation-management/
    ├── shared/
    ├── catalog.ts
    └── manifest.ts
```

## 运行时边界与 Server/Client 物理隔离

严格遵守 Next.js App Router 运行时边界：

- **Server Component 读取**：`public.server.ts` → `queries.ts`（标注 `server-only`）→ Tenant Context / CASL 断言 → `service.ts`；
- **Client mutation**：UI 组件 → `actions.ts`（标注 `"use server"`）→ `defineServerAction` 认证与 CASL 拦截 → `service.ts`；
- **客户端安全出口**：`public.ts` 仅导出前端安全的 UI 视图、纯数据 Contract 与类型，绝不泄露 Node 运行时或 DB Client；
- **内部实现私有化**：Service 仅作为包内领域实现，严禁向 `apps/tenant` 等外部模块直接暴露；
- **物理安全序列化**：原始 Prisma 数据在 Query 或 Action 出口处统一完成敏感字段脱敏裁剪与安全序列化。

## 官方规范公共 API (Package Subpath Exports)

本包遵循 Turborepo 与 Next.js 官方最佳实践，彻底废除根目录大杂烩 Barrel File 与内部 `/src/` 穿透，统一使用 `package.json#exports` 暴露强类型业务子路径：

```ts
// 1. 引入前端 UI 与纯契约（Client-Safe，支持 Client Components）
import {
  CustomerView,
  CustomerSubject,
  type CustomerListItem,
} from "@base/feature-customer-center/customer-management";

// 2. 引入纯服务端查询（Server-Only，仅限 RSC 服务端组件使用）
import { listCustomersQuery } from "@base/feature-customer-center/customer-management/server";

// 3. 引入子特性（Sub-Feature）组件
import { CategoryTagView } from "@base/feature-customer-center/customer-management/classification";

// 4. 引入主应用装配清单
import { customerManifest } from "@base/feature-customer-center/manifest";
```

旧根入口和按技术层暴露的 `/types`、`/actions`、`/services`、`/components` 已彻底物理删除，零历史包袱。

## DDD 使用原则

本包坚持“按需引入，杜绝过度设计”原则：当前业务规模下不套用全套 DDD 笨重分层（Entity 类、Repository 接口、CQRS 总线等）。仅在特定 Feature 出现复杂状态机、重要业务不变量、明确事务一致性边界或复杂领域计算（如报价单的三级优先级匹配算法）时，才在 Feature 内部按需提炼纯 Domain Policy 或核心行为模型。页面和文件夹绝不能等同于 Aggregate（聚合根）或 Bounded Context（限界上下文）。

## 验证

```bash
# 类型检查
pnpm --filter @base/feature-customer-center check

# 专属单测 (12/12)
pnpm --filter @base/feature-customer-center test

# 宿主应用类型对齐检查
pnpm --filter tenant check

# 架构依赖边界扫描
node scripts/check-redlines.mjs
```
