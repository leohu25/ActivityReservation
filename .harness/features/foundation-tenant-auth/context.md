# 特性背景：多租户与身份认证底座 (foundation-tenant-auth)

## 一、 目标

基于 Better Auth、Organization 插件与 Prisma 7 建立 `saas_control` 身份/租户控制面；将 Better Auth Organization 等同于 Tenant，并基于认证 Session 的 `activeOrganizationId`、有效 Member 与 `TenantDatabase` 映射安全路由到独立租户数据库。

## 二、 范围内能力

1. Better Auth 邮箱密码认证、Prisma adapter、Organization 插件与 Next.js App Router Handler。
2. Control DB Prisma Schema：Better Auth 核心模型、Organization/Member/Invitation，以及 `TenantDatabase` 映射。
3. Tenant Context：拒绝未认证、无激活 Organization、非成员、禁用/缺失数据库映射。
4. Tenant DB Manager：经 `secretRef` 解析连接信息，按 Organization 隔离并缓存客户端，支持淘汰与统一关闭。
5. 自动化测试覆盖上述拒绝路径、缓存隔离和资源释放。

## 三、 明确不做

- 动态角色、功能权限与 CASL Ability Factory（下一特性 `foundation-authorization`）。
- 数据范围与字段权限（`foundation-advanced-authz`）。
- 租户数据库迁移 CLI（`foundation-migration`）。
- 真实业务表与采购订单页面。

## 四、 安全事实

- `Organization = Tenant`，不得新建重复 Tenant/Membership 身份模型。
- 租户选择唯一可信来源为服务端认证 Session 的 `activeOrganizationId`。
- 必须验证当前用户属于该 Organization。
- Control DB 仅保存 `secretRef`，连接信息由受信任 Secret Resolver 获取。
- 不允许默认租户、客户端直传连接串或字符串拼接数据库 URL。
