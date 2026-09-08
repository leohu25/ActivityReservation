# SaaS Foundation 权限系统完整设计方案

## 1. 目标

本方案用于构建一套可长期演进的多租户 SaaS 权限基础设施。

核心技术组合：

- Better Auth：Authentication（认证）+ Organization（租户）+ Member（租户成员）+ Role（角色）
- CASL：Authorization（授权）
- `@casl/react`：前端权限消费
- `@casl/prisma`：数据库查询权限
- PostgreSQL Database-per-Tenant：租户数据物理隔离
- Prisma：数据访问
- FDD：Feature Driven Development（特性驱动开发）
- Harness：约束 AI / 团队按照统一权限规范开发

整体目标：

> 身份统一、租户隔离、角色动态配置、页面/按钮/数据/字段统一授权，并保证前端、服务端和数据库使用同一套权限语义。

---

# 2. 核心架构原则

整个权限体系只维护一套授权事实。

禁止：

```text
页面权限一套
按钮权限一套
API 权限一套
数据库权限一套
CASL 又一套
```

统一为：

```text
Permission Registry
        ↓
Role Permission
        ↓
Authorization Context
        ↓
CASL Ability
        ↓
┌─────────────┬─────────────┬─────────────┐
│             │             │             │
React        Route         Server       Prisma
│             │             │             │
页面/按钮      路由访问       API授权       数据范围
```

---

# 3. 三层基础设施

权限基础设施分成三个明确的层次。

```text
┌──────────────────────────────────┐
│ Identity Layer                   │
│ 身份层                           │
│                                  │
│ Better Auth                      │
│                                  │
│ User                             │
│ Session                          │
│ Organization                     │
│ Member                           │
│ Role                             │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│ Authorization Layer              │
│ 授权层                           │
│                                  │
│ CASL                             │
│                                  │
│ Subject                          │
│ Action                           │
│ Scope / Conditions               │
│ Fields                           │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│ Data Isolation Layer             │
│ 数据隔离层                       │
│                                  │
│ PostgreSQL Database-per-Tenant   │
│ Prisma                           │
│ @casl/prisma                     │
└──────────────────────────────────┘
```

三层分别回答：

```text
Better Auth
→ 你是谁？

Organization
→ 你当前在哪个租户？

Member / Role
→ 你在这个租户是什么身份？

CASL
→ 你能做什么？

Scope
→ 你能操作哪些数据？

Fields
→ 你能操作哪些字段？

Database-per-Tenant
→ 你物理上能够连接哪个租户数据库？
```

---

# 4. Better Auth 职责

Better Auth 负责身份认证和 SaaS 租户身份体系。

## 4.1 核心数据

平台控制数据库 Control DB 中维护：

```text
user
session
account
verification
organization
member
invitation
organizationRole
```

其中：

### User

表示全局用户身份。

```text
user
──────────────────
id
name
email
emailVerified
image
...
```

User 不属于某个特定租户。

一个 User 可以加入多个 Tenant。

---

### Account

表示登录方式。

例如：

```text
User 张三

├── credential
├── Google
├── GitHub
└── Microsoft
```

认证相关密码、OAuth 等由 Better Auth 管理。

---

### Session

表示用户当前登录会话。

可以包含：

```text
userId
activeOrganizationId
expiresAt
...
```

---

### Organization

本系统直接定义：

> Organization = Tenant

例如：

```text
Organization
──────────────────
T001 宸润公司
T002 ABC 食品
T003 XYZ 科技
```

---

### Member

表示：

> 某个 User 在某个 Tenant 中的身份。

例如：

```text
member
────────────────────────────────
userId    organizationId    role

U001      T001              owner
U002      T001              admin
U003      T001              sales
U001      T002              member
```

必须牢记：

```text
User != Member
```

User 是全平台身份。

Member 是这个 User 在某个 Tenant 内的身份。

---

# 5. 平台用户和租户用户

所有能够登录 SaaS 的用户统一存在 Control DB。

包括：

```text
平台管理员
租户 Owner
租户 Admin
普通租户成员
```

不要在每个 Tenant DB 中复制一份完整用户账号。

正确模型：

```text
                  Global User
                     U001
                      │
            ┌─────────┴─────────┐
            ↓                   ↓
         Member A            Member B
         Tenant A            Tenant B
         admin               member
```

