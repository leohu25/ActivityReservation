# 架构决策记录 (ADR 0003)：成熟框架版四层权限架构 (Better Auth + CASL)

## 状态

已采纳 (Accepted) - 升级自原自研编译器方案

## 上下文

企业 ERP 权限不仅包含“能不能做”（RBAC），还深度包含“能看哪些部门的数据”（Data Scope）、“能看/改哪些敏感字段”（Field Policy）以及“业务状态是否允许”（Business Policy）。
原规划自研 Permission Compiler、自定义 Registry 与自研 Data Scope 引擎，不仅存在重复造轮子风险，且与现代前端及 ORM 生态割裂。

## 决策

1. **核心选型升级**：放弃自研权限编译器与自定义授权引擎，全面拥抱成熟开源标准：
   - **Better Auth + Organization Plugin**：负责认证、租户上下文（Organization）、成员管理（Member）、动态角色（Dynamic Roles）与功能权限目录（`createAccessControl(statement)`）。
   - **CASL**：负责四层模型中的核心授权（Action + Subject + Conditions + Fields），通过 `@casl/react` 驱动前端组件，通过 `@casl/prisma` 驱动数据范围直接下推到 Prisma `where` 查询。
2. **薄适配层定位**：团队仅编写 6 块 ERP 特性适配代码：
   - `Tenant -> Database Mapping`（租户动态数据库路由）
   - `Role Data Scope Config`（`role_data_scope`：SELF, DEPT, DEPT_TREE, CUSTOM, ALL）
   - `Role Field Config`（`role_field_policy`：HIDDEN, READONLY, EDITABLE）
   - `Ability Factory`（将 Better Auth 动态角色与 ERP 数据/字段配置编译为 CASL Ability）
   - 服务端 `@RequireAbility(action, subject)` Decorator 适配
   - 多租户数据库迁移执行器
3. **ORM 选型对齐**：采用 **Prisma 7.x** 作为稳健兼容基线。

## 影响与后果

- 代码量大幅缩减 70%，底层核心授权算法交由成熟库维护。
- 数据范围权限（Data Scope）直接通过 `@casl/prisma` 下推成 SQL 过滤，杜绝内存中漏滤和安全穿透。
- 前后端权限思想完全统一，未来可无缝平滑扩展至 MCP 智能体访问与多服务集中授权。
