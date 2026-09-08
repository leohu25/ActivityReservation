# 特性背景：【P2】成员邮件邀请与激活绑定流 (p2-tenant-member-invitation-flow)

## 一、 目标与背景

依据《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 36-43 节规范：
在核心业务与基础设置稳定后，作为第三梯队外部协同能力，打通 Better Auth Organization 邀请插件、外部邮件服务与受邀激活自动绑定 EmployeeProfile 的完整流转。

## 二、 详细设计规格 (Specification)

### 1. Better Auth 邀请配置与 `afterAcceptInvitation` Hook (`packages/auth/src/server.ts`)

- 启用 Organization 插件的 `invitation` 模块，配置邮件模板与 SMTP / Resend 发送能力；
- 员工点击邮件激活或注册登录后，触发 `afterAcceptInvitation` Hook：
  - 自动根据 `invitation.id` 或 `invitation.email` 查找对应的 `EmployeeProfile`；
  - 翻转状态为 `ACTIVE`，回填 `memberId` 与 `userId`；
  - 自增 Control DB 的 `authorizationVersion`。

### 2. 界面与交互 (`apps/tenant/src/app/(dashboard)/access/invitations/`)

- 待加入成员列表：展现待激活邮箱、预定角色、邀请人、过期倒计时；
- 操作：重发邮件、撤销取消邀请。

## 三、 验收标准 (DoD)

- 邀请发送、邮件链接点击、注册激活与档案自动绑定全流程打通。
