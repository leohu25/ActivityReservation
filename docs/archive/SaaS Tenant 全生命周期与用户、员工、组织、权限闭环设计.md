# SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计

## 1. 文档目标

本文档定义整个 SaaS 从：

```text
平台开通租户
    ↓
Tenant Owner 接管
    ↓
建立组织架构
    ↓
建立角色权限
    ↓
邀请员工
    ↓
员工激活账号
    ↓
登录 Tenant
    ↓
加载部门 / 角色 / 权限
    ↓
日常调岗 / 调部门 / 调角色
    ↓
员工离职
    ↓
Tenant 停用 / 注销
```

形成完整生命周期闭环。

本文档同时明确：

- Platform Admin（平台管理员）
- Tenant Owner（租户所有者）
- Tenant Admin（租户管理员）
- User（平台登录用户）
- Member（租户成员）
- EmployeeProfile（企业员工档案）
- Department（部门）
- Position（岗位）
- Role（角色）
- Permission（权限）

各自的职责和生命周期。

---

# 2. 最终核心模型

整个系统正式定义为：

```text
                         SaaS Platform
                              │
                             User
                       全局登录身份
                              │
                       ┌──────┴──────┐
                       ↓             ↓
                 Platform Role    Membership
                 平台身份              │
                                      ↓
                                    Tenant
                              Organization
                                      │
                                   Member
                                租户成员身份
                                      │
                         ┌────────────┴────────────┐
                         ↓                         ↓
                       Role                 EmployeeProfile
                     权限身份                   员工身份
                                                   │
                                   ┌───────────────┼───────────────┐
                                   ↓               ↓               ↓
                              Department        Position        Manager
                                部门              岗位            上级
```

---

# 3. 六个核心概念必须分开

## User

表示：

> 这个人是谁，以及如何登录 SaaS。

例如：

```text
User U001
张三
zhangsan@example.com
```

属于平台 Identity（身份）层。

由 Better Auth 管理。

---

## Organization / Tenant

表示：

> SaaS 的一个客户企业。

本系统正式定义：

```text
Better Auth Organization
=
SaaS Tenant
```

例如：

```text
T001
宸润数智有限公司
```

---

## Member

表示：

> User 在某一个 Tenant 中的成员身份。

例如：

```text
User = U001

Tenant = T001

Member = M001
Role = sales_manager
```

---

## EmployeeProfile

表示：

> Member 在企业内部的员工档案。

例如：

```text
工号：E001
部门：销售部
岗位：销售经理
直属领导：王总
```

---

## Department

表示：

> 员工在企业组织架构中属于哪里。

---

## Position

表示：

> 员工承担什么企业岗位。

---

## Role

表示：

> 员工在系统里能干什么。

---

# 4. 一句话记忆

```text
User
= 你是谁

Member
= 你在这个 Tenant 里是谁

Employee
= 你在这家公司是什么员工

Department
= 你在哪里

Position
= 你是什么岗位

Role
= 你有什么权限
```

---

# 5. 两个 Admin 必须彻底区分

这是整个架构最容易踩坑的地方之一。

系统同时存在：

```text
Platform Admin

Tenant Admin
```

虽然名字都有 Admin，但完全不是同一种权限。

---

# 6. Platform Admin（平台管理员）

Platform Admin 属于：

```text
SaaS Platform
```

他管理的是整个 SaaS。

例如：

```text
创建 Tenant
停用 Tenant
查看 Tenant 状态

套餐
计费
数据库 Provisioning
平台用户
系统运营
```

Better Auth 本身有独立的 Admin Plugin（管理员插件），用于平台级 User 管理、禁用用户、Session 管理等；这和 Organization 内部的 `owner/admin/member` 是两个独立权限域。

产品和代码命名建议明确使用：

```text
platform_admin
```

而不要只写：

```text
admin
```

避免和 Tenant Admin 混淆。

---

# 7. Tenant Owner（租户所有者）

Owner 表示：

> 这个 SaaS Tenant 的最高所有权身份。

默认拥有 Tenant 最高权限。

Better Auth Organization 默认：

```text
owner
admin
member
```

三个角色。

其中 Owner 默认拥有完整 Organization 控制能力。

Owner 主要负责：

```text
Tenant 所有权

授权 Tenant Admin

最高级企业设置

高风险权限管理

Tenant 注销申请

Owner 转移
```

---

# 8. Tenant Admin（租户管理员）

Tenant Admin 是：

> Owner 授权的日常管理人员。