这样用户只需要登录一次。

---

# 6. 平台权限和租户权限必须分开

平台管理员和租户管理员不是同一种角色。

例如：

```text
Platform Role
────────────────
super_admin
platform_operator
support
```

租户内部：

```text
Organization Role
────────────────
owner
admin
sales_manager
sales
finance
warehouse_manager
```

禁止把两者放进同一套 Role。

---

# 7. Control DB 与 Tenant DB

本系统采用：

> PostgreSQL Database-per-Tenant

因此明确分为：

## Control DB

控制平面：

```text
user
account
session
verification

organization
member
invitation
organizationRole

tenant_database
platform_role
...
```

主要负责：

```text
身份
认证
Tenant Registry
Membership
角色
租户数据库路由
```

---

## Tenant DB

每个租户独立数据库。

例如：

```text
Tenant A DB

department
employee_profile
position

customer
supplier
product
order
order_item
inventory
invoice
...
```

Tenant B 拥有自己的另一套数据库。

---

# 8. Department 部门设计

Better Auth 不负责企业部门组织树。

Department 属于租户业务数据，因此放到 Tenant DB。

建议：

```text
department
──────────────────────────
id
parentId
name
code
leaderMemberId
sort
status
createdAt
updatedAt
```

支持：

```text
销售中心
│
├── 华东销售部
│   ├── 宁波组
│   └── 杭州组
│
└── 华南销售部
```

---

# 9. Employee Profile

由于 Member 位于 Control DB，而 Department 位于 Tenant DB，因此不建议：

```text
Control DB:

member.departmentId
```

这会形成跨数据库引用。

推荐：

```text
Tenant DB

employee_profile
────────────────────
id
memberId
departmentId
employeeNo
positionId
jobTitle
managerMemberId
status
...
```

其中：

```text
memberId
```

对应 Control DB 中的 Better Auth Member ID。

逻辑关系：

```text
Control DB

User
 ↓
Member
 ↓
memberId = M001


Tenant DB

employee_profile
────────────────
memberId = M001
departmentId = D001
positionId = P001
```

---

# 10. 完整权限模型

权限模型正式定义为四个核心维度：

```text
Subject
+
Action
+
Scope / Conditions
+
Fields
```

其中：

| 维度 | 中文 | 示例 |
|---|---|---|
| Subject | 资源 | Order、Customer |
| Action | 动作 | read、create、update、delete |
| Scope | 数据范围 | self、department、tenant |
| Fields | 字段 | phone、amount、costPrice |

CASL 底层使用 Conditions。

后台管理员使用更容易理解的 Scope。

---

# 11. Subject

Subject 表示业务资源。

例如：

```text
Order
Customer
Product
Inventory
Supplier
Invoice
Employee
Department
```

Subject 不需要由租户管理员自己创建。

它应该由系统代码注册。

---

# 12. Action

统一定义常用动作：

```text
read
create
update
delete
export
import
approve
cancel
assign
manage
```

Feature 可以扩展自己的 Action。

例如订单：

```text
Order

read
create
update
delete
export
approve
cancel
```

---

# 13. Scope 数据范围

统一基础 Scope：

```text
self
department
department_and_children
tenant
custom
```

含义：

### self

本人数据。

例如：

```text
order.salesId = currentUserId
```

---

### department

本部门数据。

```text
order.departmentId = currentDepartmentId
```

---

### department_and_children

当前部门 + 下级部门。

例如：

```text
销售中心

├── 华东销售部
│   └── 宁波组
└── 华南销售部
```

销售中心经理可以看到全部下级部门。

---

### tenant

当前 Tenant 全部数据。

由于已经使用 Database-per-Tenant：

```text
tenant
```

通常意味着当前 Tenant DB 全部数据。

---

### custom

特殊业务策略逃生口。

例如：

```text
managed_warehouse
assigned_project
responsible_customer
region
```

不要为了支持所有未来需求，把管理员后台做成任意 JSON Condition 编辑器。

---

# 14. Scope 编译成 CASL Conditions

租户管理员配置：

```text
Order
read
scope = department
```

系统内部转换：

```ts
can("read", "Order", {
  departmentId: context.departmentId,
})
```

配置：

```text
scope = self
```

转换：

```ts
can("read", "Order", {
  salesId: context.userId,
})
```

