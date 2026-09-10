# 模块 3：领域服务层实现 (Domain Services)

领域服务层负责封装纯粹的业务规则、防腐逻辑、编码生成与级联状态机。服务层直接消费切片专属的 `PrismaClient`。

---

## 目录结构规范

```bash
packages/features/<feature-name>/src/
├── server/
│   └── session.ts             # 租户上下文解析与准入门禁
└── services/
    ├── <domain>.service.ts    # 纯业务领域逻辑
    └── index.ts               # 统一导出
```

---

## 1. 租户上下文与客户端获取 (`src/server/session.ts`)

```ts
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import { getTenantDbManager } from "@chenrun/db-tenant";
import { getCustomerPrismaClient, type CustomerPrismaClient } from "../db/client";

export interface TenantCustomerContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly client: CustomerPrismaClient;
}

export async function getTenantCustomerContext(): Promise<TenantCustomerContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const { getServerAuthRuntime, assertTenantAccessGate } = await import("@chenrun/auth");
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });

  // 1. 员工在职状态与租户门禁强校验 (Fail-Closed)
  const tenantBasePrisma = await manager.getClient(tenantCtx.organizationId);
  const employeeProfile = await tenantBasePrisma.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    select: { id: true, status: true },
  });
  assertTenantAccessGate(employeeProfile);

  // 2. 物理库连接串解析与 Client 路由获取
  const secretResolver = (manager as any).secretResolver;
  const tenantRecord = await runtime.tenantContextRepository.findTenantDatabase(tenantCtx.organizationId);
  if (!tenantRecord) {
    throw new Error(`Tenant database not configured for organization ${tenantCtx.organizationId}`);
  }

  const databaseUrl = await secretResolver.resolveDatabaseUrl(tenantRecord.secretRef);
  const client = getCustomerPrismaClient(databaseUrl);

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
3. **物理删除防护**：已有下级记录或业务订单的数据，禁止物理删除，引导用户进行“停用”操作并抛出清晰友好的业务异常。

```ts
export class CustomerService {
  /**
   * 删除客户业务保护规则
   */
  static async deleteCustomer(client: CustomerPrismaClient, customerCode: string) {
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
