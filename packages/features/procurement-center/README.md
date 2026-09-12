# @base/feature-procurement-center

通用 SaaS 的**采购业务中心垂直切片模块（Procurement Order Center Feature）**。

## 1. 模块定位与职责

本模块专注于工业制造与供应链体系下的采购订单全生命周期管理：

- **数据契约与 DTO (`contracts/order.contract.ts`)**：定义采购订单主表、采购明细项（行项目）、供应商关联、交期与金额强类型契约。
- **采购领域服务 (`services/procurement-order-service.ts`)**：
  - 采购订单创建、修改、作废与状态机流转（草稿 `DRAFT` -> 待审核 `PENDING_APPROVAL` -> 已批准 `APPROVED` -> 采购中 `PROCESSING` -> 已完成 `COMPLETED` / 已拒绝 `REJECTED`）。
  - 业务校验规则：行项目总金额动态校验、供应商有效性核验、防重审核校验。
  - 采购大盘与工作台统计指标计算（待审批数量、采购总额等）。
- **Next.js Server Actions (`actions.ts`)**：安全封装采购单据增删改查、审核、下发等 Server Actions，集成 CASL 权限检查与 `toPlainData` RSC 序列化。
- **专属业务交互组件 (`components/`)**：
  - `ProcurementOrderCenter`: 采购中心主工作台，集成多维状态筛选、高密度数据表格。
  - `CreateOrderDialog`: 新增采购订单弹窗，支持动态增减物料行项目。
  - `AuditOrderModal`: 采购单据审批/驳回决策弹窗。
- **模块清单元数据与权限目录 (`manifest.ts`)**：声明导航路由，并向系统导出采购权限目录 `procurementCatalog`。

## 2. 内部架构与目录结构

```text
packages/features/procurement-center/
├── src/
│   ├── contracts/                    # 纯 TypeScript 业务契约与 DTO
│   │   ├── order.contract.ts         # 采购订单契约、行项目结构与状态枚举
│   │   └── index.ts
│   ├── services/                     # 领域服务实现与单元测试
│   │   ├── procurement-order-service.ts
│   │   ├── procurement-order-service.test.ts
│   │   └── index.ts
│   ├── components/                   # 专属 UI 视图与测试
│   │   ├── ProcurementOrderCenter.tsx# 采购中心主视图
│   │   ├── CreateOrderDialog.tsx     # 订单创建表单弹窗
│   │   ├── AuditOrderModal.tsx       # 订单审核弹窗
│   │   └── index.ts
│   ├── server/                       # 服务端租户数据查询与 Session 依赖
│   ├── actions.ts                    # Next.js Server Actions (CRUD, 审核)
│   ├── manifest.ts                   # 采购中心导航元数据与权限清单
│   ├── types.ts                      # 视图层类型定义
│   └── index.ts                      # 统一聚合导出 (含 procurementCatalog)
└── package.json
```

## 3. 核心 API 与使用示例

### 3.1 消费采购服务

```ts
import { getProcurementOrderService } from "@base/feature-procurement-center";

const service = await getProcurementOrderService();
const orders = await service.listOrders({
  page: 1,
  pageSize: 20,
  status: "PENDING_APPROVAL",
});
```

### 3.2 审核采购订单

```ts
import { auditProcurementOrderAction } from "@base/feature-procurement-center";

// 客户端触发 Server Action
const result = await auditProcurementOrderAction({
  orderId: "order_123",
  decision: "APPROVED",
  remark: "已核对供应商库存与交期，予以批准",
});
```

## 4. 架构原则与红线

1. **严格物理隔离**：所有采购业务数据均保存在租户物理数据库中，通过可信上下文派生的 Prisma 客户端执行操作。
2. **严禁越权操作**：单据审核、金额查看等敏感动作必须受 `@base/authorization` 的 CASL Ability 严格约束。
3. **高内聚低耦合**：采购中心所需的前端视图组件完全收敛在切片内部，仅依赖 `@base/ui` 基础组件。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @base/feature-procurement-center check

# 运行单元测试
pnpm --filter @base/feature-procurement-center test
```
