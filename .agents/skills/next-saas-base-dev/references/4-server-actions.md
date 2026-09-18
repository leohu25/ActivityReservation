# 模块 4：安全 Server Actions 与序列化规范

在 Next.js App Router 全栈架构中，Server Component 与 Client Component 之间存在严格的数据序列化边界。

> ⚠️ **核心红线**：
>
> 1. **严禁原始实体直出**：Prisma 查询返回的带有 `Decimal`、`Date`、`BigInt` 的对象，如果直接作为 Server Action 的返回值返回给前端，Next.js 会在控制台抛出 `Only plain objects can be passed to Client Components. Decimal objects are not supported` 错误；
> 2. **RSC 读取与 mutation 分离**：Server Component 初始读取使用 `server-only` Query；只有客户端触发的 mutation 使用 Server Action；
> 3. **统一使用 `defineServerAction` 包装 mutation**：由机制确保返回值安全序列化并消灭重复 `try...catch`；
> 4. **写路径强制 CASL 守卫**：create/update/delete/状态变更必须 `assert*Ability`，与页面按钮同一 `(action, subject)`（ADR-007：业务权限只认 CASL）；
> 5. **操作人与部门审计落盘 (ADR-009)**：新建数据时，必须从租户上下文提取 `userId` 与 `employeeProfile?.departmentId` 写入实体 `createdById` 与 `deptId`（`createResourceActions` 已自动注入 deptId）。

---

## 1. 标准 CRUD：`createResourceActions`（推荐 / 已固化）

标准增改查优先使用 `@base/biz-shared` 工厂，业务只注入 context/subject/schema/service；在 `"use server"` 文件中**平铺 re-export**：

```ts
"use server";

import { createResourceActions } from "@base/biz-shared";
import { getTenantCustomerContext, assertCustomerAbility } from "../../assembly/context";
import { CustomerField, CustomerSubject, CustomerAction } from "./contract";
import { parseCreateCustomerInput, parseUpdateCustomerInput } from "./schema";
import { CustomerService } from "./service";

const actions = createResourceActions({
  getContext: async () => {
    const ctx = await getTenantCustomerContext();
    return {
      client: ctx.client,
      ability: ctx.ability,
      userId: ctx.userId,
      deptId: ctx.employeeProfile?.departmentId ?? null,
    };
  },
  subject: CustomerSubject,
  controlledFields: Object.values(CustomerField),
  assertAbility: (ability, action, subject) => {
    assertCustomerAbility(ability as never, action as never, subject as never);
  },
  revalidatePaths: ["/customer/customers"],
  schemas: { create: parseCreateCustomerInput, update: parseUpdateCustomerInput },
  service: {
    create: (client, input, ctx) => CustomerService.createCustomer(client as never, input as never, ctx),
    update: (client, id, input, ctx) => CustomerService.updateCustomer(client as never, id, input as never, ctx),
    remove: (client, id, ctx) => CustomerService.deleteCustomer(client as never, id, ctx),
    toggleStatus: (client, id, status, ctx) =>
      CustomerService.updateCustomerStatus(client as never, id, status as never, ctx),
  },
  toggleAction: CustomerAction.TOGGLE_STATUS,
  toggleExtraRevalidatePaths: ["/customer/stores"],
});

export const createCustomerAction = actions.create!;
export const updateCustomerAction = actions.update!;
export const deleteCustomerAction = actions.remove!;
export const updateCustomerStatusAction = actions.toggleStatus!;
```

工厂管道：`getContext → assertAbility → Zod → assertEditableFields → service → revalidatePath`。  
定制：`onBeforeCreate` / `onBeforeUpdate` / 自定义 service 方法。

完整范式见 `references/9-crud-resource-paradigm.md`。

---

## 1b. 手写 `defineServerAction`（完全特异逻辑时）

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { assertCustomerAbility, getTenantCustomerContext } from "../../assembly/context";
import { CustomerService } from "./service";
import { CustomerSubject } from "./contract";
import type { CreateCustomerInput } from "./types";

export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerSubject);

    const created = await CustomerService.createCustomer(client, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/customer/customers");
    return created;
  },
  "创建客户失败",
);
```

注意：客户端默认不 `router.refresh()`；自愈靠 Action 内 `revalidatePath`。

---

## 2. 业务区域运行时 Ability 装配 (`src/assembly/context.ts`)

为了彻底解除底层 `shared/server` 基础设施对具体 Feature 业务契约的反向依赖，权限编译、部门拓扑解析与装配统一置于 Business Area 的装配层：

```ts
// src/assembly/context.ts（以 customer-center 为标杆）
import { getServerAuthRuntime } from "@base/auth";
import {
  CaslAbilityFactory,
  type AppPrismaAbility,
} from "@base/authorization";
import { resolveEmployeeTopology } from "@base/db-tenant";
import { ForbiddenError } from "@casl/ability";
import {
  getTenantDbContext,
  type TenantDbContext,
} from "../shared/server/tenant-context";
import { customerCatalog } from "../catalog";

export interface TenantCustomerContext extends TenantDbContext {
  readonly ability: AppPrismaAbility<string, string>;
}

export async function getTenantCustomerContext(): Promise<TenantCustomerContext> {
  const dbCtx = await getTenantDbContext();
  const runtime = getServerAuthRuntime();

  // 1. 动态自驱解析当前用户在租户内的部门拓扑 (Fail-Closed)
  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: async (memberId: string) =>
        dbCtx.client.employeeProfile.findUnique({
          where: { memberId },
          select: { id: true, memberId: true, departmentId: true, employeeNo: true, jobTitle: true, status: true },
        }),
      findAllDepartments: async () =>
        dbCtx.client.department.findMany({ select: { id: true, parentId: true } }),
    },
    { userId: dbCtx.userId, memberId: dbCtx.memberId },
  );

  // 2. 编译具备完整 CASL 规则与行级数据范围（Prisma 条件）的 Ability 实例
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog,
  );
  const ability = (await factory.createPrismaAbilityForTenant(
    dbCtx.tenantCtx,
    topology,
  )) as AppPrismaAbility<string, string>;

  return { ...dbCtx, ability };
}

export function assertCustomerAbility(
  ability: AppPrismaAbility<string, string>,
  action: string,
  subject: string,
): void {
  ForbiddenError.from(ability).throwUnlessCan(action, subject);
}
```

---

## 3. 前端消费契约

所有由 `defineServerAction` 包装的 Action，返回类型自动推导为标准的：

```ts
type ServerActionResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };
```

前端消费极其清爽直观：

```tsx
const res = await updateCustomerStatusAction(code, "DISABLED");
if (res.success) {
  toast.success("客户已成功停用");
  // 响应式更新前端 State...
} else {
  toast.error(res.error); // 无权限时这里是 ForbiddenError 文案
}
```
