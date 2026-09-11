# SaaS 租户后台产品结构与组织权限模型定义

## 1. 文档目标

本文档用于定义 SaaS 系统中：

> **某一个 Tenant（租户）进入自己的管理后台后，到底应该拥有哪些基础管理功能。**

本文档主要解决：

```text
租户后台有哪些功能？
员工怎么管理？
部门怎么管理？
岗位怎么管理？
角色怎么管理？
员工和登录用户是什么关系？
Member 又是什么？
哪些数据属于平台？
哪些数据属于 Tenant？
哪些数据属于员工档案？
```

本文档属于：

> Tenant Administration Product Specification  
> 租户后台产品结构规范

不重点描述具体代码实现。

---

# 2. SaaS 中三个最容易混淆的“用户”

整个系统必须明确区分：

```text
User

Member

EmployeeProfile
```

这三个不是一回事。

---

# 3. User：全局登录身份

User 表示：

> **这个人是谁，以及他如何登录 SaaS。**

例如：

```text
User

id        U001
name      张三
email     zhangsan@example.com
```

User 属于：

```text
平台 Identity Layer
```

由：

```text
Better Auth
```

统一管理。

User 主要包含：

```text
姓名
邮箱
头像
邮箱验证状态

登录 Account
OAuth Account

Session
```

例如：

```text
张三
├── 邮箱密码登录
├── Google OAuth
└── 当前 Session
```

---

# 4. User 不属于某一个 Tenant

这是一个非常重要的原则。

不要设计：

```text
User
↓
固定属于宸润公司
```

因为同一个 User 可以加入多个 Tenant。

例如：

```text
                User 张三
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    宸润公司                 ABC食品
   sales_manager              admin
```

所以：

> User 是全平台身份。

---

# 5. Member：Tenant 中的成员身份

Member 表示：

> **这个 User 在某一个 Tenant 里面是什么身份。**

例如：

```text
User
U001 张三

        ↓

Member
────────────────
id              M001
userId          U001
organizationId  T001
roles           sales_manager
```

意思是：

> 张三这个全局用户，在 T001 公司里，是销售经理角色。

---

# 6. 一个 User 可以拥有多个 Member

例如：

```text
User U001
张三
│
├── Member M001
│   Tenant = 宸润公司
│   Role = sales_manager
│
└── Member M900
    Tenant = ABC食品
    Role = admin
```

因此：

```text
User
≠
Member
```

可以简单记成：

> User = 这个人是谁。

> Member = 这个人在这家公司是谁。

---

# 7. EmployeeProfile：企业内部员工档案

EmployeeProfile 再进一步表示：

> **这个 Member 在当前 Tenant 内部的企业业务资料。**

例如：

```text
EmployeeProfile
──────────────────
memberId       M001

employeeNo     CR001

department     销售部
position       销售经理

manager        王总

jobTitle       华东销售经理

status         ACTIVE
```

因此：

```text
User
↓
登录身份

Member
↓
Tenant 身份

EmployeeProfile
↓
企业员工档案
```

---

# 8. 三层完整关系

整个模型：

```text
                User
           全局登录身份
                 │
                 │
           Better Auth
                 │
                 ↓
               Member
          Tenant 成员身份
                 │
       ┌─────────┴─────────┐
       ↓                   ↓
     Roles           EmployeeProfile
     权限身份            员工档案
                           │
                ┌──────────┼──────────┐
                ↓          ↓          ↓
            Department   Position   Manager
              部门         岗位       上级
```

---

# 9. 为什么要分成三层

如果全部塞进 User：

```text
User
├── email
├── password
├── department
├── role
├── employeeNo
├── position
└── manager
```

会立即出现问题。

假设张三属于两家公司：

```text
A 公司
部门 = 销售部

B 公司
部门 = 技术部
```

那么：

```text
User.department
```

到底是什么？

无法表达。

因此：

```text
User
→ 全局

Member
→ Tenant 维度

EmployeeProfile
→ Tenant 内员工维度
```

必须分开。

---

# 10. 三层数据分别放在哪里

## Control DB

平台控制数据库：

```text
User
Account
Session

Organization
Member
Role
Invitation
```

负责：

```text
登录
认证
Tenant
Membership
Role
```

---

## Tenant DB

企业自己的业务数据库：

```text
EmployeeProfile
Department
Position

Customer
Order
Inventory
...
```

负责：

```text
组织架构
员工业务资料
企业业务数据
```

---

# 11. 数据归属一览表

