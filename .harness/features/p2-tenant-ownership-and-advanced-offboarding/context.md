# 特性背景：【P2】租户所有权移交与复杂离职批量单据交接 (p2-tenant-ownership-and-advanced-offboarding)

## 一、 目标与背景

依据《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 49-51、55-56、71 节规范：
在第三梯队落地高风险的租户所有权安全移交（Owner Transfer）以及员工离职（TERMINATED）时的复杂业务单据批量责任人交接流。

必须严格贯彻以下两大约束：

1. **系统任何时候有且仅有 Primary Owner**：
   Owner 移交必须由当前 Owner 发起，经密码/二次认证，先将目标 Member 提升为 Owner，确认成功后再将原 Owner 降级为 Admin，宁愿短暂存在两个 Owner，绝不允许出现 0 个 Owner。
2. **离职单据责任人交接归档**：
   员工离职时，系统检测该员工名下创建或待其审核的所有采购订单，支持一键批量过户至接管人（handoverEmployeeId），生成交接流水归档，绝不破坏历史数据。

## 二、 详细设计规格 (Specification)

### 1. `TenantOwnershipService` 领域服务规格 (`packages/features/tenant-admin`)

```ts
export class TenantOwnershipService {
  /**
   * 租户所有权移交：密码二次认证 -> 提升新 Owner -> 降级原 Owner
   */
  async transferOwnership(
    controlPrisma: ControlPrismaClient,
    organizationId: string,
    currentOwnerUserId: string,
    targetMemberId: string,
    passwordProof: string
  ): Promise<void>;
}
```

### 2. 离职单据批量交接 (`EmployeeOffboardingService` 扩展)

```ts
export class EmployeeOffboardingService {
  /** 离职交接办理：批量转移未完结单据并归档档案 */
  async completeOffboardingHandover(
    tenantPrisma: TenantPrismaClient,
    employeeId: string,
    handoverEmployeeId: string
  ): Promise<{ transferredOrdersCount: number }>;
}
```

## 三、 验收标准 (DoD)

- Owner 移交严格保证唯一 Owner 不变量。
- 离职批量单据责任人平稳交接，历史业务数据完好无损。
