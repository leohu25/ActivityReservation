# 特性上下文：租户组织人事模型与四层权限底层对齐 (foundation-tenant-rbac-core)

## 业务背景与架构动机

对照 `docs/SaaS Foundation 权限系统完整设计方案.md`，为解决当前系统与工业级 SaaS 权限规范的 4 项核心出入，本特性旨在夯实权限底层基石：

1. 在租户物理库建立 `EmployeeProfile` 员工档案模型，关联 `memberId` 与租户内 `Department`，实现登录用户部门拓扑（UserDepartmentTopology）自驱装配，消除测试与业务页面中的硬编码拓扑。
2. 升级 `PermissionCatalog`，支持业务模块自描述 Action 级别或 Subject 级别的可用数据范围 (`scopes`) 与敏感字段 (`fields`)，为后续权限管理 UI 的动态渲染提供元数据自描述来源（文档第 19 节）。
3. 扩展 Control DB `OrganizationRole` 存储契约与 `CaslAbilityFactory`，支持解析持久化包含 Actions + Data Scopes + Fields 的完整四层角色配置，并保证向后兼容老格式。
4. 封装全自动感应 CASL Ability 的 `<AuthorizedField>` 表单字段三态组件，自动推导 HIDDEN、READONLY、EDITABLE 状态（文档第 31 节）。
