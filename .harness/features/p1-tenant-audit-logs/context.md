# 特性背景：【P1】租户三维审计安全体系 (p1-tenant-audit-logs)

## 一、 目标与背景

依据《SaaS 租户后台产品结构与组织权限模型定义》第 40-44 节以及《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 56、71、74 节规范：
在租户管理后台实现企业合规审计追踪体系，建立操作日志、权限变更日志与登录访问日志三维审计能力。

## 二、 详细设计规格 (Specification)

### 1. 租户物理库审计实体规格 (`packages/db-tenant/prisma/schema.prisma`)

```prisma
model OperationAuditLog {
  id           String   @id @default(cuid())
  operatorId   String   // 操作人 Member ID 逻辑引用
  operatorName String   // 操作人姓名快照
  module       String   // 业务模块 (procurement, organization, settings)
  action       String   // 动作 (create, update, delete, audit, export)
  targetId     String   // 目标业务单据 ID
  clientIp     String?  // 客户端 IP
  details      String?  // JSON 存储的变更摘要或快照
  status       String   @default("SUCCESS")
  createdAt    DateTime @default(now())

  @@index([module, action])
  @@index([operatorId])
  @@index([createdAt])
  @@map("operation_audit_log")
}

model PermissionAuditLog {
  id           String   @id @default(cuid())
  operatorId   String   // 操作人 Member ID 逻辑引用
  operatorName String   // 操作人姓名快照
  actionType   String   // ROLE_CREATED, ROLE_UPDATED, ROLE_DELETED, MEMBER_ROLE_ASSIGNED
  targetRole   String?  // 目标角色代码
  targetMemberId String? // 受影响的 Member ID
  beforeSnapshot String? // 变更前策略快照 (JSON)
  afterSnapshot  String? // 变更后策略快照 (JSON)
  createdAt    DateTime @default(now())

  @@index([actionType])
  @@index([targetMemberId])
  @@index([createdAt])
  @@map("permission_audit_log")
}
```

### 2. 领域服务与界面 (`apps/tenant/src/app/(dashboard)/audit/`)

- `TenantAuditService`：记录流水并支持按模块、操作人、时间段分页检索。
- 落地三大审计页面：
  - `operations/page.tsx`（操作日志）
  - `logins/page.tsx`（登录日志）
  - `permissions/page.tsx`（权限变更日志，带 Diff 抽屉）

## 三、 验收标准 (DoD)

- 单据操作与权限修改自动 Append-only 产生审计日志。
- 支持四层权限 Diff 对比。
