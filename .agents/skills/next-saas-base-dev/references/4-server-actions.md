# 4. Server Actions 编写规范 (Server Actions Protocol)

> **定位**：本文档专门规范全仓所有业务切片在编写写操作（Mutation）时的服务端网关标准。  
> 严格遵循正统 Next.js App Router `"use server"` 规范，使用 `@base/shared` 导出的 `defineServerAction` 强类型包装器。

---

## 一、 核心铁律与红线

1. **统一包装器**：所有对外导出的 Server Action 必须 100% 使用 `defineServerAction(...)` 进行包装，严禁导出裸写 `async function`（防止未捕获异常泄漏敏感堆栈到客户端）；
2. **平铺直写导出**：Server Action 必须作为独立函数在文件顶层平铺导出（Named Export），禁止使用工厂模式深层嵌套导出；
3. **输入边界强校验**：所有 Action 入参必须经由共享的 Zod Schema 强类型约束；
4. **安全与权限断言**：在执行任何业务逻辑前，必须首先从租户上下文提取 Ability 并调用 `assertAbility(ability, action, subject)`；
5. **审计基线自动落盘 (ADR-009)**：新建数据必须从上下文提取 `userId` 与 `employeeProfile?.departmentId` 注入实体的 `createdById` 与 `deptId`；修改与软删除同理；
6. **响应式缓存更新**：Mutation 成功后在 Action 内部直接调用 `revalidatePath(...)` 自愈刷新服务端缓存；**客户端严禁调用 `router.refresh()` 或 `window.location.reload()`**。

---

## 二、 业务装配层运行时上下文 (`src/assembly/context.ts`)

业务切片通过基座高阶工厂 `createTenantSliceContext` 获得内置 `React.cache()` 记忆化的租户上下文：

```ts
// src/assembly/context.ts
import { createTenantSliceContext, type TenantSliceContext } from "@base/authorization/server";
import { domainCatalog } from "../catalog";
import type { DomainActionType, DomainSubjectType } from "../shared/contract-types";

export type TenantDomainContext = TenantSliceContext<DomainActionType, DomainSubjectType>;

export const {
  getContext: getTenantDomainContext,
  assertAbility: assertDomainAbility,
} = createTenantSliceContext<DomainActionType, DomainSubjectType>(domainCatalog);
```

---

## 三、 标准 Server Action 编写范式

```ts
"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { getTenantDomainContext, assertDomainAbility } from "../../assembly/context";
import { ResourceSubject, ResourceAction } from "./contract";
import { createResourceSchema, updateResourceSchema } from "./schema";
import { ResourceService } from "./service";
import type { CreateResourceInput, UpdateResourceInput } from "./types";

/**
 * 创建业务记录 Action
 */
export const createResourceAction = defineServerAction(
  async (input: CreateResourceInput) => {
    // 1. 获取当前租户 DB 客户端与当前登录用户身份
    const { client, ability, userId, employeeProfile } = await getTenantDomainContext();

    // 2. CASL 强类型权限前置断言
    assertDomainAbility(ability, ResourceAction.CREATE, ResourceSubject);

    // 3. 执行领域服务事务写入
    const created = await ResourceService.create(client, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });

    // 4. 服务端缓存精准失效与自愈
    revalidatePath("/<domain>/<resources>");
    return created;
  },
  "创建业务记录失败",
);

/**
 * 更新业务记录 Action
 */
export const updateResourceAction = defineServerAction(
  async (id: string, input: UpdateResourceInput) => {
    const { client, ability, userId } = await getTenantDomainContext();
    assertDomainAbility(ability, ResourceAction.UPDATE, ResourceSubject);

    const updated = await ResourceService.update(client, id, input, {
      userId,
    });

    revalidatePath("/<domain>/<resources>");
    return updated;
  },
  "更新业务记录失败",
);

/**
 * 软删除业务记录 Action
 */
export const deleteResourceAction = defineServerAction(
  async (id: string) => {
    const { client, ability, userId } = await getTenantDomainContext();
    assertDomainAbility(ability, ResourceAction.DELETE, ResourceSubject);

    const deleted = await ResourceService.delete(client, id, {
      userId,
    });

    revalidatePath("/<domain>/<resources>");
    return deleted;
  },
  "删除业务记录失败",
);
```

---

## 四、 跨端序列化与纯数据契约防线

Next.js Server Action 跨越端边界向客户端返回数据时，若包含原生 `Date` 或 Prisma `Decimal` 对象，会导致 React 运行时序列化崩溃。

`defineServerAction` 内部已**全自动集成 `toPlainData(...)` 深度转换**：
- 所有 `Date` 实例自动安全转为 ISO8601 字符串；
- 所有 Prisma `Decimal` 自动转为高精度 `number` 或安全数值；
- 业务开发者直接返回对象即可，无需手动调用深拷贝。
