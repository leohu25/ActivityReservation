# 验证方法与验收标准：【P1】租户三维审计安全体系 (p1-tenant-audit-logs)

## 验证方法

1. 审计写入与 Diff 对比测试：
   - 编写 `tenant-audit.test.ts`：验证操作订单自动插入流水；修改角色权限自动保存四层策略前后 Diff 快照。
2. 页面与交互测试：
   - 访问 `/audit/operations`、`/logins` 与 `/permissions` 验证查询与抽屉 Diff 对比。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 采购单核心操作与角色权限修改自动产生不可篡改的 Append-only 审计日志。
- [ ] 审计控制台支持按模块/人员多维检索与 Diff 对比。
- [ ] `./scripts/verify.sh` 100% 通过。