通常负责：

```text
员工管理

部门管理

岗位管理

角色管理

权限配置

成员邀请

企业基础配置
```

但不能默认：

```text
删除 Tenant

抢走 Owner

改变 Tenant 所有权
```

Better Auth 默认的 Organization Admin 也正是：

> 基本拥有组织管理权限，但不能删除 Organization 或改变 Owner。

---

# 9. 普通 Employee / Member

例如：

```text
sales_manager
sales
finance
warehouse_manager
buyer
```

这些都是：

```text
Member + Business Role
```

负责实际业务操作。

---

# 10. 权限层级最终形成

```text
SaaS Platform
│
├── Platform Admin
│
└── Tenant
    │
    ├── Owner
    │
    ├── Admin
    │
    └── Member
        │
        ├── sales_manager
        ├── sales
        ├── finance
        └── ...
```

平台管理员永远不因为“创建 Tenant”自动成为该 Tenant 的 Member。

---

# 11. 数据库总体结构

## Control DB（平台控制数据库）

保存：

```text
Better Auth

user
account
session
verification

organization
member
invitation
organizationRole

tenantDatabase
organizationRolePolicy
authorizationState

Platform Admin 信息
Provisioning 状态
Audit
```

---

# 12. Tenant DB（租户数据库）

保存：

```text
employeeProfile

department

position

companyProfile

customer
supplier
product
order
inventory
invoice

其他业务 Feature 数据
```

---

# 13. Tenant 生命周期

Tenant 生命周期建议定义：

```text
PROVISIONING
      ↓
ACTIVE_PENDING_OWNER
      ↓
ACTIVE
      ↓
SUSPENDED
      ↓
PENDING_DELETE
      ↓
DELETED
```

---

## PROVISIONING

正在：

```text
创建 Organization

创建 Tenant DB

Migration

Seed

初始化权限
```

此时禁止业务访问。

---

## ACTIVE_PENDING_OWNER

Tenant 已经创建完成。

但：

```text
Owner 尚未完成账号激活
```

---

## ACTIVE

正常运营。

---

## SUSPENDED

平台暂停该 Tenant。

例如：

```text
欠费
违规
安全问题
人工停用
```

用户仍然存在，但是禁止进入 Tenant 业务系统。

---

## PENDING_DELETE

等待删除。

保留一段 Retention Period（保留期）。

---

## DELETED

Tenant 生命周期结束。

---

# 14. 平台创建 Tenant 的完整闭环

平台管理员打开：

```text
Tenant 管理
→ 新建 Tenant
```

填写：

```text
企业名称

Tenant Slug

Owner 姓名

Owner 邮箱

套餐

数据库 Region

其他初始配置
```

然后统一交给：

```text
TenantProvisioningService
```

---

# 15. 第一步：解析 Owner User

根据 Owner Email：

```text
owner@example.com
```

查询 Control DB：

```text
User 是否已经存在？
```

---

# 16. Owner 已存在

例如：

```text
User U001
已经存在
```

直接复用：

```text
ownerUserId = U001
```

禁止：

```text
重新创建 User
```

---

# 17. Owner 不存在

平台需要建立 Owner 的全局身份。

推荐：

```text
Better Auth Admin Plugin

Server Side
↓
Create User
```

Better Auth Admin Plugin 当前提供服务端 `createUser` 等 User 管理能力。

但平台管理员：

> 不应该替 Owner 决定一个永久密码。

建议生成：

```text
Cryptographically Random Bootstrap Password
```

即：

> 高强度、平台管理员不可见、一次性的随机 Bootstrap 密码。

然后发送：

```text
账号激活 / 设置密码邮件
```

Better Auth 本身提供 Password Reset（密码重置）流程，可通过邮件 Token 让用户自行设置密码。

最终：

```text
User 已存在

但状态：
OWNER_ACTIVATION_PENDING
```

---

# 18. 第二步：代表 Owner 创建 Organization

这里非常重要。

禁止：

```text
Platform Admin Session
↓
createOrganization()
```

否则默认创建人可能成为 Organization Owner。

Better Auth 官方支持：

```text
Server Side

createOrganization({
    userId: ownerUserId
})
```

并明确要求：

> 管理员代表另一个用户创建 Organization 时，不传当前管理员 Session Headers，而使用 Server-only `userId`。

因此：

```text
Platform Admin
    │
    │ 调用平台 Application Service
    ↓
TenantProvisioningService
    │
    ↓
Better Auth Server API
    │
    │ userId = Owner User
    ↓
Organization
    │
    ↓
Owner Member
```

