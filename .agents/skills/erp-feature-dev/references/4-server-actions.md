# 模块 4：安全 Server Actions 与序列化规范

在 Next.js App Router 全栈架构中，Server Component 与 Client Component 之间存在严格的数据序列化边界。

> ⚠️ **核心红线**：
>
> 1. **严禁原始实体直出**：Prisma 查询返回的带有 `Decimal`、`Date`、`BigInt` 的对象，如果直接作为 Server Action 的返回值返回给前端，Next.js 会在控制台抛出 `Only plain objects can be passed to Client Components. Decimal objects are not supported` 错误；
> 2. **统一使用 `defineServerAction` 包装器**：彻底消灭手工写 `try...catch` 和人工调用 `toPlainData` 的重复代码，由机制底层确保 100% 自动序列化；
> 3. **写路径强制 CASL**：create/update/delete/状态变更必须 `assert*Ability`，与页面按钮同一 `(action, subject)`（ADR-007：业务权限只认 CASL）。

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
} from "./server/session";
import { CustomerService } from "./services";
import { CustomerSubject } from "./contracts";
import type { CreateCustomerInput } from "./types";

// 1. 读路径：同样校验 read
export const listCustomersAction = defineServerAction(
  async (filter?: { keyword?: string; page?: number }) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "read", CustomerSubject);
    return CustomerService.listCustomers(client, filter);
  },
  "获取客户列表失败",
);

// 2. 写路径：create
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

// 3. 自定义扩展动作：与契约 action 名一致
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

## Session 必须注入 Ability

```ts
// src/server/session.ts（以 customer-center 为标杆）
export async function getTenantCustomerContext() {
  // ... Better Auth 会话 + 员工门禁 + 租户库 ...
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog, // 来自 src/catalog.ts，由 manifest 契约派生
  );
  const ability = await factory.createForTenant(tenantCtx);
  return { client, ability, organizationId, userId, memberId, role };
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
