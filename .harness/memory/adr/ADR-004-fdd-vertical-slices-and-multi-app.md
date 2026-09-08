# 架构决策记录 (ADR 0004)：Turborepo 多应用解耦与 FDD 垂直切片规范

## 状态

已采纳 (Accepted)

## 上下文

在项目早期迭代中，平台运营商管理功能曾尝试作为子路由集成在 `apps/tenant/src/app/(platform)/platform-admin/` 中，且组件与业务服务按照传统技术层分散在 `components/` 与 `lib/services/` 中。
这种模式存在两个核心架构缺陷：

1. **应用边界混淆**：`apps/tenant` 属于单租户物理隔离域（强制需要用户登录并切换指定 Organization，数据操作直连特定租户物理库）；而平台总控属于跨租户全局运维域（直接基于 Control DB 调度，无单租户隔离限制）。两类上下文耦合在同一应用中导致鉴权与路由混淆。
2. **缺乏 FDD 垂直内聚**：传统的“文件类型横向分层”（app/ 路由、components/ 组件、lib/ 服务）使得每一个特性的代码碎片化分布，业务逻辑无法作为自包含模块被复用和独立单测。

## 决策

1. **Turborepo 多应用双核解耦 (`apps/`)**：
   - **`apps/tenant`**：纯粹的租户 SaaS ERP 业务主应用。仅运行在租户上下文下，受 RBAC、数据范围 (Data Scope) 与字段策略拦截，直连对应租户物理库。
   - **`apps/platform`**：独立的平台运营商总控应用（Platform Super Admin Portal）。独立部署（如 `admin.erp.com` 或独立端口），负责多租户全生命周期管理、物理独立库自动开通与监控。
   - **极薄路由原则 (Thin Routing)**：`apps/*/src/app/` 下的页面和布局仅作为胶水装配层（检查认证上下文 -> 挂载 Feature 组件），严禁在 `apps/` 内部编写复杂的业务服务、直接 SQL 查询或巨石组件。

2. **FDD (Feature-Driven Development) 垂直切片规范 (`packages/features/`)**：
   - 所有业务逻辑统一内聚为独立特性包（如 `packages/features/platform-admin`、`packages/features/procurement-center`、`packages/features/tenant-rbac`）。
   - 每个垂直切片必须自包含以下要素：

     ```text
     packages/features/<feature-name>/
     ├── components/       # 该特性的专属 UI 呈现组件 (受 Permission/Field 控制)
     ├── services/         # 该特性的领域服务、数据访问与核心业务规则
     ├── permissions.ts    # 该特性的权限事实源 (Better Auth statement 与 CASL 契约)
     ├── types.ts          # 该特性的领域类型、DTO 与入参契约
     ├── index.ts          # 纯净的统一对外暴露出口
     └── *.test.ts         # 该特性的专属自动化单元测试
     ```

3. **底座与通用包职责正交**：
   - `packages/auth`、`packages/authorization`、`packages/db-control`、`packages/db-tenant`、`packages/ui`、`packages/shared` 仅作为通用基础设施与原子抽象，严禁掺杂具体业务切片的私有逻辑。

## 影响与后果

- **高度内聚**：开发或重构某个业务特性时，智能体或团队成员的修改范围完全收敛在该特性的文件夹内，认知负荷与改动冲突降至最低。
- **杜绝越权与上下文泄漏**：租户端与平台端彻底从物理部署和代码层隔离，杜绝平台超管功能被普通租户越权调用的风险。
- **未来扩展平滑**：新的业务模块（如库存、销售、财务）只需按照规范在 `packages/features/` 新建切片，然后在 `apps/tenant` 对应路由挂载即可。
