# 特性背景：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 一、 目标与背景

依据《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 33、74-76 节与《SaaS 租户后台产品结构与组织权限模型定义》第 2-11 节，消除当前代码库中模型严重失真问题（`memberId` 必填强约束、缺失岗位实体、缺失部门字段、缺失企业扩展信息等）。

在租户物理数据库与控制数据库建立符合三层隔离原则（User -> Member -> EmployeeProfile）的真实基础实体：

1. 重构 `EmployeeProfile` 员工档案模型；
2. 新增 `Position` 岗位字典模型（实现 Position != Role 物理正交解耦）；
3. 增强 `Department` 部门拓扑模型（补充负责人、排序、停用状态与删除保护）；
4. 新增 `CompanyProfile` 企业扩展档案模型；
5. 在 Control DB 引入 `authorizationVersion` 权限版本号。

## 二、 实体详细定义 (Schema Specification)

### 1. Tenant DB 重构：EmployeeProfile

```prisma
enum EmployeeStatus {
  ACTIVE      // 在职正常使用业务系统
  SUSPENDED   // 停用：暂停该租户业务访问权限，不影响全平台 User
  TERMINATED  // 离职：撤销租户 Member 访问权，归档档案，保留单据历史
}

model EmployeeProfile {
  id                String         @id @default(cuid())
  memberId          String?        @unique  // 改造为 nullable，支持先建档案直接开号或外部关联
  userId            String?        // 逻辑引用 Control DB User.id
  invitationId      String?        // 预留 nullable 逻辑引用 Control DB Invitation.id
  employeeNo        String?        @unique  // 工号
  departmentId      String?
  positionId        String?
  managerEmployeeId String?        // 直属主管 EmployeeProfile.id (自关联)
  nameSnapshot      String         // 员工姓名快照 (防止 User 变更导致历史单据姓名漂移)
  emailSnapshot     String         // 员工邮箱快照
  jobTitle          String?        // 业务职级/头衔
  status            EmployeeStatus @default(ACTIVE)
  joinedAt          DateTime?      // 入职时间
  terminatedAt      DateTime?      // 离职时间
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  department        Department?     @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  position          Position?       @relation(fields: [positionId], references: [id], onDelete: SetNull)
  manager           EmployeeProfile? @relation("EmployeeManager", fields: [managerEmployeeId], references: [id], onDelete: SetNull)
  subordinates      EmployeeProfile[] @relation("EmployeeManager")

  @@index([departmentId])
  @@index([positionId])
  @@index([managerEmployeeId])
  @@index([memberId])
  @@index([status])
  @@map("employee_profile")
}
```

### 2. Tenant DB 新增：Position（岗位实体）

```prisma
model Position {
  id          String   @id @default(cuid())
  name        String   // 岗位名称 (如: 总经理、采购主管、销售专员)
  code        String   @unique // 岗位编码 (如: pos_purchasing_mgr)
  description String?  // 岗位职责描述
  sort        Int      @default(0) // 排序号
  status      String   @default("ACTIVE") // ACTIVE / INACTIVE
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employees   EmployeeProfile[]

  @@index([status])
  @@map("position")
}
```

### 3. Tenant DB 增强：Department（部门拓扑模型）

```prisma
model Department {
  id              String   @id
  name            String
  code            String   @unique
  parentId        String?
  leaderMemberId  String?  // 部门负责人 Member ID 逻辑引用
  sort            Int      @default(0) // 同级排序号
  status          String   @default("ACTIVE") // ACTIVE / INACTIVE
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  employees       EmployeeProfile[]
  orders          PurchaseOrder[]

  @@index([parentId])
  @@index([status])
  @@map("department")
}
```

### 4. Tenant DB 新增：CompanyProfile（租户企业扩展资料）

```prisma
model CompanyProfile {
  id           String   @id @default(cuid())
  companyName  String   // 企业全称
  shortName    String?  // 企业简称
  creditCode   String?  // 统一社会信用代码
  legalPerson  String?  // 法定代表人
  contactPhone String?  // 联系电话
  contactEmail String?  // 联系邮箱
  address      String?  // 经营地址
  timezone     String   @default("Asia/Shanghai")
  currency     String   @default("CNY")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("company_profile")
}
```

### 5. Control DB 增强：Organization 增加 authorizationVersion

```prisma
model Organization {
  ...
  authorizationVersion Int @default(1) // 权限版本号，当角色变更/部门变更/人员停用时自增
  ...
}
```

## 三、 范围内能力

1. 更新 `packages/db-tenant/prisma/schema.prisma` 与 `packages/db-control/prisma/schema.prisma`。
2. 编写并生成租户物理库 Migration SQL（`tooling/tenant-migrate/migrations/`）。
3. 升级 `TenantMigrationRunner` 与基线 SQL 初始化脚本。
4. 适配现有采购切片与 `resolveEmployeeTopology` 测试，保证旧单测 100% 绿色平稳通过。

## 四、 明确不做

- 不做前端组织管理 UI 界面（交由 `p0-tenant-navigation-and-settings` 与 `p0-tenant-org-management`）。