结果：

```text
Platform Admin
不是 Member

Owner User
才是 owner
```

---

# 19. 建议关闭普通用户自行创建 Tenant

如果本 SaaS 采用：

> 平台管理员审核 / 开通 Tenant

模式，则建议配置：

```text
allowUserToCreateOrganization = false
```

Better Auth 官方允许限制 User 是否能够自行创建 Organization。

这样所有 Tenant 都必须通过：

```text
TenantProvisioningService
```

创建。

---

# 20. 第三步：创建 Tenant Database

Organization 创建成功后：

```text
organizationId = T001
```

创建：

```text
tenantDatabase
```

状态：

```text
PROVISIONING
```

然后：

```text
Create PostgreSQL Database

↓
Run Migration

↓
Verify Schema

↓
Seed Foundation
```

---

# 21. Tenant DB Seed

初始化：

```text
基础配置

CompanyProfile

Department Root

默认 Position

业务基础配置

Feature Seed
```

不建议伪造：

```text
销售部
财务部
技术部
```

这种企业结构。

可以只创建：

```text
ROOT
企业根节点
```

然后由 Owner 自己建立真正部门树。

---

# 22. 第四步：初始化权限

初始化 Better Auth 内置：

```text
owner
admin
member
```

以及系统 Permission Registry。

根据产品需求 Seed 默认业务角色：

```text
sales
sales_manager
finance
warehouse_manager
```

也可以 Tenant 激活后再由 Owner 创建。

---

# 23. 第五步：创建 Owner EmployeeProfile

Owner Member 已经存在：

```text
M001
```

可以创建：

```text
EmployeeProfile
```

例如：

```text
id             E001
userId         U001
memberId       M001

departmentId   null
positionId     null

status         ACTIVE
```

Owner 初始可以暂时：

```text
没有部门
没有岗位
```

不要人为给 Owner 塞一个假部门。

由于 Owner 拥有 Tenant 级管理权限：

```text
departmentId = null
```

不会影响 Tenant Administration。

---

# 24. 第六步：完成 Tenant Provisioning

全部成功：

```text
Tenant Database
READY

Organization
READY

Owner Membership
READY

Permission
READY
```

如果 Owner 是已有 User：

```text
Tenant.status = ACTIVE
```

如果是新创建且尚未激活：

```text
Tenant.status =
ACTIVE_PENDING_OWNER
```

---

# 25. 为什么不能要求整个创建流程是一个数据库事务

因为创建 Tenant 涉及：

```text
Control DB

Better Auth

PostgreSQL CREATE DATABASE

Tenant Migration

Email

Tenant DB
```

无法使用一个普通 ACID Transaction（事务）覆盖所有东西。

因此：

> Tenant Provisioning 必须设计成 Saga / State Machine（状态机 + 补偿流程）。

例如：

```text
CREATE_ORGANIZATION       DONE
CREATE_DATABASE           DONE
RUN_MIGRATION             FAILED
SEED_DATABASE             WAITING
SEND_ACTIVATION_EMAIL     WAITING
```

平台可以：

```text
Retry
```

而不是留下一个“不知道创建到哪一步”的 Tenant。

---

# 26. Provisioning 必须幂等

例如 Migration 失败重试：

```text
TenantProvisioningService.retry(T001)
```

必须能够识别：

```text
Organization 已存在

Database 已存在

只继续未完成步骤
```

禁止重复创建：

```text
第二个 Organization
第二个 DB
第二个 Owner
```

---

# 27. Owner 第一次登录

Owner 点击激活邮件：

```text
设置密码

↓

邮箱验证

↓

Better Auth Login
```

然后：

```text
Session
    ↓
User U001
    ↓
Organization T001
    ↓
Member M001
    ↓
Role owner
```

---

# 28. Owner 首次登录 Onboarding

建议进入：

```text
Tenant Setup Wizard
租户初始化向导
```

依次完成：

```text
① 企业信息

② 部门结构

③ 岗位

④ 管理员

⑤ 初始角色权限

⑥ 员工
```

完成后：

```text
Tenant Onboarding
COMPLETE
```

---

# 29. Owner 创建 Tenant Admin

Owner 可以：

```text
成员管理
→ 邀请管理员
```

输入：

```text
admin@company.com
```

Role：

```text
admin
```

Better Auth Organization 本身提供 Invitation 流程；用户接受 Invitation 后才正式加入 Organization。

