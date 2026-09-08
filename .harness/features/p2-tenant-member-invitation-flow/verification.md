# 验证方法与验收标准：【P2】成员邮件邀请与激活绑定流 (p2-tenant-member-invitation-flow)

## 验证方法

1. 邀请流程集成测试：
   - 编写 `member-invitation-flow.test.ts`：测试发起邀请 -> 模拟受邀员工点击邮件 Token 激活 -> 触发 Hook 自动将 EmployeeProfile 状态由 INVITED 翻转为 ACTIVE 并绑定 memberId 与 userId。
2. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 邀请邮件正确生成并可通过模拟/真实邮件发送。
- [ ] 接受邀请后原子完成员工档案激活与绑定。
- [ ] `./scripts/verify.sh` 100% 通过。
