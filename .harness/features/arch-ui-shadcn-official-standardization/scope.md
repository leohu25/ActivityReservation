# 特性范围说明 — arch-ui-shadcn-official-standardization

## 修改白名单

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-ui-shadcn-official-standardization/**`
- `packages/base/ui/**`
- `scripts/**`
- `package.json`
- `pnpm-lock.yaml`
- `apps/control/**`
- `apps/tenant/**`
- `packages/platform/**`
- `packages/domains/**`
- `docs/**`

### @ fc2e49fb 联动修改自动登记

- `.prettierignore`
- `biome.json`
- `eslint.config.mjs`
- `tsconfig.base.json`

### @ 4cf24e70 联动修改自动登记

- `.archive/domains/material-center/src/features/bom-management/contract.test.ts`
- `.archive/domains/material-center/src/features/bom-management/service.test.ts`
- `.archive/domains/material-center/src/features/bom-management/ui/BomFlowEditorModal.test.tsx`
- `.archive/domains/material-center/src/features/classification/contract.test.ts`
- `.archive/domains/material-center/src/features/classification/ui/ClassificationView.test.tsx`
- `.archive/domains/material-center/src/features/item-master/contract.test.ts`
- `.archive/domains/material-center/src/features/unit-management/service.test.ts`
- `.archive/domains/material-center/tsconfig.json`
- `.archive/domains/order-center/src/features/sales-order/schema.test.ts`
- `.archive/domains/order-center/src/features/sales-order/service.test.ts`
- `.archive/domains/order-center/src/features/sales-order/ui/CreateOrderModal.test.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/OrderDetailModal.test.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/OrderFeeModal.test.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/SalesOrderView.test.tsx`
- `.archive/domains/order-center/tsconfig.json`
- `.archive/domains/procurement-center/README.md`
- `.archive/domains/procurement-center/src/components/AuditOrderModal.test.tsx`
- `.archive/domains/procurement-center/src/components/CreateOrderDialog.test.tsx`
- `.archive/domains/procurement-center/src/components/ProcurementOrderCenter.test.tsx`
- `.archive/domains/procurement-center/src/services/procurement-order-service.test.ts`
- `.archive/domains/procurement-center/src/services/workbench-real-topology.test.ts`
- `.archive/domains/procurement-center/tsconfig.json`

- `.archive/domains/material-center/package.json`
- `.archive/domains/material-center/prisma/schema.prisma`
- `.archive/domains/material-center/src/assembly/context.ts`
- `.archive/domains/material-center/src/catalog.ts`
- `.archive/domains/material-center/src/features/bom-management/actions.ts`
- `.archive/domains/material-center/src/features/bom-management/contract.ts`
- `.archive/domains/material-center/src/features/bom-management/public.server.ts`
- `.archive/domains/material-center/src/features/bom-management/public.ts`
- `.archive/domains/material-center/src/features/bom-management/queries.ts`
- `.archive/domains/material-center/src/features/bom-management/service.ts`
- `.archive/domains/material-center/src/features/bom-management/types.ts`
- `.archive/domains/material-center/src/features/bom-management/ui/BomFlowEditorModal.tsx`
- `.archive/domains/material-center/src/features/bom-management/ui/BomManagementView.tsx`
- `.archive/domains/material-center/src/features/bom-management/ui/BomVisualDag.tsx`
- `.archive/domains/material-center/src/features/bom-management/ui/components/BomItemRatioTable.tsx`
- `.archive/domains/material-center/src/features/bom-management/ui/components/BomYieldCalculator.tsx`
- `.archive/domains/material-center/src/features/bom-management/ui/components/bom-editor-types.ts`
- `.archive/domains/material-center/src/features/bom-management/ui/index.ts`
- `.archive/domains/material-center/src/features/classification/actions.ts`
- `.archive/domains/material-center/src/features/classification/contract.ts`
- `.archive/domains/material-center/src/features/classification/public.server.ts`
- `.archive/domains/material-center/src/features/classification/public.ts`
- `.archive/domains/material-center/src/features/classification/queries.ts`
- `.archive/domains/material-center/src/features/classification/types.ts`
- `.archive/domains/material-center/src/features/classification/ui/CategoryFormModal.tsx`
- `.archive/domains/material-center/src/features/classification/ui/ClassificationView.tsx`
- `.archive/domains/material-center/src/features/classification/ui/VarietyFormModal.tsx`
- `.archive/domains/material-center/src/features/item-master/actions.ts`
- `.archive/domains/material-center/src/features/item-master/contract.ts`
- `.archive/domains/material-center/src/features/item-master/public.server.ts`
- `.archive/domains/material-center/src/features/item-master/public.ts`
- `.archive/domains/material-center/src/features/item-master/queries.ts`
- `.archive/domains/material-center/src/features/item-master/types.ts`
- `.archive/domains/material-center/src/features/item-master/ui/ItemMasterFormModal.tsx`
- `.archive/domains/material-center/src/features/item-master/ui/ItemMasterView.tsx`
- `.archive/domains/material-center/src/features/unit-management/actions.ts`
- `.archive/domains/material-center/src/features/unit-management/contract.ts`
- `.archive/domains/material-center/src/features/unit-management/public.server.ts`
- `.archive/domains/material-center/src/features/unit-management/public.ts`
- `.archive/domains/material-center/src/features/unit-management/queries.ts`
- `.archive/domains/material-center/src/features/unit-management/service.ts`
- `.archive/domains/material-center/src/features/unit-management/types.ts`
- `.archive/domains/material-center/src/features/unit-management/ui/ConversionFormModal.tsx`
- `.archive/domains/material-center/src/features/unit-management/ui/UnitFormModal.tsx`
- `.archive/domains/material-center/src/features/unit-management/ui/UnitManagementView.tsx`
- `.archive/domains/material-center/src/manifest.ts`
- `.archive/domains/material-center/src/shared/contract-types.ts`
- `.archive/domains/material-center/src/shared/public.ts`
- `.archive/domains/material-center/src/shared/server/tenant-context.ts`
- `.archive/domains/material-center/src/shared/ui/MaterialAbilityBoundary.tsx`
- `.archive/domains/order-center/package.json`
- `.archive/domains/order-center/prisma/schema.prisma`
- `.archive/domains/order-center/src/assembly/context.ts`
- `.archive/domains/order-center/src/catalog.ts`
- `.archive/domains/order-center/src/features/sales-order/actions.ts`
- `.archive/domains/order-center/src/features/sales-order/contract.ts`
- `.archive/domains/order-center/src/features/sales-order/public.server.ts`
- `.archive/domains/order-center/src/features/sales-order/public.ts`
- `.archive/domains/order-center/src/features/sales-order/queries.ts`
- `.archive/domains/order-center/src/features/sales-order/schema.ts`
- `.archive/domains/order-center/src/features/sales-order/service.ts`
- `.archive/domains/order-center/src/features/sales-order/types.ts`
- `.archive/domains/order-center/src/features/sales-order/ui/CreateOrderModal.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/OrderDetailModal.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/OrderFeeModal.tsx`
- `.archive/domains/order-center/src/features/sales-order/ui/SalesOrderView.tsx`
- `.archive/domains/order-center/src/manifest.ts`
- `.archive/domains/order-center/src/shared/contract-types.ts`
- `.archive/domains/order-center/src/shared/public.ts`
- `.archive/domains/order-center/src/shared/server/tenant-context.ts`
- `.archive/domains/order-center/src/shared/ui/OrderAbilityBoundary.tsx`
- `.archive/domains/procurement-center/package.json`
- `.archive/domains/procurement-center/prisma/schema.prisma`
- `.archive/domains/procurement-center/src/actions.ts`
- `.archive/domains/procurement-center/src/components/AuditOrderModal.tsx`
- `.archive/domains/procurement-center/src/components/CreateOrderDialog.tsx`
- `.archive/domains/procurement-center/src/components/ProcurementAbilityBoundary.tsx`
- `.archive/domains/procurement-center/src/components/ProcurementOrderCenter.tsx`
- `.archive/domains/procurement-center/src/components/index.ts`
- `.archive/domains/procurement-center/src/contracts/index.ts`
- `.archive/domains/procurement-center/src/contracts/order.contract.ts`
- `.archive/domains/procurement-center/src/index.ts`
- `.archive/domains/procurement-center/src/manifest.ts`
- `.archive/domains/procurement-center/src/server/index.ts`
- `.archive/domains/procurement-center/src/server/orders-view.ts`
- `.archive/domains/procurement-center/src/server/session.ts`
- `.archive/domains/procurement-center/src/services/index.ts`
- `.archive/domains/procurement-center/src/services/procurement-order-service.ts`
- `.archive/domains/procurement-center/src/types.ts`
- `.archive/routes/materials/boms/[bomId]/page.tsx`
- `.archive/routes/materials/boms/page.tsx`
- `.archive/routes/materials/categories/page.tsx`
- `.archive/routes/materials/items/page.tsx`
- `.archive/routes/materials/layout.tsx`
- `.archive/routes/materials/units/page.tsx`
- `.archive/routes/order/layout.tsx`
- `.archive/routes/order/sales-orders/page.tsx`
- `.archive/routes/procurement/layout.tsx`
- `.archive/routes/procurement/orders/page.tsx`
- `tooling/db-migrate/src/schema/aggregate.ts`

## 范围约束

- 聚焦于 `@base/ui` 向 shadcn UI 官方最佳实践（Monorepo Design System）的架构收敛与正名。
- 允许目录重命名：`src/components/shadcn/` -> `src/components/ui/`。
- 允许合流原子组件变体（`Badge`）与修复逻辑（`Select`），删除多余的 1:1 伪包装层。
- 允许清理废弃组件（`toast.tsx`）并统一通知事实源为 `sonner`。
- 禁止破坏外部业务切片对 `@base/ui` 的既有纯数据契约与公共组件 API。
- 禁止修改数据库 Schema、权限规则与服务端逻辑。

## 受保护区域

- CASL 权限规则与四层权限闭环。
- 业务领域模型与数据持久层。
- 未经用户审阅确认不得私自提交代码。
