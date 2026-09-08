# 特性背景：租户管理员角色与四层权限配置中心 (foundation-tenant-rbac-ui)

## 一、 目标

提供租户内部的专属管理员权限配置控制台（Tenant Role & Permission Config Center），使租户管理员可以通过直观的可视化界面，针对不同角色勾选配置功能权限（Actions）、数据范围（Data Scope）与字段策略（HIDDEN/READONLY/EDITABLE），并保存至数据库生效。

## 二、 范围内能力

1. 角色管理视图：租户管理员创建新角色（如采购经理、审核员、普通采购员）。
2. 四层权限可视化勾选器：
   - 第一层：操作按钮勾选（`read`, `create`, `update`, `audit` 等）。
   - 第二层：数据范围下拉（本人 `SELF`、本部门 `DEPT`、部门树 `DEPT_TREE`、自定义部门 `CUSTOM`、全部 `ALL`）。
   - 第三层：敏感字段三态单选（如成本价字段：隐藏、只读、可写）。
3. 真实持久化与生效：写入 `saas_control` 库的 `OrganizationRole` 表，驱动 CASL Ability Factory 动态鉴权，彻底消除硬编码与静态死数据。

## 三、 明确不做

- 跨租户数据开通与运维（交由 `foundation-platform-admin`）。
- 具体采购订单数据存储（交由 `procurement-center`）。
