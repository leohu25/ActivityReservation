# SaaS Foundation 权限基础设施工程实施规格

> 目标：本文档用于直接指导 AI / Coding Agent 搭建 SaaS Foundation 的认证、租户、角色、权限、部门、数据隔离与授权基础设施。

---

# 1. 最终技术选型

采用：

```text
Next.js
Prisma
PostgreSQL

Better Auth
├── User
├── Account
├── Session
├── Organization = Tenant
├── Member
├── Invitation
└── Dynamic Role

CASL
├── Subject
├── Action
├── Conditions
└── Fields

@casl/react
└── 前端权限

@casl/prisma
└── 数据权限

Database-per-Tenant
└── 租户物理隔离
```

CASL 本身就是用于将权限规则应用到 UI、API 和数据库查询的授权库；Better Auth Organization 则负责成员、角色和组织级访问控制。

---

# 2. 最核心的架构原则

系统必须只有一套权限事实：

```text
Permission Registry
        │
        ↓
Better Auth Role
        │
        ├── 功能权限
        │   Order: read/update
        │
        ↓
Fine-grained Policy
        │
        ├── Scope
        └── Fields
        │
        ↓
Authorization Context
        │
        ↓
Policy Compiler
        │
        ↓
CASL Ability
   ┌────┼────┐
   ↓    ↓    ↓
 React API Prisma
```

禁止分别建立：

```text
❌ 页面权限
❌ 菜单权限
❌ 按钮权限
❌ API 权限
❌ Prisma 权限

五套相互独立的系统
```

页面、菜单、按钮、API、数据库都只是同一套权限的消费者。

---

# 3. 两类数据库

采用：

```text
Control DB
平台控制数据库

Tenant DB
租户业务数据库
```

结构：

```text
                  Control DB
┌─────────────────────────────────┐
│ Better Auth                     │
│                                 │
│ user                            │
│ account                         │
│ session                         │
│ verification                    │
│ organization                    │
│ member                          │
│ invitation                      │
│ organizationRole                │
│                                 │
│ tenantDatabase                  │
│ organizationRolePolicy          │
│ authorizationState              │
└────────────────┬────────────────┘
                 │
           Tenant Resolver
                 │
       ┌─────────┴─────────┐
       ↓                   ↓
  Tenant A DB          Tenant B DB
       │                   │
 department            department
 employeeProfile       employeeProfile
 customer              customer
 order                 order
 product               product
 inventory             inventory
 ...
```

---

# 4. Control DB 职责

Control DB 只保存平台必须知道的信息：

```text
身份
认证
Session
Tenant
Membership
Role
权限配置
Tenant 数据库路由
```

不保存：

```text
订单
库存
客户
部门
商品
供应商
发票
```

这些进入 Tenant DB。

---

# 5. Better Auth Schema

Better Auth 当前核心 Schema 包含：

```text
user
session
account
verification
```

Organization 插件增加：

```text
organization
member
invitation
```

启用 Dynamic Access Control 后增加：

```text
organizationRole
```

Better Auth 当前官方 Organization 插件明确支持动态角色，而且动态角色保存在 `organizationRole` 表；`member` 也支持多个角色。

---

# 6. 不要手写 Better Auth 核心表

AI 实现时：

> 不要根据本文档重新手工仿造 Better Auth Schema。

应：

1. 安装并锁定 Better Auth 版本。
2. 配置 Prisma Adapter。
3. 开启 Organization Plugin。
4. 开启 Dynamic Access Control。
5. 使用与当前安装版本匹配的 Better Auth CLI 生成 Prisma Schema。
6. 再在生成结果基础上增加本系统扩展表。

Better Auth 官方支持通过 CLI 为 Prisma 生成对应 Schema。

---

# 7. Better Auth 配置目标

伪代码：

```ts
const ac = createAccessControl(permissionStatement)

export const auth = betterAuth({
  database: prismaAdapter(controlPrisma),

  plugins: [
    organization({
      ac,

      dynamicAccessControl: {
        enabled: true,
      },
    }),
  ],
})
```

Dynamic Access Control 必须预先提供 `ac`，因为 Better Auth 需要知道系统允许哪些 Resource / Action。

---

# 8. Permission Registry

Permission Registry 是：

> 系统支持哪些业务权限的唯一代码级声明来源。

例如：

```ts
export const orderPermission = definePermissionResource({
  resource: "order",
  subject: "Order",
  label: "订单管理",

  actions: {
    read: {
      label: "查看订单",

      scopes: [
        "self",
        "department",
        "department_and_children",
        "tenant",
      ],

      fields: [
        "id",
        "orderNo",
        "customerId",
        "amount",
        "status",
        "remark",
        "ownerMemberId",
        "departmentId",
        "createdAt",
      ],
    },

    create: {
      label: "新增订单",

      fields: [
        "customerId",
        "amount",
        "remark",
      ],
    },

    update: {
      label: "修改订单",

      scopes: [
        "self",
        "department",
        "department_and_children",
        "tenant",
      ],

      fields: [
        "amount",
        "status",
        "remark",
      ],
    },

    delete: {
      label: "删除订单",

      scopes: [
        "self",
        "department",
        "tenant",
      ],
    },

    export: {
      label: "导出订单",

      scopes: [
        "self",
        "department",
        "department_and_children",
        "tenant",
      ],

      fields: [
        "orderNo",
        "customerId",
        "amount",
        "status",
        "createdAt",
      ],
    },
  },
})
```

