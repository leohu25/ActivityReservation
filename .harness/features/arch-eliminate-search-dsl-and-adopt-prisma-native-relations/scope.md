# 特性受控范围清单 (Scope) — arch-eliminate-search-dsl-and-adopt-prisma-native-relations

## 一、 允许修改文件清单 (Whitelisted Files)

### 1. 数据库与 Schema 声明层

- `packages/base/db-tenant/prisma/schema.prisma` # 配置 relationMode = "prisma" 与聚合底座
- `packages/domains/order-center/prisma/schema.prisma` # 声明 SalesOrder 逻辑 @relation
- `packages/base/db-tenant/prisma/schema.generated.prisma` # 自动重新聚合后的 Schema
- `tooling/db-migrate/**` # 仅限 Schema 聚合与基线一致性保障

### 2. 业务切片搜索与 Service 改造

- `packages/domains/order-center/src/features/sales-order/contract.ts` # 移除 salesOrderSearchContract
- `packages/domains/order-center/src/features/sales-order/service.ts` # 切换为 Prisma 官方原生范式 A
- `packages/domains/customer-center/src/features/customer-management/contract.ts` # 清理 SearchContract
- `packages/domains/customer-center/src/features/customer-management/service.ts` # 移除 executeSearchContract
- `packages/domains/customer-center/src/features/store-management/contract.ts` # 清理 SearchContract
- `packages/domains/customer-center/src/features/store-management/service.ts` # 移除 executeSearchContract
- `packages/domains/procurement-center/src/contracts/order.contract.ts` # 清理 procurementOrderSearchContract
- `packages/domains/procurement-center/src/components/ProcurementOrderCenter.tsx` # 调整 searchPlaceholder
- `packages/domains/material-center/src/features/classification/contract.ts` # 清理 SearchContract

### 3. 底座共享库与 UI 模板

- `packages/base/shared/src/utils/query/keyword-search-engine.ts` # 【物理删除】
- `packages/base/shared/src/utils/query/keyword-search.ts` # 移除 SearchContract 私有定义，保留纯字符串 sanitize 工具
- `packages/base/shared/src/index.ts` # 移除 executeSearchContract 导出
- `packages/base/ui/src/components/templates/DataTable.tsx` # 移除 searchContract prop，支持通用 searchPlaceholder

### 4. 门禁脚本与文档

- `scripts/check/check-redlines.mjs` # 移除强制要求 executeSearchContract 的旧规则
- `feature_list.json` # 登记特性状态与推进证据
- `.harness/features/arch-eliminate-search-dsl-and-adopt-prisma-native-relations/**` # 特性沙盒全套文档

## 二、 严格受限文件 (Out of Scope)

- 严禁擅自修改多租户物理分库动态连接池与 `TenantDbManager` 核心路由逻辑；
- 严禁破坏现有 CASL 四层权限闭环与 AbilityProvider 契约。