---

# 30. Tenant Admin 建立组织架构

Tenant Admin 进入：

```text
系统管理
└── 组织架构
```

建立：

```text
Department

Position
```

例如：

```text
宸润公司
│
├── 总经办
├── 销售中心
│   ├── 华东销售部
│   └── 华南销售部
├── 财务部
└── 仓储部
```

---

# 31. Tenant Admin 创建角色

进入：

```text
权限管理
→ 角色管理
```

创建：

```text
销售经理
销售员
财务
仓库主管
```

角色保存：

```text
Better Auth OrganizationRole
+
OrganizationRolePolicy
```

例如：

```text
sales_manager

Order.read
Scope = department

Order.update
Scope = department
Fields = status, remark
```

---

# 32. Tenant Admin 新增员工

管理员打开：

```text
员工管理
→ 新增员工
```

填写：

```text
姓名

邮箱

工号

部门

岗位

直属领导

角色
```

这时候还不能假设 Better Auth Member 已经存在。

---

# 33. EmployeeProfile 必须拥有自己的 ID

这里对前面的设计正式做一个优化。

推荐：

```text
EmployeeProfile
────────────────

id

userId?           nullable
memberId?         nullable
invitationId?     nullable

nameSnapshot
emailSnapshot

employeeNo

departmentId
positionId

managerEmployeeId

status
```

不要把：

```text
memberId
```

作为 EmployeeProfile 自己的主键。

---

# 34. EmployeeProfile 为什么 memberId 可以为空

员工刚建立时：

```text
Tenant Admin
已经维护了这个员工
```

但是用户可能还没：

```text
注册
登录
接受邀请
```

所以：

```text
Member
尚不存在
```

这时：

```text
EmployeeProfile.status = INVITED

memberId = null
```

这是正常状态。

---

# 35. 员工状态建议

```text
DRAFT

INVITED

ACTIVE

SUSPENDED

TERMINATED
```

---

## DRAFT

只是录入了员工档案。

尚未邀请。

---

## INVITED

已经发送 SaaS Access Invitation。

---

## ACTIVE

已经接受邀请并拥有 Member。

---

## SUSPENDED

临时停用业务访问。

---

## TERMINATED

离职。

---

# 36. 员工邀请完整流程

```text
Tenant Admin
    ↓
Create EmployeeProfile
    ↓
status = INVITED
    ↓
Better Auth Invitation
    ↓
发送邮件
    ↓
Employee 打开邀请
    ↓
登录 / 注册
    ↓
Accept Invitation
    ↓
Better Auth 创建 Member
    ↓
afterAcceptInvitation Hook
    ↓
绑定 EmployeeProfile
```

Better Auth 当前 Organization Hooks 可以在 Invitation 接受后得到：

```text
invitation
member
user
organization
```

非常适合完成 EmployeeProfile 绑定。

---

# 37. afterAcceptInvitation

伪代码：

```ts
afterAcceptInvitation: async ({
  invitation,
  member,
  user,
  organization,
}) => {

  const tenantDb =
    await tenantManager.get(
      organization.id
    )

  await tenantDb.employeeProfile.update({
    where: {
      invitationId:
        invitation.id
    },

    data: {
      userId: user.id,
      memberId: member.id,

      invitationId: null,

      status: "ACTIVE",
    }
  })

  await bumpAuthorizationVersion(
    organization.id
  )
}
```

至此：

```text
Employee
+
User
+
Member
```

完全闭环。

---

# 38. 已有 SaaS User 加入新 Tenant

例如李四已经属于 Tenant B。

现在 Tenant A 邀请：

```text
lisi@example.com
```

不创建第二个 User。

流程：

```text
Existing User U002
      │
      ├── Member B
      │
      └── 接受 Tenant A Invitation
                 ↓
              Member A
```

两个 Tenant：

```text
各自维护 EmployeeProfile
```

因此：

```text
User
1 个

Member
N 个

EmployeeProfile
每 Tenant 1 个
```

---

# 39. 登录完整闭环

员工登录：

```text
Email / OAuth
    ↓
Better Auth
    ↓
User
    ↓
Session
```

然后列出：

```text
该 User 所属 Organizations
```

---

# 40. User 只属于一个 Tenant

直接：

```text
进入该 Tenant
```

---

# 41. User 属于多个 Tenant

显示：

```text
选择企业

宸润公司
ABC 食品
XYZ 科技
```

选择后设置：

