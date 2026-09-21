# 技术债与架构漂移收敛台账 (Technical Debt & Architectural Drift)

> 本台账用于智能体在开发或审查过程中，登记发现的非当前 Feature 修改范围的历史遗留问题、不规范代码或架构漂移。
> **原则：严禁擅自借开发新特性之机顺手大改无关代码！一律先在此处登记，交由协调者统一评估排期。**

---

## 登记格式与规范

| 编号 | 登记日期 | 登记人/角色 | 所在文件/模块 | 漂移/债务描述 | 推荐收敛方案 | 优先级 | 处理状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DEBT-001 | 2025-05-18 | @coordinator | 根目录 | 初始骨架搭建待引入模块化 Monorepo 依赖扫描工具 | 配置 tooling/boundary-check 静态检查 | 中 | 待排期 |
| DEBT-002 | 2026-09-08 | @implementer | packages/db-tenant, apps/tenant | 租户物理库连接池需补充 LRU 容量上限保护与闲置连接主动回收 | 在 TenantDbManager 引入 LRU 缓存与断连保活 | 低 | 待排期 |
| DEBT-003 | 2026-09-08 | @coordinator | packages/auth, packages/db-control | 平台超级管理员当前采用环境变量白名单 (PLATFORM_SUPERADMIN_EMAILS) 静态守卫，尚未在 Control DB 建立 platform_role 动态角色表 | V1 版本保持静态白名单以确保防提权物理安全与极简交付；后续 V2 阶段再引入 Control DB platform_role 动态角色分配表与平台多运维角色（客服/财务）分权控制台，并保留环境变量作为兜底后门 | 低 | 暂不处理(V2演进) |
| DEBT-004 | 2026-09-08 | @coordinator | packages/db-tenant, packages/authorization | 租户独立库尚未建立 employee_profile 表，当前用户部门拓扑 (UserDepartmentTopology) 由会话模拟注入 | 已在 feature_list.json 的 foundation-tenant-rbac-core 中建立初始表结构，但模型存在 memberId 强约束必填、缺失岗位与人事生命周期等失真问题，排期至 tenant-org-core-schema 彻底重构 | 高 | 已在规划中 |
| DEBT-005 | 2026-09-08 | @coordinator | packages/authorization | 字段级导出权限 (Export) 与敏感数据掩码脱敏 (Mask) 尚未作为通用管道落地 | 待后续在报表导出与通用表单中补充 Field Policy 的 Mask 策略中间件 | 低 | 待排期 |
| DEBT-006 | 2026-09-08 | @coordinator | packages/db-tenant/prisma/schema.prisma | EmployeeProfile 模型中 memberId 被设置为必填 @unique，违背规范第 33、75 节（员工先录入档案后发邀请、INVITED 状态无 Member），且缺失 userId, invitationId, positionId, managerEmployeeId, nameSnapshot, emailSnapshot 及生命周期五态枚举 | 在特性 tenant-org-core-schema 中重构 EmployeeProfile，支持 memberId 为 nullable，并建立相关外键与快照字段 | 高 | 排期中(tenant-org-core-schema) |
| DEBT-007 | 2026-09-08 | @coordinator | packages/db-tenant | 组织架构三支柱之一的 Position（岗位实体）在数据层与业务层完全缺失，仅使用 jobTitle 字符串临时占位，且未建立与 Role 的正交解耦和推荐默认角色机制 | 在 tenant-org-core-schema 建立 Position 模型，在 tenant-org-department-position 落地岗位管理与推荐角色机制 | 高 | 排期中(tenant-org-core-schema) |
| DEBT-008 | 2026-09-08 | @coordinator | apps/tenant/src/app/(dashboard)/workbench/page.tsx | 工作台页面中部门拓扑 (topology) 硬编码为写死静态数据 (dept_procurement_east)，脱离真实 Tenant DB 员工档案自驱装配 | 已在 p0-tenant-workbench-real-topology 中彻底重构，移除全部 mock 字符串，改为直连物理库与 resolveEmployeeTopology 自驱解析 | 高 | 已解决 |
| DEBT-009 | 2026-09-08 | @coordinator | packages/auth/src/tenant-context.ts | 租户访问守卫 (Tenant Access Gate) 仅校验 Control DB 的 Member 与 TenantDatabase 状态，未核验 Tenant DB 的 EmployeeProfile.status === 'ACTIVE'，被停用/离职人员仍可凭 Session 穿透访问 | 已在 p0-tenant-workbench-real-topology 中落地 assertTenantAccessGate，对非 ACTIVE/停用/离职人员 Fail-Closed 阻断 | 高 | 已解决 |
| DEBT-010 | 2026-09-08 | @coordinator | packages/features/control-admin/src/services/control-admin.ts | 平台租户开通逻辑为同步单一函数，缺少 Saga 状态机重试补偿机制；开出的租户物理库为空壳，未 Seed ROOT 根部门与默认岗位字典，未为 Owner 创建 EmployeeProfile，未初始化系统预置四层角色 | 在特性 tenant-provisioning-saga-onboarding 中重构 TenantProvisioningService 为完整 Saga 状态机，补齐租户库种子初始化与 Owner 引导向导 | 高 | 排期中(tenant-provisioning-saga-onboarding) |
| DEBT-011 | 2026-09-08 | @coordinator | packages/db-control, packages/authorization | 缺少 authorizationVersion 权限版本化控制，员工调部门、调岗、改角色无法低成本驱动分布式缓存与 CASL Ability 立即失效重建 | 在 tenant-org-core-schema 中增加 authorizationVersion 并在相关人事调动操作中自增驱动失效 | 中 | 排期中(tenant-org-core-schema) |
| DEBT-012 | 2026-09-12 | @implementer | packages/features/tenant-admin | 历史遗留页面（EmployeeView、PositionView、RolePermissionManager）使用原生 confirm()/window.confirm 弹窗二次确认，违反红线 8 与 20 | 已全部重构为 @base/ui ConfirmDialog 模态对话框，红线门禁强校验通过 | 高 | 已解决 |
| DEBT-013 | 2026-09-12 | @implementer | packages/features/tenant-admin, packages/features/control-admin | 历史遗留视图（EmployeeView、PositionView、RolePermissionManager、MigrationsView）存在手写原生 <table> DOM 标签，违反红线 3 | 已全部重构为 @base/ui Table 原子组件与 DataTable 标准表格，红线门禁强校验通过 | 高 | 已解决 |
| DEBT-014 | 2026-09-18 | @implementer | packages/domains/customer-center + packages/base/ui | StoreView / QuoteView / RoleListView 仍使用已 `@deprecated` 的 `useListUrlNav`（及依赖它的 `useDataTableState`），未切换 `defineListSearchParams` + `useListSearch` 标杆 | 全仓已 100% 切换至 defineListSearchParams + useListSearch 标杆，已物理删除 useListUrlNav 与 useDataTableState 源码及测试 | 中 | 已解决 |
| DEBT-015 | 2026-09-18 | @implementer | packages/base/ui DataTable | `searchPlacement="toolbar"` / `advancedFilters` / `advancedTriggerText` 为可选高级抽屉形态，易与推荐扩展插槽 **`filterExtra`（未废弃）** 混淆 | 已从 DataTable 彻底物理移除 searchPlacement / advancedFilters / advancedTriggerText，全仓统一收敛为 filterExtra 扁平工业风交互 | 低 | 已解决 |
| DEBT-016 | 2026-09-18 | @implementer | packages/*, apps/* | 历史遗留 package.json 采用混沌的 `@base/feature-*` 和 `@base/biz-shared` 命名，导致业务包被赋予基座前缀，违背物理分层与 DDD 领域语义 | 已全面规范化为 `@domain/*`（垂直业务）、`@platform/*`（平台套件）、`@biz/shared`（中台资产）与 `@base/*`（纯技术基础设施）四维拓扑，全仓对齐并消灭别扭感 | 高 | 已解决 |
| DEBT-017 | 2026-09-21 | @implementer | packages/domains/*/src/assembly, packages/domains/*/src/shared/server | 各业务切片内重复手写 `getTenantDbContext`（Session/TenantContext/DB连接/员工门禁解析）与 `resolveEmployeeTopology`（部门拓扑解析与 CASL 工厂装配）高度样板代码 | 将通用的租户会话与物理库解析上浮至 `@base/db-tenant` 或 `@base/auth`；并提供高阶工厂（如 `createTenantSliceContext(catalog)`）供切片单行组合装配 | 高 | 待排期(本次提交后立即收敛) |

---

## 已收敛记录归档

*(暂无已归档技术债)*
