# 特性背景：【P1】租户全生命周期管控与排期安全清理 (p1-tenant-lifecycle-governance)

## 一、 目标与背景

依据《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 13、58-60、71 节规范：
在控制总控平台（`apps/control`）实现租户六态生命周期管控（`PROVISIONING` -> `ACTIVE` -> `SUSPENDED` -> `PENDING_DELETE` -> `DELETED`）与安全清理治理。

必须严格贯彻以下安全红线：

1. **R-04 安全红线：租户停用（SUSPENDED）严禁 Ban 全局 User**：
   租户停用仅阻断该租户的物理库业务准入，该用户在其他正常租户中依然可以自由登录和开展业务。全局封禁（User Ban）仅限平台级最高安全事件。
2. **分阶段物理清理（Retention Period & Clean Purge）**：
   租户注销申请或平台删除操作，必须先进入 `PENDING_DELETE` 冷却保留期。保留期过后执行：备份数据库 -> DROP 租户物理库 -> 清理 Control DB 映射与 Membership -> 留存平台审计归档记录。**严禁先删 Control DB Organization 导致遗留孤儿物理库（遵循文档第 60 节）**。

## 二、 详细设计规格 (Specification)

### 1. `TenantLifecycleService` 领域服务规格 (`packages/features/control-admin`)

```ts
export class TenantLifecycleService {
  /** 租户软停用：仅阻断本租户物理库访问，不影响全局 User (R-04) */
  async suspendTenant(organizationId: string, operator: OperatorUser, reason: string): Promise<void>;

  /** 租户恢复正常运营 */
  async resumeTenant(organizationId: string, operator: OperatorUser): Promise<void>;

  /** 排期删除：进入 PENDING_DELETE 冷却保留期 */
  async scheduleDeletion(input: ScheduleDeleteInput, operator: OperatorUser): Promise<void>;

  /** 执行到期租户物理清理：备份 -> Drop Tenant DB -> 清除映射 -> 留存审计账本 */
  async executeTenantPurge(organizationId: string, operator: OperatorUser): Promise<PurgeResult>;
}
```

### 2. 控制平面页面与交互

- 升级 `apps/control` 租户管理面板表格：呈现生命周期状态徽标与操作菜单（挂起服务、恢复运行、排期删除）。

## 三、 验收标准 (DoD)

- 租户生命周期完整流转。
- 租户停用严格不封禁全局 User（R-04）。
- 物理清理严格先销毁物理库再清理 Control 库映射。
