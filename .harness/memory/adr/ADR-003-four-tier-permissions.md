# 架构决策记录 (ADR 0003)：四层权限模型与 Code-as-Config 编译器

## 状态

已采纳 (Accepted)

## 上下文

企业 ERP 权限不仅包含“能不能做”（RBAC），还深度包含“能看哪些部门的数据”（Data Scope）、“能看/改哪些敏感字段”（Field Policy）以及“业务状态是否允许”（Business Policy）。若不从第一天做对，后续重构代价极大。

## 决策

1. 确立四层权限架构：RBAC -> Data Scope -> Field Policy -> Business Policy。
2. 权限定义采用 Code-as-Config 模式：在各 Feature 的 `permissions.ts` 中声明，通过 Permission Compiler 校验并生成类型安全常量 `P.*` 与 `F.*`。
3. 服务端采用 Decorator 风格注解（`@RequirePermission`, `@Audit`），前端采用声明式组件 `<Can>` 和 `<PermissionField>`。

## 影响与后果

- 杜绝手写魔术字符串权限码导致的错漏。
- 前后端权限码 100% 统一，可自然平滑扩展至未来 MCP 智能体访问。
