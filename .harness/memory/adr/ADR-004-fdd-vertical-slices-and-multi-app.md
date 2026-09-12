# 架构决策记录 (ADR 0004)：Turborepo 多应用解耦与 Feature-based Vertical Slice 规范

## 状态

已采纳 (Accepted，2026-09-12 术语修订)

> 文件名中的 `fdd` 为历史路径，正文以本次修订后的术语为准。

## 上下文

项目早期曾将平台运营商管理功能集成在租户应用中，并把业务代码按 `components/`、`lib/services/` 等技术类型分散。这同时造成应用安全边界混淆和业务代码霰弹式分布。

## 决策

1. **Turborepo 多应用解耦**：
   - `apps/tenant`：租户 SaaS ERP 应用，只运行在租户上下文下；
   - `apps/control`：平台运营商总控应用，负责跨租户生命周期和 Control DB 能力；
   - `apps/*` 是 Composition Root，App Router 页面与布局负责路由、Provider、权限快照和业务模块装配。
2. **Feature-based Vertical Slice 业务模块**：
   - `packages/features/*` 沿业务方向组织 Business Area / Feature Group；
   - Business Area 内按 Feature、Sub-Feature 和 Use Case 内聚 Contract、Types、Service、Query、mutation Action、UI 与测试；
   - Server Component 读取使用 server-only Query，Client mutation 使用 Server Action；
   - 包通过 `package.json#exports` 暴露业务语义 API，禁止跨包穿透内部文件。
3. **Horizontal Shared / Platform Modules**：
   - `auth`、`authorization`、`db-control`、`db-tenant`、`ui`、`shared` 与 `biz-shared` 横向提供稳定基础能力；
   - Feature Package 之间禁止直接依赖，横向基础模块禁止反向依赖具体业务 Feature；多 Feature 组合位于应用装配层。
4. **Feature-Driven 开发治理**：FDD 用于业务分析、Feature List、任务拆解与按 Feature 验收，不作为代码架构名称。
5. **Selective DDD**：只有复杂业务不变量、状态机、事务一致性边界或领域计算出现时，才在对应 Feature 内按需使用 DDD。

## 影响与后果

- Tenant 与 Control 的部署、会话和数据库边界保持清晰；
- 同一业务能力的代码就近共存，减少跨技术目录跳转；
- 简单业务保持轻量，复杂领域仍保留演进为 DDD 模型的能力。