---

# 9. Registry 与 Better Auth AC 的关系

Permission Registry：

```text
Order
├── read
├── create
├── update
├── delete
└── export
```

转换成 Better Auth Statement：

```ts
const statement = {
  order: [
    "read",
    "create",
    "update",
    "delete",
    "export",
  ],

  customer: [
    "read",
    "create",
    "update",
    "delete",
    "export",
  ],
} as const
```

然后：

```ts
const ac = createAccessControl(statement)
```

Better Auth 自身也是通过：

```text
Resource → Action[]
```

定义权限 Statement。

---

# 10. Better Auth Role 负责什么

Better Auth Role 只回答：

> 这个角色有没有执行这个 Action 的资格？

例如：

```text
角色：sales_manager

Order
├── read     ✓
├── create   ✓
├── update   ✓
├── delete   ✗
└── export   ✓
```

它不需要知道：

```text
只能本部门
只能本人
可以修改 status
不能修改 amount
```

这些属于 Fine-grained Policy。

---

# 11. 不重复创建 Role 表

禁止：

```text
Better Auth organizationRole

+

我们自己 role

+

我们自己 role_permission
```

形成两套 Role。

最终确定：

```text
Better Auth organizationRole
=
Role 生命周期唯一来源
```

角色的：

```text
创建
修改
删除
成员分配
基础 Action Permission
```

统一走 Better Auth。

---

# 12. 为什么还需要一张扩展策略表

Better Auth 的 Resource + Action 非常适合表达：

```text
order.read
order.update
order.delete
```

但我们的 SaaS 还需要：

```text
read order
但是只能本部门

update order
但是只能修改 status、remark
```

因此增加：

```text
organizationRolePolicy
```

只负责：

```text
Scope
Fields
Field Policy
```

而不重新定义 Role。

---

# 13. Control DB 扩展表

建议增加：

```prisma
model TenantDatabase {
  id               String   @id
  organizationId   String   @unique

  databaseKey      String   @unique
  connectionRef    String

  status           String
  schemaVersion    Int      @default(1)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

注意：

```text
connectionRef
```

推荐指向 Secret Manager / 加密连接配置。

生产环境不要明文存：

```text
postgresql://user:password@...
```

---

# 14. 细粒度 Role Policy

建议：

```prisma
model OrganizationRolePolicy {
  id               String   @id

  organizationId   String
  role              String

  subject           String
  action            String

  scope             String?

  fields            Json?
  fieldPolicy       Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([
    organizationId,
    role,
    subject,
    action
  ])

  @@index([
    organizationId,
    role
  ])
}
```

例如：

```text
organizationId = tenant_001

role    = sales_manager
subject = Order
action  = read
scope   = department
fields  = ["*"]
```

另外一条：

```text
role    = sales_manager
subject = Order
action  = update
scope   = department

