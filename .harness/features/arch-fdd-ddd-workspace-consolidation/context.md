# arch-fdd-ddd-workspace-consolidation 上下文

## 目标（一句话）

确立「宏观 FDD 垂直切片 + 微观 DDD 聚合根 + Zod Schema 驱动三态表单 + 三级共享体系」的企业级工程范式，并落地采购订单搜索过滤、客户中心目录收敛、biz-shared 骨架与 ADR-008 规范沉淀。

## 核心任务

1. **采购订单中心修复**：移除 `ProcurementOrderCenter` 显式写死的 `showFilterBar={false}`、`showRefresh={false}`，补全关键字搜索、状态筛选与刷新能力。
2. **跨业务共享中台**：创建 `packages/biz-shared` 骨架，确立纯技术底座（`shared`/`ui`）vs 业务中台（`biz-shared`）vs 局部私有（`components/shared`）的三级共享分层。
3. **客户中心 micro-DDD 目录收敛**：消除 `customer-center/src/components` 多文件平铺，归集为 `customers/`、`quotes/`、`stores/`、`categories-tags/`、`shared/`，保持对外导出门面 100% 兼容。
4. **UI 模板增强**：在 `@chenrun/ui` 导出通用的 `CrudFormModal`，规范 TypeScript + Zod Schema 驱动的新增/编辑/查看三态表单范式。
5. **文档与规范防漂移**：沉淀 `ADR-008`、更新各包 README、更新 `.agents/skills/erp-feature-dev/` 及根目录 `AGENTS.md` 地图索引。