| 数据 | 所属层 | 存储位置 |
|---|---|---|
| 登录邮箱 | User | Control DB |
| 登录密码 / Account | User | Control DB |
| OAuth | User | Control DB |
| Session | User | Control DB |
| 所属 Tenant | Member | Control DB |
| Tenant Role | Member / Role | Control DB |
| Tenant Invitation | Member | Control DB |
| 工号 | EmployeeProfile | Tenant DB |
| 部门 | EmployeeProfile | Tenant DB |
| 岗位 | EmployeeProfile | Tenant DB |
| 直属领导 | EmployeeProfile | Tenant DB |
| 员工状态 | EmployeeProfile | Tenant DB |
| 客户 | Tenant Business | Tenant DB |
| 订单 | Tenant Business | Tenant DB |
| 商品 | Tenant Business | Tenant DB |
| 库存 | Tenant Business | Tenant DB |

---

# 12. 租户后台整体产品结构

推荐将 Tenant Admin 划分为：

```text
租户后台
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
│   ├── 待加入成员
│   └── 登录与访问状态
│
├── 企业设置
│   ├── 企业信息
│   ├── 企业 Logo
│   ├── 基础配置
│   └── 安全设置
│
└── 审计与安全
    ├── 操作日志
    ├── 登录日志
    └── 权限变更日志
```

---

# 13. 第一大模块：组织架构

组织架构负责：

```text
人在哪里
人是什么岗位
人向谁汇报
```

包括：

```text
员工
部门
岗位
```

它不负责：

```text
用户能执行什么系统权限
```

那是角色管理负责。

---

# 14. 员工管理

员工管理应该是 Tenant 管理员最常用的基础功能之一。

页面：

```text
员工管理
```

员工列表例如：

| 姓名 | 工号 | 部门 | 岗位 | 角色 | 状态 |
|---|---|---|---|---|---|
| 张三 | E001 | 销售部 | 销售经理 | 销售经理 | 在职 |
| 李四 | E002 | 销售部 | 销售 | 销售 | 在职 |
| 王五 | E003 | 财务部 | 会计 | 财务 | 在职 |

---

# 15. 员工详情

员工详情建议划分为几个区块。

## 基础身份

```text
姓名
头像
邮箱
手机号
```

其中部分信息来自：

```text
User
```

---

## 企业员工信息

```text
工号
部门
岗位
职务
直属上级
状态
入职时间
```

来自：

```text
EmployeeProfile
```

---

## 系统访问身份

```text
Tenant Member
角色
账号状态
邀请状态
```

来自：

```text
Member + Role
```

---

# 16. 员工详情页面应该明确分组

例如：

```text
张三

【登录身份】
邮箱
手机号
账号状态

【企业信息】
工号
部门
岗位
直属领导
员工状态

【系统权限】
角色
销售经理
数据范围等

【安全】
最近登录
Session
访问状态
```

不要把所有数据平铺在一起。

---

# 17. 员工管理常用操作

建议支持：

```text
新增员工
邀请员工
编辑员工
分配部门
调整部门
分配岗位
调整岗位
设置直属领导
分配角色
调整角色
停用员工
恢复员工
移除 Tenant
```

---

# 18. 新增员工和邀请用户要区分

Tenant 管理员点击：

```text
新增员工
```

可能存在两个场景。

---

## 场景 A：这个人已经有 SaaS 账号

例如：

```text
zhangsan@example.com
```

已经存在 User。

则：

```text
Existing User
      ↓
创建 Member
      ↓
创建 EmployeeProfile
```

不会创建第二个 User。

---

## 场景 B：这个人还没有账号

则：

```text
发送 Invitation
      ↓
用户注册 / 登录
      ↓
创建 / 找到 User
      ↓
创建 Member
      ↓
创建 EmployeeProfile
```

这部分 Better Auth Organization Invitation 可以参与。

---

# 19. 员工停用和账号停用不是一回事

例如：

```text
张三从宸润公司离职
```

应该：

```text
Tenant A Member
→ 停用 / 移除

EmployeeProfile
→ 离职
```

但：

```text
Global User
```

不一定删除。

因为张三可能仍然属于：

```text
Tenant B
```

因此：

> Tenant 管理员不能随意删除全局 User。

---

# 20. 部门管理

部门管理负责建立企业组织结构。

例如：

```text
宸润公司
│
├── 总经办
│
├── 销售中心
│   ├── 华东销售部
│   │   ├── 宁波组
│   │   └── 杭州组
│   └── 华南销售部
│
├── 财务部
└── 技术部
```

建议采用：

