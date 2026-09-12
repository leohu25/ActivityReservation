# arch-infra-packages-refactor: 基础设施四大核心包工程化治理与模块自解释沉淀

## 1. 业务与架构背景

辰润 ERP 拥有四大核心基础设施包：

- `@base/auth` (多租户认证与上下文核心)
- `@base/authorization` (四层细粒度权限判定核心)
- `@base/db-control` (多租户管控面与拓扑元数据事实源)
- `@base/db-tenant` (多租户数据面物理库连接池与组织业务地基)

在架构设计上：

- `auth` 与 `authorization` 职责正交（Who vs What），保持单向解耦；
- `db-control` 与 `db-tenant` 严格遵从 ADR-002 物理隔离红线（Control Plane vs Data Plane），独立维护。

## 2. 改造目标与工程化规范

1. **零外部破坏性破坏 (Zero Breaking Changes)**：
   - 所有包对外 `package.json` 的 `exports` 规范与导出符号保持 100% 稳定兼容。
   - 所有外部业务包（`apps/*`, `packages/features/*`, `tooling/*`）无感知，单测与类型检查一次性通过。
2. **内聚与分层 (Cohesion & Layering)**：
   - `@base/db-control`: 拆分为 `contracts/`、`repositories/`、`prisma/`、`cli/`。
   - `@base/db-tenant`: 拆分为 `pool/`、`migration/`、`topology/`、`seed/`。
   - `@base/authorization`: 拆分为 `core/`、`scopes/`、`fields/`、`ability/`、`adapters/`。
   - `@base/auth`: 拆分为 `server/`、`context/`、`client/`。
3. **模块自解释与设计资产沉淀**：
   - 在每个重构后的包根目录下，编写详尽的 `README.md`，涵盖：包定位、架构分层、对外导出与核心 API 示例、关键安全红线、测试命令。
4. **多智能体执行与审计**：
   - 分步重构与验证；
   - 最终由 `reviewer` 子智能体进行独立审计与全栈门禁验证。
