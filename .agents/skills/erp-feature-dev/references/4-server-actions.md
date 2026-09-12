# 模块 4：安全 Server Actions 与序列化规范

在 Next.js App Router 全栈架构中，Server Component 与 Client Component 之间存在严格的数据序列化边界。

> ⚠️ **核心红线**：
>
> 1. **严禁原始实体直出**：Prisma 查询返回的带有 `Decimal`、`Date`、`BigInt` 的对象，如果直接作为 Server Action 的返回值返回给前端，Next.js 会在控制台抛出 `Only plain objects can be passed to Client Components. Decimal objects are not supported` 错误；
> 2. **RSC 读取与 mutation 分离**：Server Component 初始读取使用 `server-only` Query；只有客户端触发的 mutation 使用 Server Action；
> 3. **统一使用 `defineServerAction` 包装 mutation**：由机制确保返回值安全序列化并消灭重复 `try...catch`；
> 4. **写路径强制 CASL**：create/update/delete/状态变更必须 `assert*Ability`，与页面按钮同一 `(action, subject)`（ADR-007：业务权限只认 CASL）。

---

## 统一 Action 包装器 (`defineServerAction`)

所有 Server Actions 统一使用 `@chenrun/shared` 导出的 `defineServerAction`：

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerService } from "./service";
import { CustomerSubject } from "./contract";
import type { CreateCustomerInput } from "./types";

// 写路径：create
export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerSubject);
    const created = await CustomerService.createCustomer(client, input);
    revalidatePath("/customer/customers");
    return created;
  },
  "创建客户失败",
);

// 自定义扩展动作：与契约 action 名一致
export const updateCustomerStatusAction = defineServerAction(
  async (customerCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "toggle_status", CustomerSubject);
    const updated = await CustomerService.updateCustomerStatus(
      client,
      customerCode,
      status,
    );
    revalidatePath("/customer/customers");
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新客户状态失败",
);
```

---

## 业务区域运行时 Ability 装配 (`src/assembly/context.ts`)

为了彻底解除底层 `shared/server` 基础设施对具体 Feature 业务契约的反向依赖，权限编译与装配统一置于 Business Area 的装配层：

```ts
// src/assembly/context.ts（以 customer-center 为标杆）
import { CaslAbilityFactory, type AppAbility } from "@chenrun/authorization";
import { ForbiddenError } from "@casl/ability";
import { getServerAuthRuntime } from "@chenrun/auth";
import { getTenantContext } from "../shared/server/tenant-context";
import { customerCatalog } from "../catalog";

export async function getTenantCustomerContext() {
  const baseCtx = await getTenantContext();
  const runtime = getServerAuthRuntime();
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog, // 来自 src/catalog.ts，由 manifest 契约派生
  );
  const ability = await factory.createForTenant({
    organizationId: baseCtx.organizationId,
    member: { id: baseCtx.memberId },
    user: { id: baseCtx.userId },
  } as any);

  return { ...baseCtx, ability };
}

export function assertCustomerAbility(
  ability: AppAbility<string, string>,
  action: string,
  subject: string,
): void {
  ForbiddenError.from(ability).throwUnlessCan(action, subject);
}
```

新切片照抄该模式：`catalog.ts` + `session.ts` 注入 ability + `assert*Ability`。

---

## 前端消费契约

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
