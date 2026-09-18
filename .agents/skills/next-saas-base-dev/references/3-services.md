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

## 1. 租户上下文解析 (`shared/server/tenant-context.ts`)

业务包基础共享层直接通过 `@base/auth` 与 `@base/db-tenant` 获取安全路由后的 `TenantPrismaClient` 与员工档案快照，严格遵守单向依赖：

```ts
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime, assertTenantAccessGate, type TenantContext } from "@base/auth";
import { getTenantDbManager, type TenantPrismaClient } from "@base/db-tenant";

export interface TenantDbContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly role: string;
  readonly client: TenantPrismaClient;
  readonly tenantCtx: TenantContext;
  readonly employeeProfile: {
    id: string;
    memberId: string | null;
    departmentId: string | null;
    employeeNo: string | null;
    jobTitle: string | null;
    status: string;
  } | null;
}

export async function getTenantDbContext(): Promise<TenantDbContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });

  const client = await manager.getClient(tenantCtx.organizationId);
  // 员工在职状态与租户门禁强校验 (Fail-Closed)
  const employeeProfile = await client.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    select: {
      id: true,
      memberId: true,
      departmentId: true,
      employeeNo: true,
      jobTitle: true,
      status: true,
    },
  });
  assertTenantAccessGate(employeeProfile);

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    role: tenantCtx.member.role,
    client,
    tenantCtx,
    employeeProfile,
  };
}
```

---

## 2. 领域服务编写核心原则

1. **单调自增防并发重号**：编码必须遵循 `PREFIX-YYYYMMDD-XXXX` 格式；
2. **级联状态机联动**：如“停用客户时强制同步停用其名下所有关联门店”；
3. **软删除安全落地 (ADR-009)**：
   - 业务数据禁止物理 `delete`，统一执行软删除更新：`isDeleted: true`、`deletedAt: new Date()`、`deletedById: auditCtx.userId`；
   - 存在活跃下级或关联单据时，拦截删除操作，引导用户进行“停用”；
4. **数据范围与软删除物理下推**：`listXxx` 查询必须在 SQL 条件中组合 `{ isDeleted: false }` 与 `accessibleWhere`，杜绝已删除或越权数据泄漏；
5. **包内私有实现**：`service.ts` 是当前 Feature 内部实现细节，绝不向外部应用（`apps/tenant`）直接暴露，外部只调用 `queries.ts`（读）或 `actions.ts`（写）。

```ts
import type { TenantPrismaClient } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";

export class CustomerService {
  /**
   * 客户列表查询：组合软删除过滤与行级数据范围下推
   */
  static async listCustomers(
    client: TenantPrismaClient,
    filter: ListCustomerFilter = {},
    accessibleWhere?: PrismaQueryCondition,
  ) {
    const andConditions: any[] = [{ isDeleted: false }];
    if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
      andConditions.push(accessibleWhere);
    }
    // ... 合并其他业务筛选条件
    const where = { AND: andConditions };

    return client.customer.findMany({ where, /* 分页与排序 */ });
  }

  /**
   * 软删除客户业务保护规则 (ADR-009)
   */
  static async deleteCustomer(
    client: TenantPrismaClient,
    customerCode: string,
    auditCtx?: { userId: string },
  ) {
    const storeCount = await client.customerStore.count({
      where: { customerCode, isDeleted: false },
    });
    if (storeCount > 0) {
      throw new Error(`该客户下存在 ${storeCount} 家关联门店，禁止删除，请进行“停用”操作`);
    }

    return client.customer.update({
      where: { customerCode },
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
import { getTenantCustomerContext, assertCustomerAbility } from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type { CustomerListItem, ListCustomerFilter } from "./types";

export async function listCustomersQuery(filter: ListCustomerFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerSubject);

  // 1. 下推行级数据范围（SELF / DEPT / DEPT_TREE / ALL）至数据库物理层
  const accessibleWhere = getAccessibleWhere(ability, CustomerSubject, "read");
  const result = await CustomerService.listCustomers(client, filter, accessibleWhere);

  // 2. 物理级列权限脱敏 (HIDDEN 列物理剥离)
  const items: CustomerListItem[] = result.items.map((item) => {
    const readable = pickReadableFields(ability, CustomerSubject, item as Record<string, unknown>);
    return {
      id: item.customerCode,
      ...readable,
    } as unknown as CustomerListItem;
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

1. **鉴权归宿主**：由宿主业务的 `queries.ts` 提供聚合查询 `get*PageOptionsQuery`，内部只校验宿主自身的读取权限（如 `CustomerSubject`）；
2. **底层方法统一复用 (DRY)**：底层 Service 统一提供带 `{ status?: "ACTIVE" }` 过滤的方法，管理端不传 status 查全量，下拉端传 `status: "ACTIVE"` 只查启用项；
3. **全链路统一命名**：Query、Props、变量一律命名为 `*Options`（如 `categoryOptions`, `tagOptions`）。

```ts
import "server-only";
import { toPlainData } from "@base/shared";
import { StandardAction } from "@base/authorization";
import { getTenantCustomerContext, assertCustomerAbility } from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerCategoryTagService } from "./classification/service";
import type { CustomerCategoryItem, CustomerTagItem } from "./classification/types";

export interface CustomerPageOptions {
  categoryOptions: CustomerCategoryItem[];
  tagOptions: CustomerTagItem[];
}

/**
 * 客户档案页面所需下拉选项聚合查询 (BFF 模式)
 * 校验宿主 CustomerSubject 读权限，一次性聚合当前租户 ACTIVE 状态的分类与标签
 */
export async function getCustomerPageOptionsQuery(): Promise<CustomerPageOptions> {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);

  const [categoryOptions, tagOptions] = await Promise.all([
    CustomerCategoryTagService.listCategories(client, { status: "ACTIVE" }),
    CustomerCategoryTagService.listTags(client, { status: "ACTIVE" }),
  ]);

  return toPlainData({ categoryOptions, tagOptions });
}
```

---

## 查询层约定（已固化，与标杆对齐）

1. `queries.ts` 首行 `import "server-only"`。
2. 租户上下文与 Ability：经 `assembly/context.ts`，并用 **React `cache()`** 无参记忆化（见 `9-crud-resource-paradigm.md`）。
3. 列表 Query：返回 **DTO 投影**（Decimal→number、Date→ISO），禁止 Prisma 实体直出。
4. 页面 options 与 list 使用 `Promise.all` 并行。
5. 发号在 `service.ts`，禁止 `count(*)+1`。