```text
树形 UI
```

---

# 21. Department 基础字段

```text
Department
────────────────
id
parentId

name
code

leaderMemberId

sort
status
```

---

# 22. 部门管理功能

至少支持：

```text
新增部门
编辑部门
删除部门
移动部门
调整父级
排序

设置部门负责人

启用
停用

查看部门员工
```

---

# 23. 删除部门规则

不能直接：

```text
DELETE department
```

如果部门还有员工：

```text
应禁止删除
```

或者要求：

```text
先迁移员工
```

如果还有子部门：

```text
应禁止删除
```

或者明确选择：

```text
迁移子部门
```

默认应该：

> Fail Closed。

---

# 24. 部门与权限的关系

Department 本身不是权限。

不要：

```text
销售部
=
某种 Role
```

正确模型：

```text
Department
→ 人在哪里

Role
→ 人能干什么
```

CASL Scope 才把两者连接起来。

例如：

```text
Role:
sales_manager

Order.read
scope = department
```

张三的：

```text
Department = 华东销售部
```

最终：

> 张三只能查看华东销售部的数据。

---

# 25. 岗位管理

岗位用于表达：

> 员工在组织里承担什么职位。

例如：

```text
销售经理
销售专员
财务主管
会计
仓库主管
仓库员
技术负责人
开发工程师
```

---

# 26. Position 基础字段

```text
Position
────────────
id
name
code
description
sort
status
```

---

# 27. 岗位 != 角色

这是必须明确的设计原则。

例如：

```text
岗位：
销售经理
```

可能对应角色：

```text
sales_manager
customer_exporter
```

另一个销售经理可能暂时没有：

```text
customer_exporter
```

所以：

```text
Position
≠
Role
```

---

# 28. 可以支持岗位默认角色，但不要强绑定

以后可以提供：

```text
岗位：销售经理

默认角色：
├── sales_manager
└── customer_viewer
```

新增员工时自动推荐。

但建议：

```text
Role 仍然允许人工调整
```

不要：

```text
岗位 = 角色
```

硬编码。

---

# 29. 第二大模块：权限管理

权限管理负责：

> **员工可以在 SaaS 中做什么。**

主要包括：

```text
角色管理
权限配置
```

---

# 30. 角色管理

角色列表：

```text
Owner
Admin

销售经理
销售
财务
仓库主管
仓库员
```

---

# 31. 角色基础信息

例如：

```text
角色名称
销售经理

角色编码
sales_manager

描述
销售团队管理人员

状态
启用
```

---

# 32. 角色权限

角色权限采用统一模型：

```text
Subject
+
Action
+
Scope
+
Fields
```

例如：

```text
Order

read
scope = department

update
scope = department
fields = status,remark

export
scope = department
fields = orderNo,amount,status
```

---

# 33. 角色管理页面

推荐：

```text
销售经理

基础信息
────────────────

角色名称
角色编码
角色说明


功能权限
────────────────

订单管理
☑ 查看
☑ 新增
☑ 修改
☐ 删除
☑ 导出


数据范围
────────────────

查看订单

○ 本人
● 本部门
○ 本部门及下级
○ 全部


字段权限
────────────────

             查看  新增  修改  导出

金额          ☑    ☑    ☐    ☑
状态          ☑    ☐    ☑    ☑
备注          ☑    ☑    ☑    ☐
成本价        ☐    ☐    ☐    ☐
```

---

# 34. 权限配置不要按页面设计

禁止：

```text
订单页面权限
客户页面权限
库存页面权限
```

作为核心授权模型。

正确：

```text
Order.read
Order.create
Order.update
```

页面只消费这些权限。

---

# 35. 权限与 UI 的关系

例如：

```text
Order.read
```

可以控制：

```text
订单菜单显示
订单页面访问
订单列表 API
```

---

```text
Order.create
```

可以控制：

```text
新增订单按钮
创建订单 API
```

---

```text
Order.update
```

可以控制：

```text
编辑按钮
编辑表单
Update API
```

---

# 36. 第三大模块：成员与访问

这一块与“员工管理”有部分关系，但产品上建议单独体现身份访问。

主要管理：

```text
谁拥有 Tenant 访问资格
```

而不是：

```text
企业内部的人事档案
```

---

# 37. 成员邀请

支持：

```text
输入邮箱
选择初始角色
选择部门
选择岗位
发送邀请
```

邀请流程：

```text
Invitation
     ↓
用户接受
     ↓
User
     ↓
Member
     ↓
EmployeeProfile
```

---

