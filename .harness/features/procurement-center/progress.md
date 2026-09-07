# 特性任务进度：采购中心 (procurement-center)

## 任务清单

- [ ] 定义采购订单 `permissions.ts`（包含敏感字段 costPrice 与动作）
- [ ] 领域模型与仓储契约（Domain Entities & Repository Contracts）
- [ ] 业务规则策略（Business Policies: 禁止自审、状态校验）
- [ ] 应用服务与守卫集成（@RequirePermission, Data Scope, Field Policy）
- [ ] UI 页面与 Server Action 交互集成
- [ ] 端到端门禁验证通过

## 阶段结论

- 待前置底层设施（Tenant、Auth、AuthZ、Migration）就绪后开工。
