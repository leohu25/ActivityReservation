# 架构决策记录 (ADR 0008)：宏观 FDD 垂直切片、微观 DDD 聚合根与三级共享体系架构

## 状态

已采纳 (Accepted) - 2026-09-12

## 上下文

随着 ERP 业务模块（客户中心、采购中心、仓储物流等）持续扩展，原有架构暴露了三大结构性痛点：

1. **切片内部平铺混乱**：在 `packages/features/customer-center/src/components/` 根目录下，同时平铺了客户档案、报价单、履约门店、分类与标签的所有视图与弹窗文件，文件职责模糊，缺乏业务实体自闭环边界；
2. **跨切片共享失位**：采购中心与销售订单等模块存在高度相似的单据审批流、明细物料行和业务状态机枚举，但原有仓库只有纯技术底座 `packages/shared` 与 `packages/ui`，业务级公共能力无处安放；
3. **列表与表单模式割裂**：列表组件有标准 `DataTable.Workspace`，但弹窗表单大量手写重复模态框，缺乏“新增、编辑、查看三态合一”的 Schema 驱动体系。

## 决策

1. **确立“宏观 FDD 垂直切片 + 微观 DDD 聚合根”规范**：
   - **宏观（仓库级）**：继续按 Feature-Driven Development（FDD）组织独立业务切片（`packages/features/*`），切片间物理隔离、零耦合；
   - **微观（切片内部）**：组件层按 Domain-Driven Design（DDD）聚合根划分自闭环子目录。例如 `customer-center/src/components/` 下划分为：
     - `customers/`：客户主档案视图与表单；
     - `quotes/`：报价单视图与明细；
     - `stores/`：履约门店视图与表单；
     - `categories-tags/`：分类树与业务标签；
     - `shared/`：切片私有复用微组件。

2. **建立“三级分层共享体系” (Three-Tier Shared Hierarchy)**：
   - **Level 1（纯技术底座）**：`packages/shared` 与 `packages/ui`。完全无业务语义，纯工具与纯设计系统（shadcn 原子 + 无业务模板）；
   - **Level 2（业务中台共享）**：新建 `packages/biz-shared`（`@chenrun/biz-shared`）。承接跨业务切片的 ERP 业务模式（单据流转状态机、审批弹窗、动态明细行表格、远程搜索防抖选择器）；
   - **Level 3（切片内部共享）**：各切片内部 `src/components/shared/`。承接仅在当前特性切片不同实体间复用的私有资产。

3. **推广 TypeScript + Zod Schema 驱动与三态表单（增/改/查）**：
   - 在 `@chenrun/ui` 导出通用的 `CrudFormModal` 模板；
   - 支持 `create`（可填/校验）、`edit`（初值带入/关键主键锁定）、`view`（全字段置灰只读/隐藏提交按钮）；
   - 坚持 80/20 法则与逃生通道：80% 通用表单走 Schema 驱动，20% 复杂极端业务直接使用 shadcn 原生 JSX 对话框。

4. **对齐 Next.js 极薄路由理念**：
   - `apps/tenant/src/app` 继续遵循极薄组装原则，仅负责 Session 取回、CASL 快照传递与主视图挂载。

## 影响与后果

- 业务切片内部结构高度内聚，单个实体的视图、弹窗与 Schema 自闭环；
- 彻底解决平铺导致的代码杂乱，消灭跨切片隐式循环依赖；
- 列表与表单开发效率大幅提升，沉淀标准工业风资产。