# 38. 待加入成员

列表：

```text
邮箱
邀请角色
邀请人
邀请时间
过期时间
状态
```

操作：

```text
重新发送
取消邀请
```

---

# 39. 登录访问状态

Tenant Admin 可以看到：

```text
成员是否激活
是否允许登录当前 Tenant
最后登录时间
```

但不能直接管理：

```text
其他 Tenant 的 Membership
```

---

# 40. 第四大模块：企业设置

企业设置属于 Tenant 自己。

例如：

```text
企业名称
企业 Logo
简称
企业编码
联系电话
企业地址
时区
语言
默认货币
```

这类 Tenant Metadata 可以根据架构决定：

```text
Control DB Organization additionalFields
```

或者 Tenant DB CompanyProfile。

---

# 41. 建议区分 Organization 与 CompanyProfile

Organization：

```text
Tenant Registry
```

保存平台必须知道的信息：

```text
id
name
slug
logo
status
```

---

CompanyProfile：

保存企业自己的扩展业务资料：

```text
统一社会信用代码
企业地址
联系人
业务配置
发票信息
```

可以放 Tenant DB。

---

# 42. 第五大模块：审计与安全

成熟 SaaS Foundation 建议至少预留：

```text
操作日志
登录日志
权限变更日志
```

---

# 43. 操作日志

记录：

```text
谁
什么时候
执行什么操作
操作什么资源
结果是什么
```

例如：

```text
张三
2026-09-08 14:30

修改订单
ORDER-1001

SUCCESS
```

---

# 44. 权限变更日志

特别重要。

例如：

```text
李管理员

将张三角色：

sales
→
sales_manager
```

记录：

```text
操作者
目标 Member
旧 Role
新 Role
时间
Tenant
```

---

# 45. Tenant Admin 应该能管理什么

Tenant Admin 可以管理：

```text
本 Tenant 员工
本 Tenant 部门
本 Tenant 岗位
本 Tenant Role
本 Tenant Permission
本 Tenant Invitation
本 Tenant 企业设置
```

---

# 46. Tenant Admin 不应该能管理什么

Tenant Admin 不应该：

```text
删除全平台 User

修改用户在其他 Tenant 的角色

查看其他 Tenant 数据

查看平台超级管理员

修改平台级配置

修改其他 Tenant Membership
```

---

# 47. 平台管理员和 Tenant Admin 的区别

平台管理员：

```text
管理整个 SaaS 平台
```

例如：

```text
Tenant
套餐
计费
平台配置
平台用户风险
运营
```

Tenant Admin：

```text
管理自己公司
```

例如：

```text
员工
部门
岗位
角色
权限
企业设置
```

---

# 48. 推荐租户后台导航

最终推荐：

```text
首页 / 工作台

业务模块
├── ...

系统管理
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
│   ├── 企业信息
│   ├── 基础设置
│   └── 安全设置
│
└── 审计日志
    ├── 操作日志
    ├── 登录日志
    └── 权限变更日志
```

---

# 49. Employee 与 Member 的产品界面关系

虽然底层：

```text
Member
+
EmployeeProfile
```

是两个对象。

但在产品页面里，可以统一呈现为：

```text
员工
```

例如：

```text
员工：张三

账号
────────
邮箱
登录状态

企业身份
────────
工号
部门
岗位
直属上级

权限身份
────────
角色
权限
```

管理员不需要知道底层：

```text
这是 Control DB
那个是 Tenant DB
```

这是系统内部实现细节。

---

# 50. 推荐员工创建流程

Tenant Admin：

```text
新增员工
```

填写：

```text
姓名
邮箱

部门
岗位

角色
```

然后系统：

```text
检查 User 是否存在
        ↓
存在？
├── 是 → 复用 User
│
└── 否 → 创建邀请
        ↓
创建 Member
        ↓
创建 EmployeeProfile
        ↓
绑定 Department
        ↓
绑定 Position
        ↓
分配 Role
```

---

# 51. 推荐员工编辑流程

修改：

```text
部门
岗位
角色
直属领导
员工状态
```

分别修改对应领域：

```text
角色
→ Member / Role

部门岗位
→ EmployeeProfile

登录身份
→ User

Tenant Access
→ Member Status
```

不要一个 Repository 把所有东西混起来改。

---

# 52. 员工离职流程

建议：

```text
员工状态
ACTIVE
↓
TERMINATED
```

然后：

```text
禁止当前 Tenant Access
↓
移除 / 禁用 Member
↓
保留 EmployeeProfile 历史
↓
保留订单 / 审计引用
```

