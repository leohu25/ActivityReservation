# 模块 3：服务层实现与 RSC 读取查询 (Services & Queries)

在遵循 **Feature-based Vertical Slice Architecture** 的业务切片中，业务服务与查询就近内聚在各 Feature / Sub-Feature 内部，直接消费横向平台模块 `@base/db-tenant` 导出的全局单例 `TenantPrismaClient`。

---

## 目录结构规范

```bash
packages/domains/<business-area>/src/
├── features/
│   └── <feature>/
│       ├── service.ts         # 纯业务领域逻辑与数据库事务 (包内私有实现)
│       ├── queries.ts         # RSC 服务端只读查询 (标明 import "server-only")
│       └── public.server.ts   # 纯服务端公开导出入口
├── shared/
│   └── server/
│       └── tenant-context.ts  # 纯底层租户会话解析与员工准入门禁 (向下依赖平台包)
└── assembly/
    └── context.ts             # 业务区域级拓扑编译、行级数据范围注入与 CASL Ability 运行时装配
```

---

## 1. 租户上下文解析与装配 (`src/assembly/context.ts`)

业务切片装配层直接使用基座提供的高阶工厂 **`createTenantSliceContext(catalog)`**（Next.js App Router 官方推荐范式），**一行代码完成租户 DB、员工门禁、部门拓扑与 CASL 权限的强类型装配**，严禁在业务切片内手写重复样板代码：

```ts
// src/assembly/context.ts
import {
  createTenantSliceContext,
  type TenantSliceContext,
} from "@base/authorization/server";
import { xxxCatalog } from "../catalog";
import type {
  XxxActionType,
  XxxSubjectType,
} from "../shared/contract-types";

export type TenantXxxContext = TenantSliceContext<
  XxxActionType,
  XxxSubjectType
>;

/**
 * 业务切片装配层：自动集成 React.cache() 请求级去重、TenantDb 连接池与部门拓扑解析
 */
export const {
  getContext: getTenantXxxContext,
  assertAbility: assertXxxAbility,
} = createTenantSliceContext<XxxActionType, XxxSubjectType>(xxxCatalog);
```

> **架构收益**：
> 1. **零重复代码**：消除各切片手写 `headers()`、`getCurrentTenantContext`、`TenantDbManager`、`findEmployeeProfile` 与 `findAllDepartments` 的 80 行模板代码；
> 2. **请求级去重**：依托 `React.cache()`，单次请求内 Service、Query 或 Action 调用多次只执行一次数据库连接与 Ability 编译；
> 3. **强类型闭环**：通过泛型直接绑定当前切片的 `Action` 与 `Subject`，阻断权限误用。

---

## 2. 领域服务编写核心原则

1. **单调自增防并发重号**：编码必须遵循 `PREFIX-YYYYMMDD-XXXX` 格式；
2. **级联状态机联动**：如“停用客户时强制同步停用其名下所有关联门店”；
3. **软删除安全落地 (ADR-009)**：
   - 业务数据禁止物理 `delete`，统一执行软删除更新：`isDeleted: true`、`deletedAt: new Date()`、`deletedById: auditCtx.userId`；

### 多表写操作事务标准（Prisma 7 Interactive Transaction）

写操作涉及 **≥2 张表 / ≥2 次写**（主子表、组织+成员+角色、单据+明细等）时，必须使用 Prisma 官方 Interactive Transaction，保证原子性：

```ts
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.salesOrder.create({ data: { ... } });
  await tx.salesOrderItem.createMany({ data: items });
  return order; // 返回值在 commit 后可用
});
// 副作用（发邮件/队列/外部 API）放在事务提交之后
```

铁律：
1. 事务内只通过 `tx.*` 写库；写 `prisma.*` 会跑到事务外，不会随回调回滚；
2. helper 需要写库时**传入 `tx`**，禁止在 helper 内再开嵌套事务；
3. 回调 `throw` 整体回滚，`return` 即提交；
4. 发邮件、发消息、调外部 API **禁止**放在事务回调内；
5. 跨物理库（Control DB + 租户库）无法用单个事务覆盖：主库事务成功后外库失败须补偿回滚。

写 Prisma 具体 API 时，**必须优先查阅官方 skill `prisma-client-api`**（`references/transactions.md` 等），禁止凭记忆臆造参数。
   - 存在活跃下级或关联单据时，拦截删除操作，引导用户进行“停用”；
