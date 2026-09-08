# 特性背景：【P0】组织架构中心：部门树维护、岗位字典与直接录入建号 (p0-tenant-org-management)

## 一、 目标与背景

依据《SaaS 租户后台产品结构与组织权限模型定义》第 14-28 节及《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 32-35、45-48、52-54 节规范：
在租户端实现完整的组织架构管理模块，覆盖部门树形管理、岗位字典维护以及**直接录入建号模式的员工档案与生命周期管理**。

必须彻底贯彻以下三大约束：

1. **Position != Role（岗位不等于角色）**：岗位表达职务，角色表达权限。岗位支持推荐默认角色，但严禁强编码绑定。
2. **直接录入建号（免邮件闭环）**：管理员录入员工姓名、邮箱、工号、选部门、选岗位、选角色、设密码后，系统直接在 Control DB 创建/关联 User、当前租户 Member，在 Tenant DB 创建在职 EmployeeProfile（状态直接为 `ACTIVE`），员工可立即登录。
3. **Fail-Closed 部门删除保护与防环检测**：调换部门父节点时严格防环；存在未迁移子部门或在职员工时禁止物理删除部门。

## 二、 详细设计规格 (Specification)

### 1. 部门管理 (`apps/tenant/src/app/(dashboard)/organization/departments/`)

- **服务契约 (`DepartmentService`)**：
  - `listDepartmentTree()`：递归树状拓扑，带子节点、人员计数与部门负责人；
  - `createDepartment(input)`：新建部门（支持指定父部门、名称、编码、主管、同级排序）；
  - `updateDepartment(id, input)`：编辑部门，**支持调换父级节点并执行严格防环检查**；
  - `deleteDepartment(id)`：Fail-Closed 保护！存在在职员工或子部门时抛错拦截。
- **页面交互**：树形目录可视化展示、展开/折叠、添加子部门弹窗、编辑抽屉、删除安全确认。

### 2. 岗位管理 (`apps/tenant/src/app/(dashboard)/organization/positions/`)

- **服务契约 (`PositionService`)**：
  - 岗位 CRUD：岗位名称、岗位编码、职责说明、排序号、启用/停用状态；
  - 推荐默认角色（`defaultRoleCodes: string[]`）：可选配置，在录入员工选定岗位时代出角色推荐。
- **页面交互**：岗位列表表格、新建/编辑岗位模态框、状态快速启停开关。

### 3. 员工管理 (`apps/tenant/src/app/(dashboard)/organization/employees/`)

- **服务契约 (`EmployeeManagementService`)**：
  - `listEmployees(filter)`：支持按左侧部门树级联联动筛选、关键词搜索（工号/姓名/邮箱）、状态筛选；
  - `directCreateEmployee(input)`：
    - 输入：姓名、邮箱、工号、部门 ID、岗位 ID、角色列表、初始密码；
    - 事务/原子流程：在 Control DB 创建或复用 User（设置密码哈希），创建 Member（指派角色），在 Tenant DB 创建 `EmployeeProfile`（状态直接设为 `ACTIVE`，固化姓名/邮箱快照，绑定部门岗位）；
  - `transferDepartment(employeeId, newDeptId)`：调部门，**自增 Control DB 的 `authorizationVersion`**，动态下推重算 CASL 数据范围；
  - `transferPosition(employeeId, newPositionId)`：调岗位（默认不影响角色权限）；
  - `transferRoles(memberId, newRoleCodes)`：升降角色，**自增 `authorizationVersion`**；
  - `suspendEmployee(employeeId)`：状态置为 `SUSPENDED`，阻断租户业务访问；
  - `resumeEmployee(employeeId)`：状态恢复为 `ACTIVE`。
- **页面交互**：
  - 列表页：左侧部门树点击联动，右侧展示工号、姓名、邮箱、部门、岗位、角色徽标、状态、操作菜单；
  - 直接新增员工模态框：一步式表单（基本信息 + 组织岗位 + 角色指派 + 密码设置）；
  - 调部门 / 调岗位 / 调角色弹窗与员工停用二次确认。

## 三、 范围内能力

1. 落地 `DepartmentService`、`PositionService` 与 `EmployeeManagementService`。
2. 开发落地 `/organization/departments`、`/organization/positions` 与 `/organization/employees` 三大页面及组件。
3. 调部门、调角色与停用操作必须触发 `authorizationVersion++`。
4. 单元测试覆盖防环算法、删除保护、直接建号原子流与版本号递增。

## 四、 明确不做

- 外部邮件发送与接收（交由第三梯队 P2 特性）。
