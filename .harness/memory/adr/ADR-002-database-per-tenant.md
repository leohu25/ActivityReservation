# 架构决策记录 (ADR 0002)：采用 PostgreSQL Database-per-Tenant 数据隔离

## 状态

已采纳 (Accepted)

## 上下文

B2B 企业 ERP 系统对客户数据安全、隔离性和合规性要求极高。共享数据库 + `tenant_id` 字段过滤的方案极易因手写 SQL 或 ORM 遗漏导致数据跨租户泄露。

## 决策

采用 Azure 推荐的 Shared Application + Dedicated Database per Tenant 模式：

1. `saas_control`：控制平面库，负责用户、全局租户账本、租户数据库映射及迁移版本记录。
2. `tenant_xxxxx`：各租户专属业务数据库，包含组织、角色权限与业务表。
3. 应用层通过 `TenantDbManager` 结合当前上下文动态路由连接，严禁客户端传入直连串。

## 影响与后果

- 数据实现物理隔离，根本上杜绝跨租户越权。
- 数据库 Schema 升级需通过 `@chenrun/db-migrate` 统一引擎逐一执行幂等迁移，新租户开通直接应用全量版本化基线。