```text
activeOrganizationId
```

Better Auth Organization 提供 Active Organization（当前组织）机制。

---

# 42. Tenant Access Gate

每次进入 Tenant 业务系统：

```text
Session
  ↓
activeOrganizationId
  ↓
Tenant.status == ACTIVE ?
  ↓
Member 是否存在？
  ↓
EmployeeProfile.status == ACTIVE ?
  ↓
YES
```

任何一个失败：

```text
DENY
```

---

# 43. Authorization Context

通过后构建：

```ts
{
  userId,

  organizationId,
  memberId,

  roles,

  employeeId,

  departmentId,
  positionId,

  authorizationVersion,
}
```

然后：

```text
Better Auth Role
+
OrganizationRolePolicy
+
Employee Department
        ↓
CASL Ability
```

---

# 44. 权限闭环

例如：

```text
张三

Role:
sales_manager

Department:
D100
```

Role Policy：

```text
Order.read
scope = department
```

最终：

```text
CASL

can read Order

WHERE:
departmentId = D100
```

---

# 45. 员工调部门

例如：

```text
销售一部
→
销售二部
```

修改：

```text
EmployeeProfile.departmentId
```

不用修改：

```text
User
Member
Role
```

然后：

```text
authorizationVersion++
```

下一次 Ability 重建。

如果 Role：

```text
scope = department
```

数据权限自动变成：

```text
销售二部
```

---

# 46. 员工调岗位

例如：

```text
销售专员
→
高级销售
```

只修改：

```text
positionId
```

默认：

```text
不改变权限
```

因为：

```text
Position != Role
```

---

# 47. 员工升职需要权限变化

例如：

```text
销售
→
销售经理
```

这时 Tenant Admin 修改：

```text
Member.roles
```

例如：

```text
sales
→
sales_manager
```

Better Auth Organization 当前提供 Member Role Update，并支持 Member 多角色。

随后：

```text
authorizationVersion++
```

权限缓存失效。

---

# 48. Role 和 Position 不自动绑定

默认禁止：

```text
岗位 = 销售经理
所以自动永久拥有 sales_manager
```

可以提供：

```text
Position Default Roles
```

作为：

```text
默认推荐值
```

但最终 Role 必须独立配置。

---

# 49. Owner 转移

Owner Transfer（所有权转移）属于高风险操作。

只能由：

```text
Current Owner
```

发起。

例如：

```text
Owner 张三
        ↓
选择李四
        ↓
确认 MFA / Password
        ↓
李四成为 Owner
        ↓
张三降为 Admin / Member
```

建议使用：

```text
TenantOwnershipService
```

统一协调。

不要让普通“编辑 Member Role”页面直接把：

```text
owner
```

随意分配出去。

---

# 50. Owner 转移必须保证一个重要不变量

任何时候：

```text
Tenant 至少有一个 Owner
```

如果产品 V1 采用：

```text
Exactly One Primary Owner
```

则转移采用：

```text
先提升新 Owner
    ↓
确认成功
    ↓
再降级旧 Owner
```

宁愿短暂出现两个 Owner：

```text
也不能出现 0 Owner
```

---

# 51. Tenant Admin 创建 / 删除

Owner 可以：

```text
Member
→ admin
```

也可以：

```text
admin
→ member
```

但 Tenant Admin 不能：

```text
把自己提升为 Owner
```

---

# 52. Employee 临时停用

员工临时停用时：

```text
EmployeeProfile.status
ACTIVE
↓
SUSPENDED
```

Tenant Access Gate：

```text
拒绝业务访问
```

同时：

```text
authorizationVersion++
```

---

# 53. Tenant 级停用不要 Ban 全局 User

非常重要。

假设张三属于：

```text
Tenant A
Tenant B
```

A 公司停用张三：

```text
不能调用 Global User Ban
```

否则：

```text
Tenant B 也登录不了
```

应该只停用：

```text
Tenant A Membership / Employee Access
```

Global User Ban 只能用于：

```text
平台级安全封禁
```

---

# 54. Employee 离职

离职：

```text
EmployeeProfile

ACTIVE
↓
TERMINATED
```

然后：

```text
撤销 Tenant Membership
```

但：

```text
不要删除 Global User
```

因为该 User 可能还属于其他 Tenant。

---

# 55. 离职流程

建议统一：

```text
EmployeeOffboardingService
```

流程：

```text
标记 Employee TERMINATED
        ↓
取消未完成任务 / 转交负责人
        ↓
处理数据 Owner
        ↓
Remove Member
        ↓
Authorization Cache Invalidate
        ↓
Audit
```

