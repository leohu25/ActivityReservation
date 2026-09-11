# @chenrun/features

辰润 ERP 的**领域垂直切片特性集群（Feature-Driven Development Modules）**。

## 1. 架构定位与职责

本目录遵循 **FDD (Feature-Driven Development) 垂直切片架构**，将业务逻辑按高内聚、低耦合的领域边界切分。每个子目录均作为一个独立的 NPM 工作区包（`workspace:*`），具备从领域数据契约、服务层逻辑、Next.js Server Actions 到专属 UI 视图的完整垂直切片闭环：

| 子包目录 | 包名 | 职责定位 |
| --- | --- | --- |
| `control-admin` | `@chenrun/feature-control-admin` | **平台管控端切片**：总控管理、租户生命周期配置、物理库初始化、跨租户迁移下发与全局指标大盘。 |
| `tenant-admin` | `@chenrun/feature-tenant-admin` | **租户组织管理切片**：组织架构（部门、岗位）、员工档案、角色与动态权限策略配置、租户通用配置。 |
| `customer-center` | `@chenrun/feature-customer-center` | **客户中心切片**：客户档案（分级、标签）、门店网点与报价单全生命周期管理。 |
| `procurement-center` | `@chenrun/feature-procurement-center` | **采购中心切片**：采购订单流转、行项目明细管理、动态审核流与实时看板。 |

## 2. 垂直切片标准规范 (FDD Standard)

每个 feature 切片遵循统一的工程组织规范：

1. **contracts/**：纯 TypeScript / Zod 数据契约与 DTO 定义，与具体 ORM 解耦。
2. **services/**：领域业务服务，封装事务、实体状态流转与权限前置校验（接收上下文与 Repository）。
3. **actions.ts**：基于 `defineServerAction` 导出的 Next.js Server Actions，承接客户端请求并保证数据平铺序列化。
4. **components/**：切片专属业务 UI 组件，基于 `@chenrun/ui` 构建，严禁越界访问其他 feature 内部私有组件。
5. **manifest.ts**：功能清单元数据定义，用于向主应用注册导航路由与权限动作字典。

详细子包说明请查阅各目录下的独立 `README.md`。
