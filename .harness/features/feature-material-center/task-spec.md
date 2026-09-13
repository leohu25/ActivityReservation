# 特性任务规格书 (Task Spec): 工艺 BOM 交互式编排与 DAG 可视化闭环 (BOM Visual Flow & Process Orchestration)

## 一、 背景与业务目标

当前 `@base/feature-material-center` 已在 Prisma Schema、数据迁移、计算引擎 (`BomCalculatorEngine`) 以及 Server Actions (`createBomAction`) 中完整支持了工序步骤 (`bom_process`)、投入物料明细 (`bom_input_item`) 和产出/副产品 (`bom_output_item`) 的多层级关系。
然而前端 `BomManagementView.tsx` 目前仅提供极简的 4 字段弹窗，缺乏工序步骤与物料投入产出编排入口，导致创建出的 BOM 无工序数据，列表上方选中的视觉 DAG 组件永远显示“暂未配置工序流程”，形成严重业务断层。

本次任务目标：

1. **工序与产线主数据联动**：将已有的 `processMaster`（工序库）和 `processSpec`（规格）下发给前端编排器；
2. **构建高可用、人性化的 BOM 流程编排抽屉/模态窗 (`BomFlowEditorModal`)**：
   - 支持基本信息配置（BOM编码、名称、分类、产出品、产线）；
   - 支持动态添加/删除工序步骤（如 #1清洗 $\to$ #2切丝 $\to$ #3包装）；
   - 支持为每个工序配置加工规格、工序损耗率/出成率（自动联动）；
   - 支持为每个工序添加投入物料（原料/半成品/包材、数量、单位、角色）；
   - 支持为每个工序配置主产出或副产品；
   - 自动调用 `BomCalculatorEngine` 逻辑在前端即时推导并展示“综合出成率”；
3. **点亮 DAG 流程拓扑图 (`BomVisualDag.tsx`)**：
   - 支持清晰展示：投入物料 $\to$ 菱形工序/加工卡片 $\to$ 产出中间品 $\to$ 最终交付品；
   - 包含综合出成率高亮、工序流向箭头、工时与规格参数徽标；
   - 点击 BOM 编码或操作栏“查看流程”即可在上方无缝切换预览，或跳转独立详情页；
4. **UI/UX 工业风标准遵循**：
   - 100% 使用 `@base/ui` (shadcn) 原子组件（`Table`, `Card`, `Badge`, `Button`, `Input`, `Dialog`, `Select` 等）；
   - 数字包含 `tabular-nums`，图标使用 `lucide-react`，无原生弹窗；
   - 操作丝滑人性化，表单具备默认值与快速填充（如根据选择的工序自动带出默认损耗率）。

---

## 二、 角色编排与流水线规划

按 `.harness/agents/index.md` 规范采用多智能体协同机制：

- **Coordinator** (主协调器，当前父级)：负责需求规格化、沙盒边界管控、派发任务与最终门禁验收；
- **Implementer** (实现者，子智能体)：负责在限域白名单内开发前端组件、更新 Query/Action 装配并编写单元测试；
- **Reviewer** (审查员，子智能体)：负责对改动进行代码质量、设计系统规范与 `./scripts/verify.sh` 门禁复核。

---

## 三、 修改白名单 (Scope Whitelist)

- `packages/features/material-center/src/features/bom-management/ui/BomManagementView.tsx`
- `packages/features/material-center/src/features/bom-management/ui/BomVisualDag.tsx`
- `packages/features/material-center/src/features/bom-management/ui/BomFlowEditorModal.tsx` (新建)
- `packages/features/material-center/src/features/bom-management/ui/index.ts`
- `packages/features/material-center/src/features/bom-management/types.ts`
- `packages/features/material-center/src/features/bom-management/queries.ts`
- `packages/features/material-center/src/features/bom-management/ui/BomFlowEditorModal.test.tsx` (新建单测)
- `apps/tenant/src/app/(dashboard)/materials/boms/page.tsx`
- `apps/tenant/src/app/(dashboard)/materials/boms/[bomId]/page.tsx`
- `.harness/features/feature-material-center/progress.md`