配置：

```text
scope = tenant
```

转换：

```ts
can("read", "Order")
```

管理员永远不需要直接填写 CASL Conditions。

---

# 15. Fields 字段权限

Fields 不只是控制显示隐藏。

它应该和 Action 配合使用。

例如：

```text
Customer

Fields:
name
phone
address
level
creditLimit
```

销售角色：

```text
read:
name
phone
address
level

update:
phone
address
```

前端自动得到：

| 字段 | read | update | UI |
|---|---:|---:|---|
| name | ✓ | ✗ | 显示，只读 |
| phone | ✓ | ✓ | 显示，可编辑 |
| address | ✓ | ✓ | 显示，可编辑 |
| level | ✓ | ✗ | 显示，只读 |
| creditLimit | ✗ | ✗ | 隐藏 |

规则：

```text
不能 read
→ Hidden

能 read
不能 update
→ Readonly

能 read
能 update
→ Editable
```

---

# 16. Create Fields 与 Update Fields 必须分开

例如订单：

```text
创建时：

amount    ✓
remark    ✓
status    ✗
creator   ✗
```

修改时：

```text
amount    ✗
remark    ✓
status    ✓
creator   ✗
```

因此权限表达：

```text
create Order:
amount
remark
```

```text
update Order:
status
remark
```

不要简单定义：

```text
editableFields
```

因为 Create 和 Update 的编辑能力可能完全不同。

---

# 17. Export Fields

字段权限也可以作用到 Export。

例如：

```text
Customer

read:
name
phone
address

export:
name
address
```

结果：

```text
页面上可以看到手机号

但是导出 Excel：
手机号不存在
```

因此建议字段权限支持：

```text
read
create
update
export
```

四个基础 Action。

---

# 18. Field Policy 字段展示策略

CASL Fields 主要负责授权。

部分敏感字段还需要数据保护策略：

```text
Mask
```

例如：

```text
phone

138****1234
```

因此增加可选：

```text
Field Policy
```

例如：

```ts
{
  subject: "Customer",
  field: "phone",
  mask: "phone"
}
```

最终：

```text
无 read
→ Hidden

read + mask
→ Masked

read
→ Full Readonly

read + update
→ Editable
```

Field Policy 属于增强层，不是 CASL 核心授权模型。

---

# 19. Permission Registry

这是整个系统非常重要的一层。

所有 Feature 在代码里注册自己有哪些资源和权限。

例如：

```ts
const OrderPermissionRegistry = {
  subject: "Order",

  actions: {
    read: {
      label: "查看订单",
      scopes: [
        "self",
        "department",
        "department_and_children",
        "tenant",
      ],
    },

    create: {
      label: "新增订单",
      fields: [
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
        "status",
        "remark",
        "amount",
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
    },
  },
}
```

Permission Registry 是：

> 系统到底支持哪些权限的唯一声明来源。

---

# 20. 为什么 Permission Registry 应该代码定义

不要让 Tenant 管理员随便新增：

```text
subject = xxxxxx
action = xxxxxx
condition = 任意 JSON
```

否则会产生：

```text
无效权限
危险 Condition
数据库字段泄漏
Permission 名称失控
AI 随意创造权限
```

正确流程：

```text
开发 Feature
    ↓
代码注册 Permission
    ↓
Permission Registry
    ↓
权限管理后台自动生成
    ↓
Tenant 管理员配置
```

---

# 21. 角色权限管理页面

每个 Tenant 应该拥有：

```text
角色管理
```

例如：

```text
销售经理
财务
仓库主管
普通销售
```

打开“销售经理”：

```text
订单管理
────────────────────────────

☑ 查看订单
  数据范围：
  ○ 仅本人
  ● 本部门
  ○ 本部门及下级
  ○ 全部

☑ 新增订单

☑ 修改订单
  数据范围：
  ● 本部门

  字段：
  ☑ 状态
  ☑ 备注
  ☐ 金额

☐ 删除订单

☑ 导出订单
```

---

# 22. 字段权限管理 UI

建议使用矩阵。

例如 Customer：

