# @chenrun/feature-tenant-admin

辰润 ERP 的**租户级系统管理与组织架构垂直切片模块（Tenant Admin & Organization Management Feature）**。

## 1. 模块定位与职责

本模块专注于多租户企业内部的管理中枢与组织权限体系构建：

- **组织架构全层级管理 (`services/`)**：
  - 部门管理（`department-service`）：支持树形无限级部门层级、部门主管指定与状态启停。
  - 岗位管理（`position-service`）：支持职级、岗位编码、所属部门关联。
  - 员工档案（`employee-management-service`）：员工生命周期（在职、试用、离职），支持多部门与多岗位关联映射。
- **角色与 CASL 动态权限编排 (`RolePermissionManager`)**：
  - 维护租户自定义角色与内置超级角色。
  - 动态分配菜单动作权限与敏感字段权限（三态读写规则）。
- **租户基础信息与安全配置 (`tenant-settings-service`)**：企业全称、统一社会信用代码、时区、登录策略及安全配置。
- **模块清单元数据 (`manifest.ts`)**：注册租户端系统设置路由与导航菜单节点，导出权限动作字典。

## 2. 内部架构与目录结构

```text
packages/features/tenant-admin/
├── src/
│   ├── components/                   # 专属业务交互视图
│   │   ├── DepartmentView.tsx        # 部门架构树与增删改查
│   │   ├── PositionView.tsx          # 岗位管理列表
│   │   ├── EmployeeView.tsx          # 员工花名册与档案编辑
│   │   ├── RolePermissionManager.tsx # 角色与权限矩阵分配器
│   │   ├── CompanySettingsView.tsx   # 企业基础信息配置
│   │   ├── SecuritySettingsView.tsx  # 安全策略设置
│   │   ├── OrgSwitcher.tsx           # 企业组织切换组件
│   │   ├── WorkbenchView.tsx         # 管理工作台入口
│   │   └── index.ts
│   ├── contracts/                    # 数据契约与 DTO
│   ├── server/                       # 租户上下文服务端注入器
│   ├── services/                     # 领域服务实现及单测
│   ├── actions.ts                    # Next.js Server Actions (组织、人员、权限操作)
│   ├── manifest.ts                   # 特性 Manifest 与导航配置
│   ├── permission-registry.ts        # 权限元数据字典注册中心
│   ├── types.ts                      # 领域类型定义
│   └── index.ts                      # 统一聚合导出入口
└── package.json
```

## 3. 核心 API 与使用示例

### 3.1 消费组织管理服务

```ts
import { getDepartmentService, getEmployeeService } from "@chenrun/feature-tenant-admin";

// 服务内部自动通过当前请求上下文连接对应租户物理库
const deptService = await getDepartmentService();
const tree = await deptService.getDepartmentTree();

const empService = await getEmployeeService();
const employees = await empService.listEmployees({ departmentId: "dept_123" });
```

### 3.2 角色权限配置组件

```tsx
import { RolePermissionManager } from "@chenrun/feature-tenant-admin";

export function RoleConfigPage({ roleId }: { roleId: string }) {
  return (
    <RolePermissionManager
      roleId={roleId}
      onSave={async (permissions) => {
        await updateRolePermissionsAction(roleId, permissions);
      }}
    />
  );
}
```

## 4. 架构原则与红线

1. **绝对遵循租户物理隔离 (ADR-002)**：所有服务只通过 Tenant Context 派生 Prisma 客户端操作该企业专属数据库，严禁跨库查询。
2. **员工生命周期门禁断言**：离职或停用员工在调用任何管理 Action 时由准入门禁直接拦截。
3. **字段级权限与敏感数据脱敏**：员工薪酬、身份证等字段受 CASL 策略约束，严格由 `AuthorizedField` 与后端字段裁剪保护。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @chenrun/feature-tenant-admin check

# 运行单元测试
pnpm --filter @chenrun/feature-tenant-admin test
```