4. **数据范围与软删除物理下推**：`listXxx` 查询必须在 SQL 条件中组合 `{ isDeleted: false }` 与 `accessibleWhere`，杜绝已删除或越权数据泄漏；
5. **统一分页清洗与防御 (`resolvePagination`)**：严禁在各 Service 中机械手写 `Math.max(1, ...)` / `Math.min(100, ...)` / `skip = (page - 1) * pageSize` 样板代码。统一从 `@base/shared` 引入中立工具 `resolvePagination(filter, options)`，一行解构出 `{ page, pageSize, skip, take }`，自动完成非负清洗、最大页长边界防御（防 OOM 内存攻击）与 Prisma 查询参数直连；
6. **包内私有实现**：`service.ts` 是当前 Feature 内部实现细节，绝不向外部应用（`apps/tenant`）直接暴露，外部只调用 `queries.ts`（读）或 `actions.ts`（写）。

```ts
import type { TenantPrismaClient } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";
import { resolvePagination } from "@base/shared";

export class ResourceService {
  /**
   * 资源列表查询：组合软删除过滤与行级数据范围下推
   */
  static async listResources(
    client: TenantPrismaClient,
    filter: ListResourceFilter = {},
    accessibleWhere?: PrismaQueryCondition,
  ) {
    // 统一中立分页解析：一行搞定清洗、防 OOM 边界与 skip/take
    const { page, pageSize, skip, take } = resolvePagination(filter, {
      defaultPageSize: 20,
    });

    const andConditions: unknown[] = [{ isDeleted: false }];
    if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
      andConditions.push(accessibleWhere);
    }
    // ... 合并其他业务筛选条件
    const where = { AND: andConditions };

// 注：示例中使用具体业务代理 client.resource（已由 TenantPrismaClient 强类型提供）
    const [total, items] = await Promise.all([
      client.resource.count({ where }),
      client.resource.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 软删除业务保护规则 (ADR-009)
   */
  static async deleteResource(
    client: TenantPrismaClient,
    id: string,
    auditCtx?: { userId: string },
  ) {
    const relationCount = await client.subResource.count({
      where: { resourceId: id, isDeleted: false },
    });
    if (relationCount > 0) {
      throw new Error(
        `该条目下存在 ${relationCount} 项强关联子项目，禁止删除，请先进行“停用”操作`,
      );
    }

    return client.resource.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: auditCtx?.userId ?? null,
      },
    });
  }
}
```

---

## 3. RSC 服务端只读查询 (`queries.ts`)

为了消灭“服务端页面加载绕调 Server Action”的反模式，所有 RSC 数据获取统一编写独立的 `queries.ts`，首行必须引入 `import "server-only"`，并在读取时通过 `getAccessibleWhere` 下推权限过滤：

```ts
import "server-only";
import { toPlainData } from "@base/shared";
import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import {
  getTenantDomainContext,
  assertDomainAbility,
} from "../../assembly/context";
import { ResourceSubject } from "./contract";
import { ResourceService } from "./service";
import type { ResourceListItem, ListResourceFilter } from "./types";

export async function listResourcesQuery(filter: ListResourceFilter = {}) {
  const { client, ability } = await getTenantDomainContext();
  assertDomainAbility(ability, "read", ResourceSubject);

  // 1. 下推行级数据范围（SELF / DEPT / DEPT_TREE / ALL）至数据库物理层
  const accessibleWhere = getAccessibleWhere(ability, ResourceSubject, "read");
  const result = await ResourceService.listResources(
    client,
    filter,
    accessibleWhere,
  );

  // 2. 物理级列权限脱敏 (HIDDEN 列物理剥离)
  const items: ResourceListItem[] = result.items.map((item) => {
    const readable = pickReadableFields(
      ability,
      ResourceSubject,
      item as Record<string, unknown>,
    );
    return {
      id: item.id,
      ...readable,
    } as unknown as ResourceListItem;
  });

  return toPlainData({ ...result, items });
}
```

---

## 4. 宿主外键下拉选项聚合查询 (`get*PageOptionsQuery`)

### 核心架构痛点与反模式

在业务列表页面（如客户档案、销售订单、物料主数据）中，通常需要表格顶部的下拉筛选或新建弹窗里的外键选择（如选择分类、标签、单位）。
**严禁直接在业务页面调用关联字典模块后台管理专用的 `*TreeQuery` 或详情 Query**！
否则一旦在角色管理中剥夺了用户的“分类维护权限”，进入主业务列表时就会因关联字典的强断言导致整页抛出 `ForbiddenError` 崩溃。