| 字段 | 查看 | 新增填写 | 修改 | 导出 |
|---|---:|---:|---:|---:|
| 姓名 | ✓ | ✓ | ✗ | ✓ |
| 手机号 | ✓ | ✓ | ✓ | ✗ |
| 地址 | ✓ | ✓ | ✓ | ✓ |
| 客户等级 | ✓ | ✗ | ✗ | ✓ |
| 信用额度 | ✗ | ✗ | ✗ | ✗ |

这样管理员非常容易理解。

---

# 23. 页面权限不单独设计

不要新增：

```text
page.order
```

页面访问应该消费业务权限。

例如：

```text
can("read", "Order")
```

有权限：

```text
显示订单菜单
允许访问 /orders
允许读取订单
```

没有权限：

```text
隐藏菜单
/orders 返回 403
API 返回 403
```

因此：

> Page 不是权限源，而是 Permission Consumer。

---

# 24. 菜单权限不单独设计

禁止：

```text
menu.order = true
```

直接根据：

```text
Order + read
```

决定是否显示菜单。

---

# 25. 按钮权限不单独设计

新增订单按钮：

```text
can("create", "Order")
```

修改按钮：

```text
can("update", order)
```

删除按钮：

```text
can("delete", order)
```

导出按钮：

```text
can("export", "Order")
```

按钮同样只是权限消费者。

---

# 26. Better Auth Role 与 CASL 的关系

Better Auth 不应该直接负责所有业务 Condition。

Better Auth 更适合负责：

```text
Member
Role
Role Permission Assignment
```

例如：

```text
sales_manager

order.read
order.update
customer.read
```

具体 Scope：

```text
department
```

以及 Fields：

```text
status
remark
```

由 SaaS Authorization Layer 管理。

---

# 27. Role Permission 建议结构

逻辑上可以理解成：

```text
role_permission
──────────────────────────────
id
roleId
subject
action
scope
fields
```

例如：

```text
role = sales_manager

subject = Order
action = read
scope = department
fields = *
```

再一条：

```text
subject = Order
action = update
scope = department
fields = [status, remark]
```

不建议存任意 CASL Conditions JSON。

---

# 28. Authorization Context

用户进入 Tenant 后，统一生成：

```ts
interface AuthorizationContext {
  userId: string

  tenantId: string
  memberId: string

  roleIds: string[]
  permissions: PermissionRule[]

  departmentId: string | null
  departmentPath?: string[]

  platformRoles?: string[]
}
```

例如：

```ts
{
  userId: "U001",

  tenantId: "T001",
  memberId: "M001",

  roleIds: ["sales_manager"],

  departmentId: "D002",

  permissions: [
    {
      subject: "Order",
      action: "read",
      scope: "department"
    },

    {
      subject: "Order",
      action: "update",
      scope: "department",
      fields: ["status", "remark"]
    }
  ]
}
```

---

# 29. Ability Builder

Authorization Context 被编译成 CASL Ability。

例如：

```ts
function buildAbility(context) {
  if (hasPermission("Order", "read", "department")) {
    can("read", "Order", {
      departmentId: context.departmentId,
    })
  }

  if (hasPermission("Order", "update", "department")) {
    can(
      "update",
      "Order",
      ["status", "remark"],
      {
        departmentId: context.departmentId,
      }
    )
  }
}
```

最终所有应用层消费这个 Ability。

---

# 30. 前端 React

通过 `@casl/react`：

```tsx
<Can I="create" a="Order">
  <CreateOrderButton />
</Can>
```

具体对象：

```tsx
<Can I="update" this={order}>
  <EditButton />
</Can>
```

字段：

```tsx
<Can
  I="update"
  this={order}
  field="status"
>
  <StatusEditor />
</Can>
```

---

# 31. UI 字段状态统一推导

前端提供统一组件：

```tsx
<AuthorizedField
  subject="Customer"
  action="update"
  field="phone"
/>
```

内部规则：

```text
!can(read)
→ Hidden

can(read) && !can(update)
→ Readonly

can(read) && can(update)
→ Editable
```

不要让每个 Feature 自己重新实现。

---

# 32. Server 授权

前端权限永远不能作为安全边界。

必须：

```text
Frontend
→ UX

Server
→ Security
```

例如：

```ts
if (!ability.can("update", order)) {
  throw new ForbiddenError()
}
```

即使用户：

```text
DevTools
Postman
curl
```

直接调用 API，也必须被服务端阻止。

---

# 33. Prisma 数据权限

