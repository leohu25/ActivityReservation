# 特性任务进度：采购中心 (procurement-center)

## 任务清单

- [x] 定义采购订单 `permissions.ts`（包含敏感字段 costPrice 与自描述 ActionMetadata）
- [x] 领域模型与仓储契约（Tenant Prisma 采购单与部门拓扑集成）
- [x] 业务规则策略（Business Policies: 禁止自审、单向状态机校验、可编辑白名单）
- [x] 应用服务与守卫集成（ProcurementOrderService: listOrders, createOrder, auditOrder, exportOrders）
- [x] UI 页面与 Server Action 交互集成（CreateOrderDialog, AuditOrderModal, ProcurementOrderCenter 真实连接独立租户库）
- [x] 端到端门禁验证通过（5/5 专属测试通过，全仓 87/87 单测通过，12 包 check 0 错误，verify.sh 通过）

## 阶段结论

- 采购中心最小验证垂直切片已全面落地，闭环验证了 Database-per-Tenant 租户物理隔离、四层权限动态编译下推、敏感成本价只读/脱敏及业务防自审红线。