---

# 56. 离职不能删除历史业务数据

例如：

```text
ORDER-1001
createdByMemberId = M001
```

张三离职以后：

```text
订单仍然存在
```

不能 Cascade Delete。

历史记录应该保留：

```text
actorMemberId
actorUserId
actorNameSnapshot
```

或者统一 Audit Snapshot。

---

# 57. User 删除权限属于平台

Tenant Admin：

```text
只能移除自己 Tenant 的 Membership
```

不能：

```text
DELETE User
```

Platform Admin 才能按照平台政策：

```text
Ban User
Delete User
```

Better Auth Admin Plugin 提供平台级 User Ban 等能力，并且 Ban 会影响 User 的全局登录与 Session，因此不能被 Tenant Admin 用来处理单租户员工停用。

---

# 58. Tenant Suspend（租户停用）

平台管理员：

```text
Tenant
ACTIVE
↓
SUSPENDED
```

所有 Tenant 用户：

```text
仍可登录 SaaS
```

但进入该 Tenant：

```text
Tenant Access Gate
→ DENY
```

如果 User 还有其他 Tenant：

```text
其他 Tenant 正常使用
```

---

# 59. Tenant 删除

不要直接：

```text
DROP DATABASE
```

流程：

```text
Owner / Platform Admin
      ↓
PENDING_DELETE
      ↓
停止新业务操作
      ↓
Retention Period
      ↓
Backup
      ↓
Drop Tenant DB
      ↓
清理 Organization
      ↓
清理 Membership
      ↓
保留平台审计
      ↓
DELETED
```

---

# 60. Tenant 删除为什么最后才删除 Organization

因为：

```text
Organization
```

是 Control Plane 中最重要的 Tenant Identity。

如果先删：

```text
Organization
```

然后 Tenant DB 删除失败：

```text
会留下一个难以追踪的孤儿数据库
```

所以建议：

```text
Database cleanup
完成
    ↓
最后清理 Control Plane Tenant Identity
```

---

# 61. 整个产品后台结构

## Platform Admin Portal

```text
平台管理
│
├── Tenant 管理
│   ├── 创建 Tenant
│   ├── Tenant 状态
│   ├── Provisioning
│   ├── Suspend
│   └── Delete
│
├── 平台用户
│
├── 套餐与计费
│
├── 数据库管理
│
└── 平台审计
```

---

# 62. Tenant Portal

```text
Tenant 后台
│
├── 工作台
│
├── 组织架构
│   ├── 员工管理
│   ├── 部门管理
│   └── 岗位管理
│
├── 权限管理
│   ├── 角色管理
│   └── 权限配置
│
├── 成员与访问
│   ├── 成员邀请
│   └── 待加入成员
│
├── 企业设置
│
└── 审计日志
```

---

# 63. 各角色最终能操作什么

| 能力 | Platform Admin | Owner | Tenant Admin | 普通 Member |
|---|---:|---:|---:|---:|
| 创建 Tenant | ✓ | ✗ | ✗ | ✗ |
| Provision Tenant DB | ✓ | ✗ | ✗ | ✗ |
| Suspend Tenant | ✓ | ✗ | ✗ | ✗ |
| Tenant 所有权 | ✗ | ✓ | ✗ | ✗ |
| Tenant Admin 管理 | ✗ | ✓ | 部分 | ✗ |
| 部门管理 | ✗ | ✓ | ✓ | 按权限 |
| 岗位管理 | ✗ | ✓ | ✓ | 按权限 |
| 员工管理 | ✗ | ✓ | ✓ | 按权限 |
| 角色管理 | ✗ | ✓ | ✓ | 按权限 |
| 权限配置 | ✗ | ✓ | ✓ | 按权限 |
| 业务数据 | ✗ | ✓ | ✓/按角色 | 按角色 |
| 删除全局 User | 平台策略 | ✗ | ✗ | ✗ |

注意：

> Platform Admin 的“✗ 业务数据”是产品默认原则。

平台管理员不应该因为自己管理 SaaS 平台就自动拥有客户业务数据权限。

如果未来需要 Customer Support Impersonation（客服模拟登录），必须：

```text
单独授权
明确提示
全量审计
短 Session
```

不能天然拥有。

---

# 64. 三个生命周期同时存在

整个系统实际上存在三个相互独立的生命周期。

## User Lifecycle