列表查询：

```ts
prisma.order.findMany({
  where: accessibleBy(ability).Order,
})
```

CASL 将：

```text
read Order
scope = department
```

编译成类似：

```text
WHERE departmentId = 当前部门
```

这就是 Row-Level Authorization。

---

# 34. Database-per-Tenant 是第一层隔离

请求流程：

```text
Request
  ↓
Better Auth Session
  ↓
activeOrganizationId
  ↓
Tenant Resolver
  ↓
Tenant Database
  ↓
CASL
  ↓
Prisma
```

因此即便某个 Feature 忘了添加 CASL：

```ts
prisma.order.findMany()
```

理论上也只能查当前 Tenant DB。

不会查询其他 Tenant 的订单。

形成：

```text
Database-per-Tenant
+
CASL
```

即：

```text
租户物理隔离
+
租户内部逻辑授权
```

---

# 35. 完整登录和授权流程

```text
用户登录
   ↓
Better Auth
   ↓
User
   ↓
Session
   ↓
选择 / 恢复 activeOrganization
   ↓
Member
   ↓
Role
   ↓
Tenant Resolver
   ↓
Tenant DB
   ↓
employee_profile
   ↓
departmentId
   ↓
加载 Role Permission
   ↓
Authorization Context
   ↓
CASL Ability Builder
   ↓
┌───────────────┬───────────────┬───────────────┐
↓               ↓               ↓
React           Server          Prisma
↓               ↓               ↓
菜单/页面/按钮   操作权限         数据范围
字段状态         API保护          Query Filter
```

---

# 36. 权限加载与缓存

不要每个组件都：

```text
查 Role
查 Permission
查 Department
```

进入 Tenant Context 后构建一次：

```text
Authorization Context
+
CASL Ability
```

然后缓存。

缓存 Key 可以类似：

```text
authz:{tenantId}:{memberId}
```

---

# 37. 权限修改后的缓存失效

权限不能从登录一直缓存到退出而永不刷新。

例如：

```text
上午：
张三 = sales_manager

下午：
管理员降级为 sales
```

权限必须及时失效。

V1 推荐简单方案：

```text
Role Permission 修改
        ↓
Invalidate Cache
        ↓
下一次请求
        ↓
重新 Build Ability
```

后续可以增加：

```text
permissionVersion
```

实现版本检测。

---

# 38. FDD 权限组织

权限定义按照 Feature 管理。

例如：

```text
features/
├── orders/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   │
│   ├── permissions/
│   │   ├── subjects.ts
│   │   ├── actions.ts
│   │   ├── registry.ts
│   │   ├── scopes.ts
│   │   └── fields.ts
│   │
│   └── ui/
│
├── customers/
│   └── permissions/
│
└── shared/
    └── authorization/
        ├── ability.ts
        ├── ability-builder.ts
        ├── context.ts
        ├── permission-registry.ts
        ├── scope-resolver.ts
        ├── field-policy.ts
        └── guards/
```

每个 Feature：

> 自己声明权限。

Shared：

> 提供统一权限基础设施。

---

# 39. Permission Registry 聚合

Feature：

```text
orders.permissions
customers.permissions
inventory.permissions
```

统一注册：

```text
Global Permission Registry
```

后台权限管理 UI 根据 Registry 自动渲染。

因此新增 Feature 时：

```text
新增 Feature
↓
注册 Permissions
↓
角色权限后台自动出现
```

不需要手工修改权限页面。

---

# 40. Harness 必须规定的规则

Harness 中明确写：

## Rule 1

禁止 Feature 自建权限体系。

---

## Rule 2

所有权限必须注册进入 Permission Registry。

---

## Rule 3

禁止创建：

```text
pagePermission
menuPermission
buttonPermission
```

独立权限体系。

---

## Rule 4

页面、菜单和按钮必须消费 CASL Ability。

---

## Rule 5

Server 必须重新检查权限。

前端权限不能作为安全依据。

---

## Rule 6

列表数据查询必须使用授权 Query。

例如：

```text
accessibleBy()
```

或者统一 Repository Policy。

---

## Rule 7

Fields 权限必须同时作用于：

```text
read
create
update
export
```

需要时分别配置。

---

## Rule 8

管理员不能配置任意 CASL Condition JSON。

必须通过：

