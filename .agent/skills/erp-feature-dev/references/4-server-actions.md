# 模块 4：安全 Server Actions 与序列化规范

在 Next.js App Router 全栈架构中，Server Component 与 Client Component 之间存在严格的数据序列化边界。

> ⚠️ **核心红线**：
>
> 1. **严禁原始实体直出**：Prisma 查询返回的带有 `Decimal`、`Date`、`BigInt` 的对象，如果直接作为 Server Action 的返回值返回给前端，Next.js 会在控制台抛出 `Only plain objects can be passed to Client Components. Decimal objects are not supported` 错误；
> 2. **统一使用 `defineServerAction` 包装器**：彻底消灭手工写 `try...catch` 和人工调用 `toPlainData` 的重复代码，由机制底层确保 100% 自动序列化。

---

## 统一 Action 包装器 (`defineServerAction`)

所有 Server Actions 统一使用 `@chenrun/shared` 导出的 `defineServerAction`：

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import { getTenantCustomerContext } from "./server/session";
import { CustomerService } from "./services";
import type { CreateCustomerInput } from "./types";

// 1. 无参查询 Action
export const getCategoryTreeAction = defineServerAction(async () => {
  const { client } = await getTenantCustomerContext();
  return CustomerCategoryTagService.getCategoryTree(client);
}, "获取分类树失败");

// 2. 单参变更 Action
export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerService.createCustomer(client, input);
    revalidatePath("/customer/customers");
    return created; // 👈 开发者无需关心序列化，底层会自动通过 superjson 转为纯 Plain Object！
  },
  "创建客户失败",
);

// 3. 多参变更 Action
export const updateCustomerStatusAction = defineServerAction(
  async (customerCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerService.updateCustomerStatus(client, customerCode, status);
    revalidatePath("/customer/customers");
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新客户状态失败",
);
```

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
  toast.error(res.error);
}
```
