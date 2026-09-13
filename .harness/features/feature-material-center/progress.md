# 特性进展：物料与工艺BOM中心 (feature-material-center)

## 状态

- 当前状态: completed
- 启动时间: 2026-09-13
- 完成时间: 2026-09-13
- 负责角色: coordinator (编排) / implementer (执行) / reviewer (门禁自检)

---

## 阶段任务跟踪清单

### Phase 0: 架构拓扑与目录骨架

- [x] 创建 `packages/features/material-center` 包骨架与 `package.json`（配置 Client/Server 语义 exports）
- [x] 创建 4 个 Feature 目录：`classification`、`unit-management`、`item-master`、`bom-management`
- [x] 创建 `src/shared` 共享层与 `src/assembly` 装配层

### Phase 1: 数据建模与租户分库物理演进

- [x] 编写 `packages/features/material-center/prisma/schema.prisma`（零 `tenantId`，10 实体 100% 具备 8 大审计字段）
- [x] 运行 `pnpm sync:features` 聚合生成 `packages/db-tenant/prisma/schema.generated.prisma`
- [x] 执行 `pnpm db:migrate:generate` 生成租户增量迁移补丁并编译 catalog
- [x] 运行 `scripts/check-entity-baseline.mjs` 验证通过

### Phase 2: 纯数据契约 (SSoT)

- [x] 编写 `classification/contract.ts`（品类、品种、等级受控契约）
- [x] 编写 `unit-management/contract.ts`（计量单位与多单位换算受控契约）
- [x] 编写 `item-master/contract.ts`（商品档案受控契约）
- [x] 编写 `bom-management/contract.ts`（工序、产线、单品/组合/包装 BOM 受控契约）
- [x] 编写 `src/manifest.ts` 并自动同步到全局租户注册表 `registry.generated.ts`

### Phase 3: 领域服务与 RSC Queries

- [x] 实现 `UnitConversionEngine`（度量衡基准、专属换算与精度舍入）
- [x] 实现 `BomCalculatorEngine`（综合出成率连乘计算、投料倒推、DFS 循环引用闭环检测）
- [x] 实现 RSC 只读 Queries（带数据范围下推与软删除过滤）
- [x] 编写服务同级单元测试（`service.test.ts`、`contract.test.ts`）8/8 测试全绿

### Phase 4: 安全 Actions 与序列化防错

- [x] 实现 `classification/actions.ts`（defineServerAction + CASL 守卫）
- [x] 实现 `unit-management/actions.ts`（defineServerAction + CASL 守卫）
- [x] 实现 `item-master/actions.ts`（defineServerAction + CASL 守卫）
- [x] 实现 `bom-management/actions.ts`（defineServerAction + 发布流状态机 CASL 守卫）
- [x] 所有 Action 返回均经 `toPlainData` 序列化消灭 Decimal/Date 跨端异常

### Phase 5: 工业风高密度 UI 交互

- [x] 实现分类树与独立品种档案视图（`ClassificationView.tsx`）
- [x] 实现计量单位与换算管理视图（`UnitManagementView.tsx`）
- [x] 实现商品档案主面板（`ItemMasterView.tsx`）
- [x] 实现高密度 BOM 管理面板（`BomManagementView.tsx`，含单品/组合/包装分 Tab 与状态徽标）
- [x] 实现工艺 BOM 可视化 DAG 拓扑图（`BomVisualDag.tsx`，工序节点、投入产出与出成率指标）

### Phase 6: 路由装配与 Manifest 动态自发现

- [x] 租户应用挂载 `/materials/layout.tsx`（注入 `MaterialAbilityBoundary`）
- [x] 挂载 4 个页面路由：`/materials/categories`、`/materials/units`、`/materials/items`、`/materials/boms`
- [x] 挂载 BOM 详情视图：`/materials/boms/[bomId]`

### Phase 7: 对齐单测与全栈门禁验证

- [x] 编写页面与契约 100% 对齐单测（8/8 PASS）
- [x] 执行 `./scripts/verify.sh`（元数据、沙盒边界、红线扫描、实体基线、权限契约、业务切片、类型扫描全部一次性通过）
- [x] 权限四维标准化：ItemCategory、ItemVariety、ItemGrade 独立 Subject/Resource，Material AbilityProvider 注入全部关联实体快照
- [x] 新增 `scripts/check/check-permission-contracts.mjs` 硬门禁，并完成存量 Resource Key 一次性替换与平台角色 JSON 数据迁移
- [x] 清理全仓仅残留的两处 TypeScript 原生 `enum`（`FieldPolicy` 与 `BizApprovalStatus`），全面重构为标准 `as const` 常量对象
- [x] 重构各业务切片（`material-center`、`customer-center`、`order-center`、`tenant-admin`）权限守卫 `assert*Ability`：入参消除宽泛 `string` 降解，全面锁死领域 `as const` 强类型联合
- [x] 在 `scripts/check/check-permission-contracts.mjs` 中追加权限守卫强类型静态拦截门禁

### Phase 8: BOM 工序流转编排与 DAG 可视化闭环

- [x] 实现 `BomFlowEditorModal.tsx`（多工序时序编排、工序模板与规格参数、原料投入与角色标签、工序产出与副产品、理论综合出成率实时累乘核算、人工覆盖支持）
- [x] 升级 `BomVisualDag.tsx`（步骤流转卡片、投入物料与角色徽章、产出物料与副产物、最终成品交付卡、综合出成率大字号高亮）
- [x] 优化 `BomManagementView.tsx`（集成流程编排抽屉、点击表格行或 BOM 编码即时切换上方 DAG 看板预览、操作栏增设【预览】与【详情】）
- [x] 升级 `queries.ts` 与 `boms/page.tsx`（获取并下发 `processTemplates` 工序库与规格，`getBomsQuery` 预加载 `processes` 供看板无延迟点亮）
- [x] 完善 `boms/[bomId]/page.tsx`（返回清单导航、BOM概览、完整 DAG 拓扑图、工序分步投入产出结构清单详表）
- [x] 编写同级单元测试 `BomFlowEditorModal.test.tsx`（测试总数增至 10/10 全部 PASS）