```text
Created
↓
Verified
↓
Active
↓
Globally Banned / Deleted
```

平台级。

---

## Membership Lifecycle

```text
Invited
↓
Member
↓
Role Change
↓
Removed
```

Tenant 级。

---

## Employee Lifecycle

```text
Draft
↓
Invited
↓
Active
↓
Suspended
↓
Terminated
```

企业级。

---

# 65. 三个生命周期不能互相替代

例如：

```text
Employee Terminated
```

不代表：

```text
User Deleted
```

而是：

```text
Employee
TERMINATED

Member
REMOVED

User
依然存在
```

这条必须写进 Harness。

---

# 66. 最终登录授权闭环

```text
                 Login
                   ↓
              Better Auth
                   ↓
                  User
                   ↓
                Session
                   ↓
        Select Active Organization
                   ↓
              Tenant Gate
                   ↓
                 Member
                   ↓
             EmployeeProfile
                   ↓
          Department / Position
                   ↓
                  Roles
                   ↓
       Better Auth Action Grants
                   +
          Fine-grained Policy
                   ↓
         Authorization Context
                   ↓
              CASL Ability
        ┌──────────┼──────────┐
        ↓          ↓          ↓
       React      Server     Prisma
        ↓          ↓          ↓
       UI         API       Data Scope
```

---

# 67. 最终 Tenant 创建闭环

```text
Platform Admin
      ↓
Create Tenant Request
      ↓
Resolve / Create Owner User
      ↓
Better Auth Server
createOrganization(ownerUserId)
      ↓
Organization
+
Owner Member
      ↓
Create Tenant DB
      ↓
Migration
      ↓
Seed
      ↓
Create Owner EmployeeProfile
      ↓
Initialize Permission
      ↓
Send Owner Activation
      ↓
Tenant ACTIVE
```

---

# 68. 最终 Employee 入职闭环

```text
Tenant Admin
      ↓
Create EmployeeProfile
      ↓
Department
Position
Initial Roles
      ↓
Better Auth Invitation
      ↓
Employee Login / Signup
      ↓
Accept Invitation
      ↓
Create Member
      ↓
afterAcceptInvitation
      ↓
Bind:

User
Member
EmployeeProfile
      ↓
Authorization Version++
      ↓
Employee ACTIVE
```

---

# 69. 最终 Employee 离职闭环

```text
Tenant Admin
      ↓
Terminate Employee
      ↓
EmployeeProfile = TERMINATED
      ↓
业务数据交接
      ↓
Remove Membership
      ↓
Invalidate Authorization
      ↓
Revoke Tenant Access
      ↓
保留 User
      ↓
保留历史 Audit
```

---

# 70. AI 实施时必须建立的 Application Services

不要让 UI 直接跨数据库乱调用。

至少建立：

```text
TenantProvisioningService

TenantLifecycleService

TenantOwnershipService

EmployeeOnboardingService

EmployeeTransferService

EmployeeOffboardingService

RoleAuthorizationService

AuthorizationContextService

TenantDatabaseManager
```

---

# 71. 最重要的服务职责

## TenantProvisioningService

```text
平台开 Tenant
```

---

## TenantLifecycleService

```text
Suspend
Resume
Delete
```

---

## TenantOwnershipService

```text
Owner Transfer
Admin Delegation
```

---

## EmployeeOnboardingService

```text
员工档案
+
Invitation
+
Member Binding
```

---

## EmployeeTransferService

```text
部门
岗位
直属上级
角色
```

变更。

---

## EmployeeOffboardingService

```text
离职
Membership Removal
数据交接
```

---

# 72. 必须遵循的安全规则

### R-01

Platform Admin 创建 Tenant：

```text
不得自动成为 Tenant Member
```

---

### R-02

Tenant Admin：

```text
不得删除 Global User
```

---

### R-03

Employee 离职：

```text
不得删除历史业务数据
```

---

### R-04

Tenant Suspend：

```text
不得 Ban Global User
```

---

### R-05

Tenant Admin：

```text
不得访问其他 Tenant
```

---

### R-06

Platform Admin：

```text
默认不得访问 Tenant 私有业务数据
```

---

### R-07

Owner：

```text
至少保留一个
```

---

### R-08

Employee：

```text
允许 INVITED 状态没有 Member
```

---

### R-09

Member：

```text
一旦创建
必须对应明确的 Tenant
```

---

### R-10

所有跨 Control DB / Tenant DB 流程：

```text
必须幂等
必须可重试
必须有状态
必须有 Audit
```