### 标准规范：宿主聚合 BFF 模式 (Contextual Page Options)

1. **鉴权归宿主**：由宿主业务的 `queries.ts` 提供聚合查询 `get*PageOptionsQuery`，内部只校验宿主自身的读取权限（如 `ResourceSubject`）；
2. **底层方法统一复用 (DRY)**：底层 Service 统一提供带 `{ status?: "ACTIVE" }` 过滤的方法，管理端不传 status 查全量，下拉端传 `status: "ACTIVE"` 只查启用项；
3. **全链路统一命名**：Query、Props、变量一律命名为 `*Options`（如 `categoryOptions`, `tagOptions`）。

```ts
import "server-only";
import { cache } from "react";
import { toPlainData } from "@base/shared";
import { StandardAction } from "@base/authorization";
import { getTenantXxxContext, assertXxxAbility } from "../../assembly/context";
import { XxxSubject } from "./contract";
import { CategoryService } from "./category/service";
import { TagService } from "./tag/service";
import type { CategoryItem, TagItem } from "./types";

export interface XxxPageOptions {
  categoryOptions: CategoryItem[];
  tagOptions: TagItem[];
}

/**
 * 宿主页面所需下拉选项聚合查询 (BFF 模式)
 * 校验宿主 XxxSubject 读权限，一次性并发聚合当前租户 ACTIVE 状态的关联选项
 */
export const getXxxPageOptionsQuery = cache(
  async (): Promise<XxxPageOptions> => {
    const { client, ability } = await getTenantXxxContext();
    assertXxxAbility(ability, StandardAction.READ, XxxSubject);

    const [categoryOptions, tagOptions] = await Promise.all([
      CategoryService.listCategories(client, { status: "ACTIVE" }),
      TagService.listTags(client, { status: "ACTIVE" }),
    ]);

    return toPlainData({ categoryOptions, tagOptions });
  },
);
```

---

## 5. 逻辑外键与关系更新规范 (Prisma Nested Connect/Disconnect)

### 核心架构原则与防坑红线

本项目全仓通过门禁强制配置 `relationMode = "prisma"`（底层 PostgreSQL 消除物理外键与跨表死锁，仅保留普通索引）。
在 Prisma Schema 中，为了让应用层能方便地使用 `include: { department: true }` 关联读取，通常会声明应用层逻辑关系辅助字段：

```prisma
departmentId  String?      @map("department_id")
department    Department?  @relation(fields: [departmentId], references: [id])
```

### 强类型更新标准范式 (SSoT)

**【铁律】凡是在 Schema 中声明了 `@relation` 的逻辑关联字段，在 Service 执行 `update` 时，必须统一使用 Prisma 强类型嵌套关联语法，严禁直接向 `update` 传递裸外键标量！**

```ts
// ❌ 错误示范：极易触发 Prisma XOR 推导冲突，导致运行时拦截抛出 Unknown argument
await client.employeeProfile.update({
  where: { id: employeeId },
  data: {
    departmentId: targetDeptId, // 💥 触发：Unknown argument departmentId. Did you mean department?
    positionId: targetPosId,
  },
});

// ✅ 官方标准示范：100% 命中 UpdateInput 强类型契约，平滑落盘
await client.employeeProfile.update({
  where: { id: employeeId },
  data: {
    name: cleanName,
    // 存在 targetDeptId 则 connect 关联；为空或 null 则 disconnect 解除
    department: targetDeptId
      ? { connect: { id: targetDeptId } }
      : { disconnect: true },
    position: targetPosId
      ? { connect: { id: targetPosId } }
      : { disconnect: true },
  },
});
```

- **底层执行保证**：由于底层配置了 `relationMode = "prisma"`，数据库最终执行的依然是普通字段更新 SQL（`UPDATE "employee_profile" SET "department_id" = $1 ...`），不会触碰任何数据库物理约束；
- **全链路强类型**：必须从 `@base/db-tenant` 引入 `TenantPrisma`，严禁在 Service 或单测中使用 `any`。

---

## 查询层约定（已固化通用标准）

1. `queries.ts` 首行 `import "server-only"`。
2. 租户上下文与 Ability：经 `assembly/context.ts`，并用 **React `cache()`** 无参记忆化。
3. 列表 Query：返回 **DTO 投影**（Decimal→number、Date→ISO），禁止 Prisma 实体直出。
4. 页面 options 与 list 使用 `Promise.all` 并行。
5. 发号在 `service.ts`，禁止 `count(*)+1`。
