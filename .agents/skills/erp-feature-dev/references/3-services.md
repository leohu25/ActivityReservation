# 模块 3：服务层实现与 RSC 读取查询 (Services & Queries)

在遵循 **Feature-based Vertical Slice Architecture** 的业务切片中，业务服务与查询就近内聚在各 Feature / Sub-Feature 内部，直接消费横向平台模块 `@chenrun/db-tenant` 导出的全局单例 `TenantPrismaClient`。

---

## 目录结构规范

```bash
packages/features/<business-area>/src/
├── features/
│   └── <feature>/
│       ├── service.ts         # 纯业务领域逻辑与数据库事务 (包内私有实现)
│       ├── queries.ts         # RSC 服务端只读查询 (标明 import "server-only")
│       └── public.server.ts   # 纯服务端公开导出入口
├── shared/
│   └── server/
│       └── tenant-context.ts  # 纯底层租户会话解析与员工准入门禁 (向下依赖平台包)
└── assembly/
    └── context.ts             # 业务区域级 CASL Ability 编译与运行时装配
```

---

## 1. 租户上下文解析 (`shared/server/tenant-context.ts`)

业务包基础共享层直接通过 `@chenrun/auth` 与 `@chenrun/db-tenant` 获取安全路由后的 `TenantPrismaClient`，严格遵守单向依赖：

```ts
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime, assertTenantAccessGate } from "@chenrun/auth";
import { getTenantDbManager, type TenantPrismaClient } from "@chenrun/db-tenant";

export interface TenantContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly client: TenantPrismaClient;
}

export async function getTenantContext(): Promise<TenantContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });

  // 1. 员工在职状态与租户门禁强校验 (Fail-Closed)
  const client = await manager.getClient(tenantCtx.organizationId);
  const employeeProfile = await client.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    select: { id: true, status: true },
  });
  assertTenantAccessGate(employeeProfile);

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    client,
  };
}
```

---

## 2. 领域服务编写核心原则

1. **单调自增防并发重号**：编码必须遵循 `PREFIX-YYYYMMDD-XXXX` 格式；
2. **级联状态机联动**：如“停用客户时强制同步停用其名下所有关联门店”；
3. **物理删除防护**：已有下级记录或业务单据的数据，禁止物理删除，引导用户进行“停用”操作并抛出清晰友好的业务异常；
4. **包内私有实现**：`service.ts` 是当前 Feature 内部的实现细节，绝不向外部应用（`apps/tenant`）直接公开，外部只调用 `queries.ts`（读）或 `actions.ts`（写）。

```ts
import type { TenantPrismaClient } from "@chenrun/db-tenant";

export class CustomerService {
  /**
   * 删除客户业务保护规则
   */
  static async deleteCustomer(client: TenantPrismaClient, customerCode: string) {
    const storeCount = await client.customerStore.count({
      where: { customerCode },
    });
    if (storeCount > 0) {
      throw new Error(`该客户下存在 ${storeCount} 家关联门店，禁止删除，请进行“停用”操作`);
    }

    return client.customer.delete({
      where: { customerCode },
    });
  }
}
```

---

## 3. RSC 服务端只读查询 (`queries.ts`)

为了消灭“服务端页面加载绕调 Server Action”的反模式，所有 RSC 数据获取统一编写独立的 `queries.ts`，首行必须引入 `import "server-only"`：

```ts
import "server-only";
import { toPlainData } from "@chenrun/shared";
import { pickReadableFields } from "@chenrun/authorization";
import { getTenantCustomerContext, assertCustomerAbility } from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type { CustomerListItem, ListCustomerFilter } from "./types";

export async function listCustomersQuery(filter: ListCustomerFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerSubject);

  const result = await CustomerService.listCustomers(client, filter);

  // 物理级字段脱敏与行标识安全性保护
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
