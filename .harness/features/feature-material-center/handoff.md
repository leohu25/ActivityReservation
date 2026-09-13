# 会话换手交接单：物料与工艺BOM中心 (feature-material-center)

## 一、当前会话状态

- **交付状态**：已完成 (completed)
- **分支/Commit**：main
- **交接时间**：2026-09-13
- **负责角色**：coordinator / implementer / reviewer

---

## 二、关键产出与变更清单

1. **全新业务切片包 `@base/feature-material-center`**：
   - 垂直切片目录骨架与 package.json 规范（配置 Client/Server 语义 exports）；
   - Prisma 模型定义（包含品类分类、独立品种档案、品种等级、单位字典、换算规则、商品主数据、产线、工序档案、规格参数、三类BOM与MRP覆盖表）；
   - 纯数据契约（`classification`、`unit-management`、`item-master`、`bom-management` 四大受控契约）；
   - 领域计算引擎：`UnitConversionEngine` 多单位换算与精度截断，`BomCalculatorEngine` 综合出成率连乘与 DFS 循环依赖阻断；
   - RSC 服务端只读 Queries 与 `defineServerAction` 保护的 Server Actions；
   - 工业风 UI 视图与可视化工艺流程图组件 `BomVisualDag`。
2. **多租户数据库演进**：
   - 生成增量物理迁移 `20260913105634_add_material_and_bom_models`；
   - 编译生成运行期最新内存 Catalog；
   - 门禁脚本 `scripts/check-entity-baseline.mjs` 验证 10 实体 100% 符合 8 大审计字段基线。
3. **租户端运行时装配**：
   - 生成并更新全局清单 `apps/tenant/src/kernel/registry.generated.ts`；
   - 挂载 `/materials/layout.tsx` 与 5 个业务页面路由（`/materials/categories`、`/materials/units`、`/materials/items`、`/materials/boms`、`/materials/boms/[bomId]`）。
4. **测试与门禁验证**：
   - 切片自动化单测 8/8 PASS；
   - 全栈门禁脚本 `./scripts/verify.sh` 满分通过。