不要硬删除所有员工历史数据。

---

# 53. 业务数据引用 Member，而不是 User

例如订单：

```text
ownerMemberId
createdByMemberId
approvedByMemberId
```

而不是：

```text
ownerUserId
```

原因：

> 业务行为发生在 Tenant Context 下。

---

# 54. 部门数据也使用 Member 作为人员引用

例如：

```text
Department.leaderMemberId
```

而不是：

```text
leaderUserId
```

因为：

> 部门负责人是这个 Tenant 的成员，不是一个抽象全局 User。

---

# 55. Manager 也是 Member

例如：

```text
EmployeeProfile.managerMemberId
```

而不是：

```text
managerUserId
```

---

# 56. 完整员工组织关系

```text
                    User
                  张三 U001
                      │
                      ↓
                   Member
                  M001 / T001
                      │
             ┌────────┴────────┐
             ↓                 ↓
          Roles        EmployeeProfile
     sales_manager          │
                            ├── employeeNo
                            ├── department
                            ├── position
                            └── manager
```

---

# 57. Role 和 Department 最终怎么参与 CASL

例如：

```text
张三

Member:
M001

Role:
sales_manager

Department:
D100
```

角色策略：

```text
Order.read
scope = department
```

最终：

```text
CASL

can read Order
WHERE departmentId = D100
```

---

# 58. 员工换角色

例如：

```text
sales
→
sales_manager
```

Department 不变：

```text
销售部
```

权限扩大：

```text
本人数据
→
部门数据
```

---

# 59. 员工换部门

例如：

```text
销售一部
→
销售二部
```

Role 不变：

```text
sales_manager
```

但：

```text
scope = department
```

自动变成：

```text
销售二部数据
```

这就是 Role 与 Department 分开的价值。

---

# 60. 员工换岗位

例如：

```text
销售专员
→
高级销售
```

如果 Role 没变：

```text
权限可以完全不变
```

这也说明：

```text
Position
≠
Permission
```

---

# 61. 产品概念最终定义

## User

> SaaS 全局登录身份。

---

## Organization / Tenant

> 一个 SaaS 客户企业。

---

## Member

> User 在某 Tenant 中的访问与成员身份。

---

## EmployeeProfile

> Member 在企业内部的员工档案。

---

## Department

> 企业组织结构。

---

## Position

> 企业岗位 / 职位。

---

## Role

> 系统权限身份。

---

## Permission

> Role 能对什么业务资源执行什么操作。

---

# 62. 最终产品模型

```text
                        SaaS Platform
                             │
                           User
                             │
                       Membership
                             │
                             ↓
                           Tenant
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
          Organization    Authorization    Settings
              │              │
      ┌───────┼───────┐      ↓
      ↓       ↓       ↓     Role
 Employee Department Position │
      │                       ↓
      │                   Permission
      │                       │
      └──────────────┬────────┘
                     ↓
              AuthorizationContext
                     ↓
                    CASL
```

---

# 63. 租户后台 MVP 必须具备

基础 SaaS Foundation 至少应该实现：

```text
✓ 员工管理

✓ 部门管理

✓ 岗位管理

✓ 角色管理

✓ 角色权限配置

✓ 成员邀请

✓ Tenant 企业信息

✓ 基础审计日志
```

---

# 64. 后续增强能力

第二阶段可以增加：

```text
岗位默认角色

批量导入员工

批量调部门

组织树拖拽

员工兼任多个部门

临时角色

角色有效期

数据权限委托

代理人 / 代办

SSO

SCIM

审批流程

高级审计
```

这些不需要 V1 一次做完。

---

# 65. 最终导航建议

最终租户后台推荐：

```text
工作台

业务中心
└── 各 Feature

系统管理
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
│   ├── 企业信息
│   └── 安全设置
│
└── 审计日志
```

---

# 66. 最终一句话定义

整个租户后台遵循：

> **User 管“这个人是谁以及怎么登录”；Member 管“这个人能不能进入当前 Tenant、在 Tenant 中是什么成员”；EmployeeProfile 管“这个人在企业里属于哪个部门、岗位、领导关系和员工档案”；Role 管“这个人拥有哪些系统权限”；Department 管“人属于哪里”；Position 管“人在组织里承担什么岗位”。**

最终：

```text
User
= 登录身份

Member
= Tenant 身份

Employee
= 企业身份

Department
= 组织归属

Position
= 工作岗位

Role
= 权限身份
```

这六个概念必须始终保持边界清晰。