fields = [
  "status",
  "remark"
]
```

---

# 15. 为什么 Role Policy 不能存任意 CASL JSON

禁止租户管理员直接保存：

```json
{
  "conditions": {
    "$or": [
      ...
    ]
  }
}
```

否则数据库会变成 CASL DSL 存储器。

风险：

```text
业务字段泄漏
无效字段
无效 Operator
框架升级绑定
恶意 Condition
规则难以迁移
AI 随意创造权限
```

数据库只允许：

```text
Subject
Action
Scope
Fields
FieldPolicy
```

其中所有值必须经过 Permission Registry 校验。

---

# 16. Authorization Version

增加：

```prisma
model AuthorizationState {
  organizationId String   @id
  version        Int      @default(1)
  updatedAt      DateTime @updatedAt
}
```

任何：

```text
角色权限修改
成员角色修改
Scope 修改
Fields 修改
```

完成后：

```text
version += 1
```

---

# 17. 权限缓存

缓存 Key：

```text
authz:
{organizationId}:
{memberId}:
{authorizationVersion}
```

例如：

```text
authz:T001:M1001:27
```

权限修改后：

```text
version 27
→
version 28
```

旧 Cache 自动失效。

---

# 18. Tenant DB 基础 Schema

Tenant DB 至少建立：

```text
department
position
employeeProfile
```

然后由业务 Feature 增加：

```text
order
customer
product
inventory
...
```

---

# 19. Department

建议：

```prisma
model Department {
  id              String   @id

  parentId        String?
  parent          Department?
                   @relation(
                     "DepartmentTree",
                     fields: [parentId],
                     references: [id]
                   )

  children        Department[]
                   @relation("DepartmentTree")

  name            String
  code            String   @unique

  leaderMemberId  String?

  sort            Int      @default(0)
  status          String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

注意：

```text
leaderMemberId
```

只是 Control DB `member.id` 的逻辑引用。

因为跨 PostgreSQL Database：

```text
不能建立普通 FK
```

---

# 20. Employee Profile

```prisma
model EmployeeProfile {
  id             String   @id

  memberId       String   @unique

  employeeNo     String?  @unique

  departmentId   String?
  department     Department?
                 @relation(
                   fields: [departmentId],
                   references: [id]
                 )

  positionId     String?

  jobTitle       String?
  managerMemberId String?

  status         String

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

这里：

```text
memberId
```

连接：

```text
Control DB Member
        ↓
Tenant DB EmployeeProfile
```

---

# 21. Position

```prisma
model Position {
  id          String   @id

  name        String
  code        String   @unique

  description String?
  sort        Int      @default(0)
  status      String

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 22. 业务数据应该使用 Member ID

例如 Order：

```prisma
model Order {
  id                String   @id
  orderNo           String   @unique

  customerId        String

  amount            Decimal
  status            String
  remark            String?

  ownerMemberId     String
  departmentId      String

  createdByMemberId String

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

注意这里推荐：

```text
ownerMemberId
```

而不是：

```text
ownerUserId
```

原因：

> 业务数据属于 Tenant Membership，不属于全局 User。

同一个 User 在不同 Tenant 中是不同 Member。

---

# 23. Authorization Context

所有权限计算统一依赖：

```ts
interface AuthorizationContext {
  userId: string

  organizationId: string
  memberId: string

  roles: string[]

  departmentId: string | null

  authorizationVersion: number
}
```

必要时增加：

```ts
interface AuthorizationContext {
  ...

  departmentIdsWithChildren?: string[]

  platformRoles?: string[]
}
```

---

# 24. 构建 Context 的完整流程

```text
Request
  ↓
Better Auth Session
  ↓
User
  ↓
activeOrganizationId
  ↓
Member
  ↓
roles[]
  ↓
Tenant Resolver
  ↓
Tenant DB
  ↓
EmployeeProfile
  ↓
departmentId
  ↓
AuthorizationState
  ↓
AuthorizationContext
```

伪代码：

```ts
async function getAuthorizationContext(
  request: Request,
): Promise<AuthorizationContext> {

  const session = await getBetterAuthSession(request)

  if (!session) {
    throw Unauthorized()
  }

  const organizationId =
    session.session.activeOrganizationId

  if (!organizationId) {
    throw TenantNotSelected()
  }

  const member =
    await getActiveMember(
      session.user.id,
      organizationId,
    )

  if (!member) {
    throw Forbidden()
  }

  const tenantDb =
    await tenantDatabaseManager.get(
      organizationId,
    )

  const employee =
    await tenantDb.employeeProfile.findUnique({
      where: {
        memberId: member.id,
      },
    })

  const state =
    await getAuthorizationState(
      organizationId,
    )

  return {
    userId: session.user.id,

    organizationId,
    memberId: member.id,

    roles: parseRoles(member.role),

    departmentId:
      employee?.departmentId ?? null,

    authorizationVersion:
      state.version,
  }
}
```

---

# 25. 多角色处理

Better Auth Organization 当前支持一个 Member 拥有多个 Role。

因此：

```text
张三

sales
+
inventory_manager
```

最终权限：

```text
Role A 权限
UNION
Role B 权限
```

V1 采用：

> Deny by Default + Allow Only

即：

```text
默认没有权限

Role 只能增加 can
不支持显式 cannot
```

这样多角色合并规则非常清晰。

不要 V1 就加入：

```text
Role A allow
Role B deny
优先级
继承覆盖
```

否则角色模型会迅速复杂化。

---

# 26. Scope Registry

统一基础 Scope：

```ts
type DataScope =
  | "self"
  | "department"
  | "department_and_children"
  | "tenant"
```

另外允许 Feature 注册：

```text
managed_warehouse
assigned_project
owned_customer
region
```

但这些必须：

```text
提前注册
```

不能让管理员自由输入。

---

# 27. Scope 不能使用统一字段硬编码

不能写一个全局规则：

```ts
self =>
  ownerMemberId = memberId
```

因为不同 Subject 的数据归属字段可能不同。

例如：

```text
Order
→ ownerMemberId

Customer
→ salesMemberId

Project
→ managerMemberId

Warehouse
→ managerMemberIds
```

因此 Scope Resolver 应由 Feature 注册。

---

# 28. Order Scope Resolver

例如：

```ts
const orderScopes = {

  self: async (ctx) => ({
    ownerMemberId: {
      equals: ctx.memberId,
    },
  }),

  department: async (ctx) => ({
    departmentId: {
      equals: ctx.departmentId,
    },
  }),

  department_and_children:
    async (ctx, tenantDb) => {

      const departmentIds =
        await findDepartmentTreeIds(
          tenantDb,
          ctx.departmentId,
        )

      return {
        departmentId: {
          in: departmentIds,
        },
      }
    },

  tenant: async () => ({
    // 当前已经位于 Tenant DB
    // 不再添加 tenantId
  }),
}
```

---

# 29. Permission Compiler

角色：

```text
sales_manager
```

Better Auth 告诉系统：

```text
Order:
read
update
export
```

Role Policy 告诉：

```text
read:
scope = department

update:
scope = department
fields = status,remark

export:
scope = department
fields = orderNo,amount,status
```

Policy Compiler 最终生成 CASL Rules。

---

# 30. Ability Builder

伪代码：

```ts
async function buildAbility(
  context: AuthorizationContext,
) {
  const roleGrants =
    await loadBetterAuthRolePermissions(
      context.organizationId,
      context.roles,
    )

  const policies =
    await loadRolePolicies(
      context.organizationId,
      context.roles,
    )

  const rules = []

  for (const grant of roleGrants) {

    const registry =
      permissionRegistry.get(
        grant.subject,
        grant.action,
      )

    if (!registry) {
      continue
    }

    const policy =
      findPolicy(
        policies,
        grant,
      )

    if (registry.requiresScope && !policy?.scope) {
      // Fail closed
      continue
    }

    const condition =
      await scopeCompiler.compile({
        subject: grant.subject,
        scope: policy?.scope,
        context,
      })

    const fields =
      validateFieldsAgainstRegistry(
        grant.subject,
        grant.action,
        policy?.fields,
      )

    rules.push({
      action: grant.action,
      subject: grant.subject,
      conditions: condition,
      fields,
    })
  }

  return createAppAbility(rules)
}
```

---

# 31. Fail Closed 原则

任何异常都应该：

```text
拒绝
```

而不是自动放宽。

例如：

```text
Role 有 order.read

但要求 Scope，
Policy 没有 Scope
```

结果：

```text
❌ 不允许 read
```

不能解释成：

```text
✅ read tenant 全部订单
```

---

# 32. Tenant Resolver

定义：

```ts
interface TenantDatabaseManager {
  get(
    organizationId: string
  ): Promise<TenantPrismaClient>
}
```

伪代码：

```ts
async function get(
  organizationId: string,
) {
  const metadata =
    await controlDb.tenantDatabase.findUnique({
      where: {
        organizationId,
      },
    })

  if (!metadata) {
    throw TenantDatabaseNotFound()
  }

  return clientPool.getOrCreate(
    metadata.connectionRef,
  )
}
```

---

# 33. Tenant Prisma Client 不能每次请求重新 new

禁止：

```ts
request
  ↓
new PrismaClient()
  ↓
request 完成
  ↓
disconnect()
```

这会导致连接池爆炸。

必须建立：

```text
Tenant Database Client Manager
```

负责：

```text
缓存
连接复用
最大连接数
Idle Eviction
健康检查
LRU
```

例如：

```text
Tenant A → PrismaClient A
Tenant B → PrismaClient B
Tenant C → PrismaClient C
```

---

# 34. Database-per-Tenant Migration

所有 Tenant DB 必须维护：

```text
schemaVersion
```

平台发布 Migration：

```text
V27
```

流程：

```text
Migration Registry
       ↓
列出租户
       ↓
Tenant A migrate
Tenant B migrate
Tenant C migrate
       ↓
记录 schemaVersion = 27
```

禁止：

```text
只修改 Prisma Schema
然后假设所有 Tenant DB 自动变化
```

---

# 35. 创建 Tenant 的流程

新建 Organization：

```text
创建 Organization
      ↓
Better Auth 创建 Owner Member
      ↓
创建 Tenant Database
      ↓
运行 Tenant DB Migration
      ↓
创建 TenantDatabase metadata
      ↓
创建默认 Department
      ↓
创建 EmployeeProfile
      ↓
Seed 默认 Role Policy
      ↓
AuthorizationState = 1
      ↓
Tenant Ready
```

建议实现：

```ts
TenantProvisioningService
```

统一完成。

---

# 36. 删除 Tenant

不要：

```text
点击删除
→ DROP DATABASE
```

建议：

```text
ACTIVE
  ↓
SUSPENDED
  ↓
PENDING_DELETE
  ↓
Retention Period
  ↓
DELETED
```

Tenant Database 生命周期必须由：

```text
TenantLifecycleService
```

管理。

---

# 37. 角色权限后台

后台结构：

```text
系统管理
├── 用户管理
├── 部门管理
├── 岗位管理
├── 角色管理
└── 权限配置
```

角色：

```text
销售经理
```

配置：

```text
订单管理

☑ 查看
  数据范围：
  ○ 本人
  ● 本部门
  ○ 本部门及下级
  ○ 全部

☑ 新增

☑ 修改
  数据范围：
  ● 本部门

  字段：
  ☑ 状态
  ☑ 备注
  ☐ 金额

☐ 删除

☑ 导出
```

---

# 38. 字段权限矩阵

例如 Customer：

| 字段 | 查看 | 新增 | 修改 | 导出 |
|---|---:|---:|---:|---:|
| 姓名 | ✓ | ✓ | ✗ | ✓ |
| 手机号 | ✓ | ✓ | ✓ | ✗ |
| 地址 | ✓ | ✓ | ✓ | ✓ |
| 客户等级 | ✓ | ✗ | ✗ | ✓ |
| 信用额度 | ✗ | ✗ | ✗ | ✗ |

---

# 39. Field 状态推导

统一规则：

```text
没有 read
→ Hidden

有 read
没有 update
→ Readonly

有 read
有 update
→ Editable
```

创建页面：

```text
create Fields
```

单独计算。

因此：

```text
Create Editable
!=
Update Editable
```

---

# 40. Field Policy / Mask

额外支持：

```text
phone
idCard
bankAccount
成本价
利润
```

例如：

```json
{
  "phone": {
    "mask": "phone"
  }
}
```

规则：

```text
无 read
→ 不返回

read + mask
→ 138****5678

read
→ 13812345678
```

重要：

> Mask 必须在服务端执行。

不能：

```text
API 返回完整手机号
↓
前端自己打 ****
```

否则数据实际上已经泄漏。

---

# 41. 字段白名单

所有字段必须来源于 Registry。

例如：

```ts
fields: [
  "name",
  "phone",
  "address",
]
```

数据库出现：

```text
passwordHash
internalCost
secretToken
```

如果没有注册：

```text
永远不能通过权限后台开放
```

---

# 42. Create 权限

Create 和 Read 不一样。

不存在已有数据给 `accessibleBy()` 过滤。

因此：

```text
请求创建 Order
       ↓
检查 can(create, Order)
       ↓
过滤 create Fields
       ↓
服务端注入安全字段
       ↓
创建
```

例如下面这些禁止相信客户端：

```text
ownerMemberId
departmentId
createdByMemberId
tenantId
```

服务端必须自己设置：

```ts
const data = {
  ...allowedClientInput,

  ownerMemberId:
    context.memberId,

  departmentId:
    context.departmentId,

  createdByMemberId:
    context.memberId,
}
```

---

# 43. Update 权限

Update 必须同时控制：

```text
能修改哪一条数据
+
能修改哪些字段
```

伪代码：

```ts
const ability =
  await getAbility()

const allowedFields =
  getPermittedFields(
    ability,
    "update",
    "Order",
  )

const safeInput =
  pick(input, allowedFields)

const where =
  accessibleBy(
    ability,
    "update",
  ).Order

const result =
  await prisma.order.updateMany({
    where: {
      AND: [
        { id: orderId },
        where,
      ],
    },

    data: safeInput,
  })

if (result.count !== 1) {
  throw ForbiddenOrNotFound()
}
```

CASL 的 `accessibleBy` 用于把 Ability 转换成 Prisma 查询约束。

---

# 44. Read List

```ts
const ability =
  await getAbility()

assertCan(
  ability,
  "read",
  "Order",
)

const authWhere =
  accessibleBy(ability).Order

return prisma.order.findMany({
  where: {
    AND: [
      authWhere,
      businessFilters,
    ],
  },
})
```

注意：

```text
businessFilters
```

和：

```text
authorizationFilters
```

必须同时存在。

---

# 45. Read One

推荐：

```ts
const order =
  await prisma.order.findFirst({
    where: {
      AND: [
        {
          id: orderId,
        },

        accessibleBy(
          ability,
        ).Order,
      ],
    },
  })
```

找不到时：

```text
404
```

或者根据项目安全规范统一为：

```text
Forbidden / Not Found
```

避免资源枚举。

---

# 46. Delete

使用相同原则：

```ts
const result =
  await prisma.order.deleteMany({
    where: {
      AND: [
        {
          id: orderId,
        },

        accessibleBy(
          ability,
          "delete",
        ).Order,
      ],
    },
  })

if (result.count !== 1) {
  throw ForbiddenOrNotFound()
}
```

---

# 47. permittedFieldsOf

CASL 提供 `permittedFieldsOf()` 来计算某个 Action 允许的字段。

当前 CASL 7 的 API 要求显式提供 `fieldsFrom`，以说明没有声明 `fields` 时应该视为什么字段集合。

因此必须封装：

```ts
function getPermittedFields(
  ability,
  action,
  subject,
) {
  const allFields =
    permissionRegistry
      .getAllFields(subject)

  return permittedFieldsOf(
    ability,
    action,
    subject,
    {
      fieldsFrom:
        rule =>
          rule.fields ??
          allFields,
    },
  )
}
```

禁止 Feature 自己到处直接调用不同版本。

---

# 48. 字段条件复杂度限制

V1 建议：

> Fields 可以随 Role / Action 变化，但不要随每一条 Record 动态变化。

也就是说允许：

```text
sales_manager

update Order
fields = status,remark
```

暂不鼓励：

```text
如果 status = DRAFT
能修改 amount

如果 status = APPROVED
不能修改 amount
```

这种规则属于业务状态机：

```text
Domain Policy
```

不应全部塞进角色权限系统。

CASL 作者也提醒过，字段级权限过度复杂往往意味着领域模型本身需要拆分。

---

# 49. 前端 Ability

前端不要自己：

```text
查 Role
↓
猜权限
```

服务端提供：

```text
GET /api/me/authorization
```

返回当前 Tenant 下经过编译、可安全暴露给客户端的 Ability Rules。

例如：

```json
{
  "version": 27,

  "rules": [
    {
      "action": "read",
      "subject": "Order"
    },

    {
      "action": "update",
      "subject": "Order",
      "fields": [
        "status",
        "remark"
      ]
    }
  ]
}
```

前端建立 CASL Ability。

---

# 50. 前端只是 UX

前端：

```text
显示/隐藏菜单
显示/隐藏按钮
Readonly
Editable
```

不是安全边界。

用户即使修改：

```text
JavaScript
DevTools
React State
```

服务端仍然必须重新授权。

---

# 51. Menu

菜单配置：

```ts
{
  title: "订单管理",
  href: "/orders",

  ability: {
    action: "read",
    subject: "Order",
  },
}
```

显示：

```ts
ability.can(
  "read",
  "Order",
)
```

不要：

```text
menu.order.view
```

---

# 52. Route

Route Metadata：

```ts
{
  path: "/orders",

  ability: {
    action: "read",
    subject: "Order",
  },
}
```

不要：

```text
page.orders = true
```

---

# 53. Button

新增：

```tsx
<Can
  I="create"
  a="Order"
>
  <CreateButton />
</Can>
```

删除：

```tsx
<Can
  I="delete"
  this={order}
>
  <DeleteButton />
</Can>
```

---

# 54. Field

统一封装：

```tsx
<AuthorizedField
  subject="Customer"
  field="phone"
  value={customer.phone}
/>
```

内部：

```text
can(read)
?
    can(update)
    ? Editable
    : Readonly
:
    Hidden
```

不要每个 Feature 自己实现一遍。

---

# 55. Server Authorization Decorator / Guard

建议 Foundation 提供统一抽象：

```ts
@Authorize({
  action: "update",
  subject: "Order",
})
async updateOrder() {}
```

或者函数式：

```ts
await authorize({
  action: "update",
  subject: "Order",
  resource: order,
})
```

如果项目采用 Decorator-first：

> 服务端横切授权能力优先 Decorator / Guard。

但 Repository 数据过滤仍然必须使用 `accessibleBy()` 或统一 Query Policy。

---

# 56. 不能只靠 Decorator

例如：

```ts
@Authorize({
  action: "read",
  subject: "Order",
})
```

只能证明：

```text
有资格读取 Order
```

不能自动证明：

```text
可以读取所有 Order
```

列表查询仍然必须：

```text
accessibleBy(ability).Order
```

这是非常重要的区别。

---

# 57. Better Auth Permission 与 CASL 的边界

最终严格定义：

## Better Auth

保存：

```text
Role

Order:
read
create
update
export
```

回答：

> 有没有这个 Action。

---

## OrganizationRolePolicy

保存：

```text
read
scope = department

update
scope = department
fields = status,remark
```

回答：

> Action 能作用在哪些数据、哪些字段。

---

## CASL

编译：

```text
Better Auth Grant
+
Fine-grained Policy
+
Authorization Context
```

成为最终 Ability。

---

# 58. Role 保存流程

管理员点击保存：

```text
销售经理
```

请求：

```text
RoleAuthorizationService.saveRole()
```

统一完成：

```text
① Registry 校验

② Better Auth
   createRole / updateRole

③ 保存 OrganizationRolePolicy

④ authorizationVersion + 1

⑤ 清除相关缓存
```

禁止前端分别调用：

```text
Better Auth Role API

然后

另一个 Policy API
```

由一个 Application Service 统一协调。

---

# 59. Role 删除

流程：

```text
检查成员是否仍使用 Role
        ↓
禁止 / 或迁移成员
        ↓
Better Auth deleteRole
        ↓
删除 Role Policy
        ↓
authorizationVersion + 1
```

---

# 60. Role Rename

由于细粒度策略使用：

```text
organizationId + role
```

Role 重命名必须经过统一 Service。

禁止直接：

```text
UPDATE organizationRole
```

而不迁移对应 Policy。

---

# 61. 默认角色

建议保留：

```text
owner
admin
member
```

同时支持动态角色：

```text
sales
sales_manager
finance
warehouse_manager
...
```

Better Auth Organization 默认就具有 `owner / admin / member` 角色，并允许自定义及动态角色。

应用业务权限建议：

```text
owner
→ Registry 中全部业务权限

admin
→ 默认全部业务管理权限，可按产品策略调整

member
→ 默认最小权限
```

创建 Tenant 时 Seed 默认 Policy。

---

# 62. Better Auth 内置组织管理权限不要丢

Better Auth 本身还控制：

```text
organization.update
organization.delete

member.create
member.update
member.delete

invitation.create
invitation.cancel
```

这些属于：

```text
Tenant Administration
```

不要全部重新用 CASL 实现。

CASL 主要负责：

```text
应用业务资源授权
```

这样边界清晰。

Better Auth 官方 Organization AC 本身已经定义了 organization、member、invitation 等管理资源。

---

# 63. Department 与 Role 没有直接绑定关系

不要设计：

```text
Department
→ Role
```

正确：

```text
Member
├── roles[]
└── EmployeeProfile
      ↓
  Department
```

Role 决定：

```text
能干什么
```

Department 决定：

```text
数据范围中的“本部门”到底是谁
```

---

# 64. 用户换部门

例如：

```text
张三

销售一部
↓
销售二部
```

只需要：

```text
employeeProfile.departmentId
```

发生变化。

Role 可以不变。

CASL 下一次构建：

```text
department = 销售二部
```

自动得到新的部门权限范围。

同时：

```text
authorizationVersion + 1
```

或使 Member Cache 失效。

---

# 65. 数据归属不能完全依赖“用户当前部门”

例如一张历史订单：

```text
订单创建时
departmentId = D001
```

张三后来调到：

```text
D002
```

订单是否跟着移动？

这属于业务规则。

因此 Order 必须明确保存：

```text
departmentId
```

不能运行时只根据：

```text
owner 当前 department
```

反推历史订单归属。

---

# 66. Field Policy 与 Domain Rule 分离

权限系统负责：

```text
有没有资格修改 status
```

Domain 层负责：

```text
PAID 状态不能重新修改 amount

CANCELLED 订单不能审批

APPROVED 发票不能删除
```

不要把业务状态规则全部做成 RBAC。

正确：

```text
Authorization
AND
Domain Policy
```

两者都通过才允许操作。

---

# 67. Audit

建议 Foundation 同时预留：

```text
authorization_audit_log
```

记录高风险操作：

```text
谁
哪个 Tenant
哪个 Member
哪个 Role
对哪个 Subject
执行什么 Action
目标资源 ID
结果
时间
```

例如：

```text
M001
T001
sales_manager

Order
delete
ORDER_1001

DENIED
```

---

# 68. 推荐目录结构

```text
src/
├── foundation/
│   │
│   ├── auth/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── better-auth-ac.ts
│   │   └── session.ts
│   │
│   ├── tenancy/
│   │   ├── tenant-context.ts
│   │   ├── tenant-resolver.ts
│   │   ├── tenant-database-manager.ts
│   │   ├── tenant-provisioning.service.ts
│   │   └── tenant-lifecycle.service.ts
│   │
│   └── authorization/
│       ├── permission-registry.ts
│       ├── registry.types.ts
│       ├── authorization-context.ts
│       ├── authorization-context.service.ts
│       ├── role-policy.repository.ts
│       ├── role-authorization.service.ts
│       ├── scope-registry.ts
│       ├── policy-compiler.ts
│       ├── ability.ts
│       ├── ability-cache.ts
│       ├── permitted-fields.ts
│       ├── mask-policy.ts
│       ├── authorize.ts
│       └── authorized-query.ts
│
├── features/
│   │
│   ├── orders/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── ui/
│   │   │
│   │   └── permissions/
│   │       ├── registry.ts
│   │       ├── scopes.ts
│   │       └── fields.ts
│   │
│   ├── customers/
│   │   └── permissions/
│   │
│   └── inventory/
│       └── permissions/
│
└── shared/
```

---

# 69. FDD 原则

每个 Feature 自己拥有：

```text
自己的 Subject
自己的 Action
自己的 Fields
自己的 Scope Resolver
```

例如：

```text
orders/
permissions/

customers/
permissions/

inventory/
permissions/
```

Foundation 不应该知道：

```text
Order 的 ownerMemberId 是什么
Customer 的 salesMemberId 是什么
```

这些属于 Feature。

Foundation 只提供：

```text
注册机制
编译机制
执行机制
```

---

# 70. Harness 强制规则

必须写进项目 Harness：

## H-01

禁止 Feature 自建 Role / Permission 系统。

## H-02

所有业务权限必须注册 Permission Registry。

## H-03

禁止创建独立：

```text
PagePermission
MenuPermission
ButtonPermission
```

## H-04

菜单、页面、按钮必须引用：

```text
Subject + Action
```

## H-05

前端授权只能用于 UX。

服务端必须重新授权。

## H-06

所有租户列表查询必须经过：

```text
AuthorizedQuery
```

最终包含：

```text
accessibleBy()
```

## H-07

写操作必须同时验证：

```text
Row Permission
+
Field Permission
```

## H-08

禁止客户端提交：

```text
ownerMemberId
departmentId
tenantId
createdByMemberId
```

等服务端归属字段并直接写入。

## H-09

禁止管理员编辑任意 CASL Condition JSON。

## H-10

Scope 必须来自 Scope Registry。

## H-11

Fields 必须来自 Permission Registry。

## H-12

角色生命周期必须通过：

```text
RoleAuthorizationService
```

不能直接修改 Better Auth `organizationRole`。

## H-13

Tenant 私有数据必须进入 Tenant DB。

## H-14

身份、Membership、Role 必须进入 Control Plane。

## H-15

跨 Database 的 ID 只能视为逻辑引用，不创建虚假的数据库 FK。

## H-16

所有授权异常默认：

```text
DENY
```

---

# 71. 测试要求

基础设施至少必须覆盖以下自动化测试。

## Authentication

```text
✓ 登录
✓ 退出
✓ Session 过期
✓ 无 Session 拒绝访问
```

## Tenant

```text
✓ User 可以属于多个 Tenant
✓ 切换 activeOrganization
✓ A Tenant 无法读取 B Tenant 数据库
✓ 非 Member 无法进入 Tenant
```

## Role

```text
✓ 创建动态 Role
✓ 修改 Role
✓ 删除 Role
✓ Member 多角色
✓ 多角色权限 UNION
```

## Scope

```text
✓ self
✓ department
✓ department_and_children
✓ tenant
```

## Fields

```text
✓ hidden
✓ readonly
✓ editable
✓ create Fields
✓ update Fields
✓ export Fields
✓ mask
```

## Security

```text
✓ 隐藏按钮后直接调用 API 仍被拒绝

✓ 修改请求加入 unauthorized field
  被服务端过滤 / 拒绝

✓ 修改 URL 访问别人数据
  被 accessibleBy 限制

✓ 客户端伪造 departmentId
  无效

✓ 客户端伪造 ownerMemberId
  无效

✓ 修改角色后旧 Cache 失效
```

---

# 72. 必须重点测试的案例

用户：

```text
张三
```

Tenant：

```text
A 公司
```

Member：

```text
M001
```

Role：

```text
sales_manager
```

Department：

```text
D001
```

权限：

```text
Order.read
scope = department

Order.update
scope = department
fields = status,remark

Order.export
scope = department
fields = orderNo,status
```

应该得到：

```text
D001 订单
→ 可以查看

D002 订单
→ 不可以查看

D001 订单 status
→ 可以修改

D001 订单 remark
→ 可以修改

D001 订单 amount
→ 不可以修改

导出
→ 只有 orderNo + status
```

---

# 73. AI 实施顺序

Coding Agent 必须按照以下顺序实施。

### Phase 1 — Better Auth

完成：

```text
User
Session
Account
Organization
Member
Invitation
Dynamic Role
```

先保证 Authentication + Tenant Membership 正常。

---

### Phase 2 — Database-per-Tenant

完成：

```text
TenantDatabase
TenantResolver
TenantDatabaseManager
TenantProvisioningService
```

验证：

```text
Tenant A
绝对无法访问
Tenant B Database
```

---

### Phase 3 — Tenant Organization

完成：

```text
Department
Position
EmployeeProfile
```

打通：

```text
Member
→ EmployeeProfile
→ Department
```

---

### Phase 4 — Permission Registry

建立：

```text
Subject
Action
Scope
Fields
```

Registry 与 Better Auth AC 联动。

---

### Phase 5 — Role Policy

建立：

```text
OrganizationRolePolicy
AuthorizationState
RoleAuthorizationService
```

---

### Phase 6 — CASL

实现：

```text
AuthorizationContext
ScopeCompiler
PolicyCompiler
AbilityBuilder
AbilityCache
```

---

### Phase 7 — Server

实现：

```text
Authorize Guard
AuthorizedQuery
Field Filter
Mask Policy
```

---

### Phase 8 — React

实现：

```text
AbilityProvider
Can
AuthorizedField
Menu Guard
Route Guard
Button Guard
```

---

### Phase 9 — Role Management UI

根据：

```text
Permission Registry
```

自动生成：

```text
功能权限
数据范围
字段权限
```

后台。

---

### Phase 10 — Tests

完成前述：

```text
Authentication
Tenant Isolation
RBAC
Scope
Fields
Cache
API Bypass
```

全部测试。

---

# 74. AI 不应该做的事情

明确禁止 Coding Agent：

```text
❌ 自己重新实现登录密码校验

❌ 自己重新设计 Session

❌ 自建重复 Role 表

❌ 自建第二套 Permission 表达体系

❌ 用页面 URL 当核心权限

❌ 用按钮 ID 当核心权限

❌ 只在前端检查权限

❌ 业务 Repository 直接裸 findMany()

❌ 把 CASL Condition 任意 JSON 存数据库

❌ 把所有 Tenant 业务数据重新塞回 Control DB

❌ 每个请求创建新的 PrismaClient

❌ 信任客户端 tenantId / departmentId /
   ownerMemberId

❌ 缺权限配置时默认放行
```

---

# 75. 最终完整请求链

```text
HTTP Request
      ↓
Better Auth Session
      ↓
User
      ↓
activeOrganization
      ↓
Member
      ↓
roles[]
      ↓
Tenant Resolver
      ↓
Tenant Database
      ↓
EmployeeProfile
      ↓
Department
      ↓
Better Auth Role Permission
      +
OrganizationRolePolicy
      ↓
AuthorizationContext
      ↓
Policy Compiler
      ↓
CASL Ability
      ↓
┌────────────┬────────────┬────────────┐
↓            ↓            ↓            ↓
Menu        Button       Server       Prisma
Page        Field        Guard        Query
             ↓                         ↓
           UX                      Tenant DB
```

---

# 76. 最终职责定义

## Better Auth

```text
你是谁
你有没有登录
你属于哪个 Tenant
你在 Tenant 是哪个 Member
你拥有哪些 Role
Role 有哪些基础 Action Permission
```

## Permission Registry

```text
系统存在哪些 Subject
支持哪些 Action
支持哪些 Scope
有哪些可授权 Fields
```

## Role Policy

```text
某个 Action
可以作用在哪些数据
可以作用在哪些字段
```

## Authorization Context

```text
当前 User
当前 Tenant
当前 Member
当前 Role
当前 Department
```

## CASL

```text
把身份 + Role + Policy
编译为真正可执行的授权规则
```

## @casl/react

```text
UI 显示 / 隐藏
Readonly / Editable
```

## Server

```text
真正决定操作是否允许
```

## @casl/prisma

```text
真正决定数据库能查询 / 修改哪些记录
```

## Database-per-Tenant

```text
保证 Tenant 之间物理隔离
```

---

# 77. 最终架构原则

整个 Foundation 最终遵循：

> **User 表示“你是谁”；Member 表示“你在这个 Tenant 中是谁”；Role 表示“你具备哪些功能资格”；Scope 表示“你能操作哪些数据”；Fields 表示“你能操作哪些字段”；CASL 将这些信息统一编译为授权规则；Database-per-Tenant 则负责 Tenant 之间的物理数据隔离。**

权限核心模型正式定为：

```text
Subject
+
Action
+
Scope
+
Fields
```

增强：

```text
Field Policy / Mask
```

管理员实际配置：

```text
Action
+
Scope
+
Fields
```

Subject 由系统 Permission Registry 注册。

---

# 78. Definition of Done

只有当以下全部成立时，SaaS Foundation 权限基础设施才算完成：

```text
✓ Better Auth 登录正常

✓ Organization = Tenant

✓ Member 多租户关系正常

✓ Dynamic Role 正常

✓ Database-per-Tenant 正常

✓ Department / EmployeeProfile 正常

✓ Permission Registry 正常

✓ Role 功能权限正常

✓ Scope 数据权限正常

✓ Fields 字段权限正常

✓ Mask 正常

✓ CASL Ability 正常

✓ React 权限正常

✓ API 权限正常

✓ Prisma 数据过滤正常

✓ Role 修改权限即时失效

✓ 前端绕过不能突破 Server

✓ Tenant A 永远不能访问 Tenant B DB

✓ 所有权限路径具有自动化测试
```

达到这里以后，才允许业务 Feature 在此 Foundation 上开始规模化开发。