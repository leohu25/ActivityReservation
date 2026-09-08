# 换手交接单：【P0】组织架构中心：部门树维护、岗位字典与直接录入建号 (p0-tenant-org-management)

## 状态总览

- 当前状态: COMPLETED (实现与全栈门禁均已通过)
- 负责人: @implementer -> @coordinator
- 前置依赖: `p0-tenant-navigation-and-settings` (已就绪)
- 后续承接特性: `p0-tenant-workbench-real-topology` (工作台真实拓扑装配与访问门禁)

## 交付物清单

1. 领域服务层 (`packages/features/tenant-admin/src/services/`)：
   - `DepartmentService`：递归组织树、防环换上级、Fail-Closed 删除保护；
   - `PositionService`：岗位字典 CRUD、状态切换、删除保护；
   - `EmployeeManagementService`：部门树级联联动筛选、直接录入建号（原子生成 User/Member/EmployeeProfile）、调岗、调部门（自增版本号）、调角色（自增版本号）、停用/恢复（自增版本号）。
2. 单测套件：
   - `org-management-services.test.ts`：覆盖防环、删除保护、直接建号、调动流与版本号递增。全仓 9 套件 96/96 单测 100% 通过。
3. 交互组件层 (`packages/features/tenant-admin/src/components/`)：
   - `DepartmentView`：递归树状展开折叠、新增子部门、换上级、删除确认；
   - `PositionView`：岗位字典表格、新增/编辑岗位模态框、启停开关；
   - `EmployeeView`：左侧部门树级联下推筛选、直接新增员工表单弹窗、调部门/调岗/调角色弹窗、停用/恢复按钮。
4. Server Actions 与路由装配：
   - `packages/features/tenant-admin/src/actions.ts` 完整封装各类操作并严格执行 `requireTenantAdminSession` 守卫；
   - 挂载路由：`/organization/departments`、`/organization/positions`、`/organization/employees`。

## 移交至下阶段注意事项

下一特性 `p0-tenant-workbench-real-topology` 需要：

1. 废除 `/workbench` 中写死的 `dept_procurement_east` 静态数据，接入 `resolveEmployeeTopology` 从租户物理库自驱组装；
2. 接入 `assertEmployeeActive` 门禁，对状态为 `SUSPENDED` / `TERMINATED` 的员工进行即时阻断拦截。