---

# 73. Harness 必须写入的概念边界

```text
Platform Admin
≠
Tenant Admin

User
≠
Member

Member
≠
Employee

Department
≠
Role

Position
≠
Role

Tenant Suspension
≠
User Ban

Employee Termination
≠
User Deletion

Platform Permission
≠
Tenant Permission
```

AI 不得模糊这些概念。

---

# 74. 最终推荐的数据归属

| 数据 | Control DB | Tenant DB |
|---|---:|---:|
| User | ✓ | |
| Account | ✓ | |
| Session | ✓ | |
| Organization | ✓ | |
| Member | ✓ | |
| Invitation | ✓ | |
| OrganizationRole | ✓ | |
| Role Fine-grained Policy | ✓ | |
| Tenant Database Metadata | ✓ | |
| Department | | ✓ |
| Position | | ✓ |
| EmployeeProfile | | ✓ |
| Customer | | ✓ |
| Order | | ✓ |
| Inventory | | ✓ |
| Invoice | | ✓ |

---

# 75. EmployeeProfile 推荐最终模型

概念结构：

```text
EmployeeProfile
────────────────────────

id

userId?              // Control DB 逻辑引用
memberId?            // 当前 Membership，逻辑引用
invitationId?        // Pending Invitation

nameSnapshot
emailSnapshot

employeeNo

departmentId
positionId

managerEmployeeId

jobTitle

status

joinedAt?
terminatedAt?

createdAt
updatedAt
```

其中：

```text
User / Member / Invitation
```

跨数据库只能是：

```text
Logical Reference
```

不能建立 PostgreSQL FK。

---

# 76. 为什么这一版比 memberId 必填更成熟

它同时支持：

```text
员工先录入、后邀请

邀请等待接受

员工暂时没有账号

未来支持非系统员工

离职后保留 Employee

重新入职

历史人员档案
```

所以：

```text
Employee
```

是企业领域实体。

```text
Member
```

只是：

> Employee 当前拥有 SaaS Tenant Access 的一种身份。

这是更清晰的长期模型。

---

# 77. Definition of Done

整个 SaaS Tenant 闭环只有满足以下条件才算完成：

```text
✓ Platform Admin 可以创建 Tenant

✓ Platform Admin 不成为 Tenant Owner

✓ 指定 User 正确成为 Owner

✓ Tenant DB 自动 Provision

✓ Provisioning 可失败重试

✓ Owner 可以激活账号

✓ Owner 可以建立 Admin

✓ Tenant Admin 可以创建部门

✓ Tenant Admin 可以创建岗位

✓ Tenant Admin 可以创建角色

✓ Tenant Admin 可以配置权限

✓ Tenant Admin 可以录入 Employee

✓ Employee 可以处于 INVITED 状态

✓ Invitation 接受后自动绑定 Member

✓ Employee 可以正常登录

✓ Employee 可以切换 Tenant

✓ Role 能正确产生权限

✓ Department 能正确影响数据 Scope

✓ 调部门后权限自动变化

✓ 调角色后权限自动变化

✓ Employee Suspend 只影响当前 Tenant

✓ Employee Termination 不删除 User

✓ Tenant Suspend 不影响用户其他 Tenant

✓ Tenant 删除有完整生命周期

✓ 全流程有 Audit

✓ 所有跨数据库操作幂等可重试
```

---

# 78. 最终一句话架构定义

整个 SaaS 生命周期最终遵循：

> **Platform Admin 负责“开通和管理 SaaS 客户”；Tenant Owner 负责“拥有这个 Tenant”；Tenant Admin 负责“维护自己的企业”；User 负责“全平台登录身份”；Member 负责“这个 User 当前有没有 Tenant 访问身份”；EmployeeProfile 负责“这个人在企业里是什么员工”；Department 和 Position 描述企业组织关系；Role + CASL 描述这个成员能够对哪些业务数据执行哪些操作。**

整个闭环最终是：

```text
平台开公司
    ↓
Owner 接公司
    ↓
Admin 管公司
    ↓
建立组织
    ↓
建立角色
    ↓
录入员工
    ↓
邀请员工
    ↓
建立 Member
    ↓
员工登录
    ↓
Role + Department
    ↓
CASL Authorization
    ↓
业务运行
    ↓
调岗 / 调权
    ↓
离职 / 回收
    ↓
审计留痕
```

这就是本 SaaS Foundation 的 Tenant 全生命周期闭环。