```text
Scope Registry
```

转换。

---

## Rule 9

Tenant 私有业务数据必须存在 Tenant DB。

---

## Rule 10

平台身份和 Tenant Membership 必须存在 Control Plane。

---

# 41. 完整权限后台结构

建议 SaaS Tenant Admin 后台：

```text
系统管理
│
├── 用户管理
│
├── 部门管理
│
├── 岗位管理
│
├── 角色管理
│
└── 权限管理
```

角色管理：

```text
销售经理

基本信息
─────────────────
角色名称
角色编码
角色描述


功能权限
─────────────────
订单管理
  ☑ 查看
  ☑ 新增
  ☑ 修改
  ☐ 删除
  ☑ 导出


数据权限
─────────────────
查看订单：
  ○ 本人
  ● 本部门
  ○ 本部门及下级
  ○ 全部


字段权限
─────────────────

             查看   新增   修改   导出
订单编号       ☑     ☐     ☐     ☑
金额           ☑     ☑     ☐     ☑
状态           ☑     ☐     ☑     ☑
备注           ☑     ☑     ☑     ☐
成本价         ☐     ☐     ☐     ☐
```

---

# 42. 完整权限概念图

```text
                      Role
                       │
                       ↓
                Permission Rule
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Subject       Action        Scope
       Order         update      department
          │
          └────────────┬────────────┘
                       ↓
                     Fields
               status / remark
                       │
                       ↓
                 Ability Builder
                       │
                       ↓
                     CASL
          ┌────────────┼────────────┐
          ↓            ↓            ↓
        React        Server       Prisma
          ↓            ↓            ↓
       页面/UI       API授权       数据过滤
```

---

# 43. 最终权限语义

最终不要说：

```text
销售经理有订单页面权限
```

而应该表达：

```text
销售经理：

可以 read Order
scope = department

可以 create Order

可以 update Order
scope = department
fields = status, remark

可以 export Order
fields = id, customerName, amount

不能 delete Order
```

页面 UI 只是根据这些权限自动产生。

---

# 44. 最终架构定义

本 SaaS Foundation 的权限系统正式采用：

> Better Auth 负责 Identity（身份）、Session（会话）、Organization/Tenant（租户）、Membership（成员关系）和 Role 生命周期。

> Permission Registry 负责声明系统支持的 Subject、Action、Scope 和 Fields。

> Tenant 管理员通过角色权限管理后台配置 Role Permission。

> Authorization Context 将 Better Auth Membership、Tenant、Role、Department 等信息统一汇总。

> CASL 将 Role Permission 和 Authorization Context 编译为 Ability。

> `@casl/react` 消费 Ability，实现菜单、页面、按钮和字段状态控制。

> 服务端使用同一 Ability 执行真实操作授权。

> `@casl/prisma` 将数据 Scope 转换为数据库查询条件。

> PostgreSQL Database-per-Tenant 提供租户级物理隔离。

---

# 45. 最终模型

最终可以概括为：

```text
Better Auth
Identity / Tenant / Member / Role
              ↓
Permission Registry
Subject / Action / Scope / Fields
              ↓
Role Permission
              ↓
Authorization Context
              ↓
CASL Ability
              ↓
┌───────────┬───────────┬───────────┬───────────┐
│           │           │           │           │
Menu       Page        Button      Field       API
│           │           │           │           │
└───────────┴───────────┴───────────┴─────┬─────┘
                                          ↓
                                       Prisma
                                          ↓
                                 Tenant Database
```

---

# 46. 一句话总结

整套系统最终遵循一个原则：

> **User 表示“你是谁”，Member 表示“你在这个 Tenant 是谁”，Role 表示“你获得什么权限集合”，CASL 决定“你到底能对哪些资源、哪些数据、哪些字段执行什么操作”，Database-per-Tenant 则保证你永远只能进入当前 Tenant 的业务数据世界。**

这套体系作为 SaaS Foundation 应一次性支持：

```text
Subject
Action
Scope
Fields
```

完整授权模型。

但具体 Feature 可以按需使用：

```text
简单 Feature：
Subject + Action

普通业务：
Subject + Action + Scope

敏感业务：
Subject + Action + Scope + Fields

特殊数据：
再增加 Field Policy / Mask
```

即：

> Foundation 能力完整，Feature 按需使用。