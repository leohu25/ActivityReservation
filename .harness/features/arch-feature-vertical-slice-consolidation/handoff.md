# 交接文档

## 完成内容

- Customer Center 定位为 Business Area / Feature Group，内部按 Customer Management、Store Management、Quotation Management Feature 与 Classification Sub-Feature 垂直内聚。
- Contract、Types、Service、Query、mutation Action、UI 与测试完成就近归位；未引入过度设计或机械 DDD 分层。
- 解决架构审查问题：将底层租户 DB 上下文 (`shared/server/tenant-context.ts`) 与业务区域装配 (`assembly/context.ts`) 明确分层，彻底解除 `shared/server` 对 `features/` 契约的反向依赖。
- 解决正确性审查问题：
  1. `listCustomersQuery` 显式保留主键 `id`（映射为 `customerCode`），保障在 `customerCode` 受策略隐藏时表格 `rowKey` 与操作动作依然稳健。
  2. `CustomerService.listCustomers` 裁剪无用 `stores` 实体数组关联暴露，仅保留 `_count.stores`，确保跨 Subject 实体数据不越权泄漏。
  3. 分类与标签契约对齐：标签操作与查询统一通过 `CustomerTagSubject`（对齐同一聚合受控主体），杜绝权限判定真空。
  4. 客户编辑弹窗闭环绑定并调用 `updateCustomerAction`，完成数据提交、表格即时响应与 toast 提示。
- `feature_list.json` 中保持 `in_progress` 状态，待最终全量门禁与收尾验收后方可变更为 completed。

## 验证证据

- `pnpm --filter @chenrun/feature-customer-center check`
- `pnpm --filter @chenrun/feature-customer-center test`
- `pnpm --filter tenant check`
- `node scripts/check-redlines.mjs`
- `node --test scripts/check-redlines.test.mjs`
