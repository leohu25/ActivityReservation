# Next.js App Router 现代 SaaS 官方范式与全流程最佳实践技术规格书

> **文档定位**：本项目（晨润 ERP / 现代化多租户 SaaS 基座）彻底清退历史包袱与胶水兼容层，全面深度对齐 **Next.js 官方规范**、**Vercel 工程化最佳实践**、**shadcn 官方组件哲学** 与 **Prisma 7 驱动适配器标准** 的权威技术规格书与实施宪法。
>
> **当前基线策略**：未确定的业务领域（物料、订单、采购）已完全物理归档至根目录 `.archive/`，代码区**仅保留客户中心 (`customer-center`) 作为唯一 0→1 标杆切片**。无需保留任何废弃标记、别名兼容层或过渡胶水，标杆即终态，新模块未来按此标准机械化套用。

---

## 一、 官方范式事实源与核心设计原则 (Ground Truth & Core Principles)

本方案拒绝臆造私有 DSL 与防御性胶水代码，100% 严格对齐五大官方事实源：

| 核心领域                 | 权威事实源 (Authority Source)                                                                                                                                                                                                                           | 核心规范与落地准则                                                                                                                                                                                                          |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL-as-State 架构**    | [Next.js App Router: Linking & Navigating](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)                                                                                                                        | URL (`searchParams`) 是列表分页、关键字检索与多维筛选的**唯一真实状态源 (SSoT)**。Client 端严禁保存任何针对列表数据、分页或筛选的 `useState` 镜像；状态切换直接通过 `useTableUrlState` 更新 URL，驱动 RSC 重新抓取。        |
| **流式渲染与骨架过渡**   | [Next.js: Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)<br>[Vercel: async-suspense-boundaries](https://github.com/vercel/next.js)                                                   | 页面以 `searchParams` 组合为唯一 `suspenseKey`，使用 `<Suspense key={suspenseKey} fallback={<DataTableSkeleton />}>` 实现局部平滑过渡，切页与筛选零全屏闪烁，严禁在 Client 端手动维护 `isLoading` 状态。                    |
| **数据获取与消除瀑布流** | [Vercel: async-parallel & server-cache-react](https://github.com/vercel/next.js)                                                                                                                                                                        | 服务端查询必须标记 `"server-only"`；同请求生命周期内的租户上下文与用户鉴权必须使用 React `cache()` 记忆化去重；独立的数据拉取必须使用 `Promise.all` 彻底消除请求瀑布流。                                                    |
| **RSC 跨端序列化防线**   | [Next.js: Passing props to Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#passing-props-from-server-to-client-components)<br>[Vercel: server-serialization](https://github.com/vercel/next.js) | Server Component 传递给 Client Component 的数据必须是纯粹的可序列化 JSON (Plain Data)。Prisma `Decimal` 统一转为 `number`，原生 `Date` 统一转为 ISO 字符串，统一使用 `toPlainData` 处理，严禁透传类实例或服务端函数。       |
| **自愈变更与交互并发**   | [Next.js: Server Actions & Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)<br>[Vercel: rendering-usetransition-loading](https://github.com/vercel/next.js)                                 | 数据写入与缓存失效的责任完全由 Server Action 闭环承担，成功后显式调用 `revalidatePath`；客户端使用 `useTransition` / `startTransition` 调度 Action 调用，无感获得 `isPending`，严禁客户端编排 `router.refresh()`。          |
| **shadcn 官方组件哲学**  | [shadcn/ui: Principles & Composition](https://ui.shadcn.com/docs)<br>`.agents/skills/shadcn/`                                                                                                                                                           | **拥有你的代码 (Own Your Code)**。表单强制使用 `FieldGroup` + `Field`；校验强制使用 `data-invalid` + `aria-invalid`；按钮严禁 `isLoading` 属性（采用 `Spinner` 组合）；间距严禁 `space-y-*`（统一 `flex flex-col gap-*`）。 |
| **数据库驱动与事务控制** | [Prisma Driver Adapter Specification](https://www.prisma.io/docs/orm/overview/databases)<br>`.agents/skills/prisma-driver-adapter-implementation/`                                                                                                      | 事务独占连接、显示设置超时与隔离级别；业务唯一编号生成冲突显式捕获 `P2002` 并进行指数退避重试；完整保留底层数据库错误码与错误信息。                                                                                         |
| **四层权限与数据下推**   | [CASL: @casl/prisma & Field-level Permissions](https://casl.js.org/v6/en/package/casl-prisma)                                                                                                                                                           | 认证归 Better Auth（管进门），授权归 CASL（管屋内）。写路径必须通过 `assertWritableFields` 执行不可篡改物理校验，SQL 查询必须通过 `getAccessibleWhere` 自动下推，前端通过 `UiAbilityProvider` 进行声明式管控。              |

---

## 二、 现状纠偏与工作区纯净拓扑

### 1. 现状纠偏事实清单

- **原子层已完全解锁**：之前引入的 `.shadcn-manifest.json` 与 `check-shadcn-immutability.mjs` 已经在代码库中彻底删除；`packages/base/ui` 的目录已经重构收敛为标准的 `ui/`、`data-table/`、`form/`、`auth/`、`layout/` 等语义化目录，无任何哈希锁定。
- **物理归档消除历史包袱**：未确定的业务领域（物料、订单、采购）以及对应租户端路由已整体归档至根目录 `.archive/`，不占用代码区活跃上下文，无需为了兼容旧模块而编写冗余的别名、双向适配器或 `@deprecated` 标记。
- **驱动与迁移安全对齐**：租户 Schema 聚合引擎已将 `.archive/domains/` 的 Schema 模型纳入扫描，确保全仓与历史迁移基线 100% 吻合，全仓 13 个包类型检查全绿通过。

### 2. 纯净项目工作区拓扑

```text
chenrun-erp-nextjs/
├── .archive/                                # 【物理归档区：完全移出当前活跃开发】
│   ├── domains/                             # 待标杆建立后直接按新模板重写
│   │   ├── material-center/
│   │   ├── order-center/
│   │   └── procurement-center/
│   └── routes/                              # 对应的 App Router 页面归档暂存
│       ├── materials/
│       ├── order/
│       └── procurement/
│
├── apps/
│   ├── control/                             # 平台管控平面 (纯净保留)
│   └── tenant/                              # 租户数据平面
│       └── src/
│           ├── app/
│           │   └── (dashboard)/
│           │       ├── customer/            # 【唯一保留的 0→1 黄金标杆业务模块】
│           │       │   ├── customers/       # 客户档案 (规范演示)
│           │       │   ├── stores/          # 门店档案
│           │       │   ├── categories-tags/ # 客户分类与标签
│           │       │   └── quotes/          # 报价单
│           │       ├── settings/            # 租户系统设置
│           │       ├── organization/        # 组织管理
│           │       └── workbench/           # 租户工作台 (纯由客户中心与系统管理驱动)
│           └── kernel/
│               └── registry.generated.ts    # 仅自动发现与注册活跃切片
│
├── packages/
│   ├── base/                                # 【现代基座套件】
│   │   ├── auth/                            # Better Auth 认证
│   │   ├── authorization/                   # CASL 授权 (assertWritableFields 物理防篡改)
│   │   ├── db-tenant/                       # 物理分库动态连接池 (TenantDbManager)
│   │   ├── shared/                          # 序列化 (toPlainData)、通用工具
│   │   └── ui/                              # 官方规范 shadcn/ui + 纯状态 DataTable
│   │
│   ├── platform/                            # 【平台支撑套件】
│   │   ├── control-admin/
│   │   └── tenant-admin/
│   │
│   └── domains/                             # 【业务切片区：当前聚焦唯一标杆】
│       └── customer-center/                 # 客户中心标准实现
│           ├── prisma/schema.prisma
│           ├── src/
│           │   ├── assembly/context.ts      # 租户与权限上下文注入 (React cache 记忆化)
│           │   ├── features/
│           │   │   └── customer-management/
│           │   │       ├── contract.ts      # CASL 权限契约 SSoT
│           │   │       ├── schema.ts        # 共享 Zod Schema 校验源
│           │   │       ├── types.ts         # z.infer 导出的纯数据 DTO
│           │   │       ├── service.ts       # Prisma 事务 + 并发重试 (Driver Adapter 适配)
│           │   │       ├── queries.ts       # server-only 查询 (Decimal/Date 转换)
│           │   │       ├── actions.ts       # defineServerAction + 物理防篡改 + revalidatePath
│           │   │       └── ui/              # 纯受控 DataTable 视图 + shadcn FormModal
│           │   ├── manifest.ts
│           │   ├── catalog.ts               # 权限目录导出
│           │   └── index.ts
│
└── tooling/db-migrate/                      # 12-Factor 数据库自愈迁移引擎
```

---

## 三、 全流程 6 阶段官方最佳实践深度对齐与规范化 (流程固化)

为了彻底根治 AI 编写代码时“代码量冗余、状态混乱、易漏权限校验、样式违规”的问题，将业务切片拆解为标准的 6 阶段，并深度融合四大 Skills 的官方最佳实践：

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 1: 数据持久层与事务控制 (Prisma Driver Adapter & Service)          │
│ • 显式设置事务隔离级别与超时 (maxWait: 5000, timeout: 10000)            │
│ • 捕获 P2002 唯一键冲突进行指数退避重试 (自愈生成客户编号)              │
│ • 严禁吞噬数据库底层错误码，返回纯粹数据模型                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 2: 服务端查询与请求记忆化 (server-only Queries & React cache)     │
│ • 标记 "server-only"，React cache() 包装 getTenantCustomerContext()     │
│ • Promise.all 并行拉取下拉选项与分页主数据 (消除请求瀑布流)             │
│ • 严格执行 DTO 字段投影，Prisma Decimal 转 number，Date 转 ISO 字符串   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 3: 自愈型原子变更 (Server Actions & useTransition)                │
│ • 统一前后端共享 Zod Schema (customerInputSchema.parse)                 │
│ • CASL 四层权限拦截 + assertWritableFields 字段防篡改物理拦截           │
│ • 成功执行后服务端调用 revalidatePath() 自愈刷新                        │
│ • 客户端使用 startTransition 调度，无感获得 isPending                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 4: 响应式纯受控视图 (View Client & DataTable)                      │
│ • 100% URL-as-State 驱动：零 data 镜像 useState，零 useEffect 级联同步  │
│ • 搜索输入框采用草稿机制：敲击回车或点击查询才触发 URL 更新             │
│ • 受控绑定分页与多维筛选，操作按钮声明式对接 CASL                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 5: shadcn 官方无障碍表单 (FormModal)                               │
│ • 布局规范：FieldGroup + Field + FieldLabel (严禁裸 div 与 space-y-*)    │
│ • 校验与无障碍：Field 上置 data-invalid，控件上置 aria-invalid          │
│ • 按钮规范：禁用 isLoading 属性，使用 Spinner 组合；图标加 data-icon   │
│ • Dialog/Sheet 必须包含 DialogTitle (视觉隐藏时用 sr-only)              │
│ • 查看模式全表单受控只读                                                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 阶段 6: 页面装配与流式路由 (App Router Page & Suspense)                │
│ • searchParams 异步解析：一行 parseTableSearchParams 提取参数           │
│ • 动态 suspenseKey 包裹 <Suspense fallback={<DataTableSkeleton />}>     │
│ • 切页与筛选平滑流式过渡，消除全屏白屏与卡顿                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 四、 核心阶段生产级代码模板库 (少即是多)

### 阶段 1：Prisma 事务与并发编号自愈 (Service)

- **对齐规范**：`prisma-driver-adapter-implementation` 事务独立性、错误码保留与并发重试。

```typescript
// packages/domains/customer-center/src/features/customer-management/service.ts
import { PrismaClientKnownRequestError } from "@base/db-tenant";
import type { TenantPrismaClient } from "@base/db-tenant";
import type { CreateCustomerInput } from "./types";

export class CustomerService {
  /**
   * 创建客户：事务包裹 + P2002 唯一编号冲突指数退避重试 (最多重试 3 次)
   */
  static async createCustomer(
    prisma: TenantPrismaClient,
    input: CreateCustomerInput,
    context: { userId: string; deptId: string | null },
  ) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(
          async (tx) => {
            // 1. 生成唯一业务编号
            const customerCode = await this.generateCustomerCode(tx);

            // 2. 插入主表
            const customer = await tx.customer.create({
              data: {
                customerCode,
                customerName: input.customerName,
                customerCategoryId: input.categoryId,
                settlementType: input.settlementType,
                contactPerson: input.contactPerson,
                contactPhone: input.contactPhone,
                status: "ACTIVE",
                createdById: context.userId,
                updatedById: context.userId,
                departmentId: context.deptId,
              },
            });

            // 3. 关联多对多标签
            if (input.tagIds?.length) {
              await tx.customerTagAssignment.createMany({
                data: input.tagIds.map((tagId) => ({
                  customerCode: customer.customerCode,
                  tagId,
                  createdById: context.userId,
                })),
              });
            }

            return customer;
          },
          {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: "ReadCommitted",
          },
        );
      } catch (error) {
        // 捕获 Prisma 唯一键冲突 (P2002)，触发退避重试
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < maxRetries
        ) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 50));
          continue;
        }
        throw error;
      }
    }
  }

  private static async generateCustomerCode(tx: any): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await tx.customer.count();
    const seq = String(count + 1).padStart(4, "0");
    return `CUST-${today}-${seq}`;
  }
}
```

---

### 阶段 2：请求记忆化与消除瀑布流查询 (Queries)

- **对齐规范**：`vercel-react-best-practices` (`server-cache-react`, `async-parallel`, `server-serialization`)。

```typescript
// packages/domains/customer-center/src/assembly/context.ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory } from "@base/authorization";
import { getTenantDbManager, resolveEmployeeTopology } from "@base/db-tenant";
import { customerCatalog } from "../catalog";

/**
 * 官方范式：使用 React cache() 记忆化租户与鉴权上下文拉取
 * 在同一次 RSC 渲染周期内多次调用零开销、零重复 DB/Redis 查询
 */
export const getTenantCustomerContext = cache(async () => {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);
  const authRuntime = getServerAuthRuntime();
  const manager = getTenantDbManager({
    repository: authRuntime.tenantContextRepository,
  });
  const client = await manager.getClient(tenantCtx.organizationId);

  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: (memberId) =>
        client.employeeProfile.findUnique({
          where: { memberId },
          select: {
            id: true,
            memberId: true,
            departmentId: true,
            employeeNo: true,
            jobTitle: true,
            status: true,
          },
        }),
      findAllDepartments: () =>
        client.department.findMany({ select: { id: true, parentId: true } }),
    },
    { userId: tenantCtx.user.id, memberId: tenantCtx.member.id },
  );

  const factory = new CaslAbilityFactory(
    authRuntime.tenantContextRepository,
    customerCatalog,
  );
  const ability = await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  );

  return {
    tenantCtx,
    client,
    ability,
    userId: tenantCtx.user.id,
  };
});
```

```typescript
// packages/domains/customer-center/src/features/customer-management/queries.ts
import "server-only";
import { toPlainData } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import {
  StandardAction,
  getAccessibleWhere,
  pickReadableFields,
} from "@base/authorization";

export async function listCustomersQuery(filter: any = {}) {
  const { client, ability } = await getTenantCustomerContext();

  // 1. 读权限断言与 SQL 下推
  assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);
  const accessibleWhere = getAccessibleWhere(ability, CustomerSubject, "read");

  const result = await CustomerService.listCustomers(
    client,
    filter,
    accessibleWhere,
  );

  // 2. 字段级授权裁剪 + 序列化防线
  const items = result.items.map((item) => {
    const readable = pickReadableFields(ability, CustomerSubject, item);
    return {
      id: item.customerCode,
      ...readable,
      // 显式保证数值与时间类型纯度
      creditLimit: item.creditLimit ? Number(item.creditLimit) : 0,
      createdAt: item.createdAt.toISOString(),
    };
  });

  return toPlainData({ ...result, items });
}
```

---

### 阶段 3：原子自愈 Server Action (Actions)

- **对齐规范**：`nextjs-app-router-patterns` (Server Actions 闭环自愈)、CASL 四层授权。

```typescript
// packages/domains/customer-center/src/features/customer-management/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction, toPlainData } from "@base/shared";
import { assertWritableFields, StandardAction } from "@base/authorization";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { customerInputSchema } from "./schema";
import { CustomerService } from "./service";

export const createCustomerAction = defineServerAction(
  async (rawInput: unknown) => {
    const { client, ability, userId } = await getTenantCustomerContext();

    // 1. 动作权限断言
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerSubject);

    // 2. 共享 Zod Schema 校验
    const input = customerInputSchema.parse(rawInput);

    // 3. CASL 字段级防篡改不可逆物理校验
    assertWritableFields(
      ability,
      StandardAction.CREATE,
      CustomerSubject,
      input,
    );

    // 4. 执行业务写入
    const created = await CustomerService.createCustomer(client, input, {
      userId,
      deptId: null,
    });

    // 5. 官方自愈范式：服务端刷新路径缓存，客户端零 refresh() 编排
    revalidatePath("/customer/customers");
    return toPlainData(created);
  },
  "创建客户失败",
);
```

---

### 阶段 4：纯受控 URL 驱动视图 (View Client)

- **对齐规范**：`vercel-react-best-practices` (`rerender-derived-state-no-effect`, `rendering-usetransition-loading`)，代码行数缩减 80%。

```tsx
// packages/domains/customer-center/src/features/customer-management/ui/CustomerView.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  DataTable,
  useTableUrlState,
  DataTableRowActions,
  Badge,
  toast,
} from "@base/ui";
import { CustomerSubject, MasterDataStatus } from "../contract";
import { updateCustomerStatusAction, deleteCustomerAction } from "../actions";
import { CustomerFormModal } from "./CustomerFormModal";
import type { CustomerListItem, CustomerPageOptions } from "../types";

export function CustomerView({
  data,
  total,
  page,
  pageSize,
  categoryOptions,
}: {
  data: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
} & CustomerPageOptions) {
  // 1. 100% URL 状态驱动，零 data 镜像 state
  const { keyword, search, setFilter, setPage, getFilter } = useTableUrlState();
  const [isPending, startTransition] = useTransition();

  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: CustomerListItem;
  }>({ open: false, mode: "create" });

  const columns = [
    { accessorKey: "customerCode", header: "客户编码" },
    { accessorKey: "customerName", header: "客户名称" },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }: any) => (
        <Badge
          variant={
            row.original.status === MasterDataStatus.ACTIVE
              ? "success"
              : "muted"
          }
        >
          {row.original.status === MasterDataStatus.ACTIVE ? "正常" : "已停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }: any) => (
        <DataTableRowActions
          subject={CustomerSubject}
          onView={() =>
            setModal({ open: true, mode: "view", record: row.original })
          }
          onEdit={() =>
            setModal({ open: true, mode: "edit", record: row.original })
          }
          onToggleStatus={() => {
            startTransition(async () => {
              const next =
                row.original.status === MasterDataStatus.ACTIVE
                  ? MasterDataStatus.DISABLED
                  : MasterDataStatus.ACTIVE;
              const res = await updateCustomerStatusAction(
                row.original.customerCode,
                next,
              );
              if (res.success) toast.success("状态更新成功");
            });
          }}
          onDelete={() => {
            startTransition(async () => {
              const res = await deleteCustomerAction(row.original.customerCode);
              if (res.success) toast.success("客户已删除");
            });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        columns={columns}
        rowKey={(item) => item.customerCode}
        onPageChange={setPage}
        isLoading={isPending}
        search={{
          value: keyword,
          placeholder: "输入客户名称/编码后回车...",
          onSearch: search,
        }}
        filters={[
          {
            key: "category",
            label: "客户分类",
            value: getFilter("category"),
            options: categoryOptions.map((c) => ({
              label: c.categoryName,
              value: c.categoryCode,
            })),
            onChange: (val) => setFilter("category", val),
          },
        ]}
        onCreate={() => setModal({ open: true, mode: "create" })}
      />

      {modal.open && (
        <CustomerFormModal
          open={modal.open}
          mode={modal.mode}
          record={modal.record}
          categoryOptions={categoryOptions}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
```

---

### 阶段 5：shadcn 官方无障碍表单 (FormModal)

- **对齐规范**：`shadcn` skill（`FieldGroup` + `Field` + `data-invalid` + `DialogTitle`），严禁裸 `div`。

```tsx
// packages/domains/customer-center/src/features/customer-management/ui/CustomerFormModal.tsx
"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Spinner,
  toast,
} from "@base/ui";
import { customerInputSchema, type CustomerInput } from "../schema";
import { createCustomerAction, updateCustomerAction } from "../actions";

export function CustomerFormModal({
  open,
  mode,
  record,
  categoryOptions,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit" | "view";
  record?: any;
  categoryOptions: Array<{ categoryCode: string; categoryName: string }>;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isView = mode === "view";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: record ?? {
      customerName: "",
      settlementType: "MONTHLY",
      contactPerson: "",
      contactPhone: "",
    },
  });

  const onSubmit = (values: CustomerInput) => {
    startTransition(async () => {
      const res =
        mode === "edit"
          ? await updateCustomerAction(record.customerCode, values)
          : await createCustomerAction(values);

      if (res.success) {
        toast.success(mode === "edit" ? "客户更新成功" : "客户创建成功");
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "新建客户档案"
              : mode === "edit"
                ? "编辑客户档案"
                : "客户档案详情"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="flex flex-col gap-3">
            {/* 客户名称 */}
            <Field data-invalid={Boolean(errors.customerName)}>
              <FieldLabel htmlFor="customerName">客户名称 *</FieldLabel>
              <Input
                id="customerName"
                disabled={isView || isPending}
                aria-invalid={Boolean(errors.customerName)}
                {...register("customerName")}
              />
              {errors.customerName?.message && (
                <FieldDescription className="text-destructive text-xs">
                  {errors.customerName.message}
                </FieldDescription>
              )}
            </Field>

            {/* 客户分类 */}
            <Field data-invalid={Boolean(errors.categoryId)}>
              <FieldLabel>客户分类 *</FieldLabel>
              <Select
                disabled={isView || isPending}
                value={watch("categoryId")}
                onValueChange={(val) => setValue("categoryId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择客户分类" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.categoryCode} value={cat.categoryCode}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* 结算方式 */}
            <Field>
              <FieldLabel>结算方式</FieldLabel>
              <Select
                disabled={isView || isPending}
                value={watch("settlementType")}
                onValueChange={(val: any) => setValue("settlementType", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择结算方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">月结</SelectItem>
                  <SelectItem value="CASH">现结</SelectItem>
                  <SelectItem value="PREPAID">预付款</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* 联系人与电话 */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="contactPerson">联系人</FieldLabel>
                <Input
                  id="contactPerson"
                  disabled={isView || isPending}
                  {...register("contactPerson")}
                />
              </Field>
              <Field data-invalid={Boolean(errors.contactPhone)}>
                <FieldLabel htmlFor="contactPhone">联系电话</FieldLabel>
                <Input
                  id="contactPhone"
                  disabled={isView || isPending}
                  {...register("contactPhone")}
                />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {isView ? "关闭" : "取消"}
            </Button>
            {!isView && (
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 size-4" />}
                保存
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 阶段 6：流式装配与 Suspense 路由 (Page RSC)

- **对齐规范**：`nextjs-app-router-patterns` (Pattern 1)、`parseTableSearchParams`。

```tsx
// apps/tenant/src/app/(dashboard)/customer/customers/page.tsx
import { Suspense } from "react";
import { DataTableSkeleton, parseTableSearchParams } from "@base/ui";
import { CustomerView } from "@base/feature-customer-center/customer-management";
import {
  listCustomersQuery,
  getCustomerPageOptionsQuery,
} from "@base/feature-customer-center/customer-management/server";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // 官方范式：一行代码完成参数校验提取并计算局部 suspenseKey
  const { page, pageSize, keyword, filters, suspenseKey } =
    parseTableSearchParams(params, {
      defaultPageSize: 10,
      filterKeys: ["category", "status"],
    });

  return (
    <Suspense
      key={suspenseKey}
      fallback={<DataTableSkeleton columns={5} rows={10} />}
    >
      <CustomersContainer
        page={page}
        pageSize={pageSize}
        keyword={keyword}
        category={filters.category}
        status={filters.status}
      />
    </Suspense>
  );
}

async function CustomersContainer({
  page,
  pageSize,
  keyword,
  category,
  status,
}: any) {
  // 并行获取，消灭瀑布流
  const [data, options] = await Promise.all([
    listCustomersQuery({
      page,
      pageSize,
      keyword,
      categoryCode: category,
      status,
    }),
    getCustomerPageOptionsQuery(),
  ]);

  return (
    <CustomerView
      data={data.items}
      total={data.total}
      page={page}
      pageSize={pageSize}
      categoryOptions={options.categoryOptions}
      tagOptions={options.tagOptions}
    />
  );
}
```

---

## 五、 关键红线与验收标准 (Zero-Tolerance Checklist)

在落地任何业务切片开发或重构时，以下规则由自动化门禁和代码评审强制执行：

1. **严禁客户端数据双写**：Client View 严禁 `useState(initialData)`，严禁在 `useEffect` 里根据 props 重新 set state；
2. **严禁客户端编排刷新**：Server Action 必须内部 `revalidatePath`，客户端严禁写 `router.refresh()`；
3. **严禁裸写非受控表单与裸 div**：表单 100% 使用 `FieldGroup` + `Field` + `react-hook-form` + `zodResolver`；
4. **严禁写操作按钮裸奔**：写操作按钮必须使用 CASL 权限声明式包裹，Server Action 必须调用 `assertWritableFields`；
5. **严禁破坏事务与错误码**：多表操作必须使用 Prisma `$transaction`，业务冲突必须明确捕获重试或透出真实错误，严禁静默吞错；
6. **代码行数指标**：单切片整体 CRUD 视图代码必须控制在 300 行以内（Page ~25行、View ~80行、Modal ~120行、Actions ~40行），实现真正意义上的“少即是多”。
