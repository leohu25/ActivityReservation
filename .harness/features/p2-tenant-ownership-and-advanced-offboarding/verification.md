# 验证方法与验收标准：【P2】租户所有权移交与复杂离职批量单据交接 (p2-tenant-ownership-and-advanced-offboarding)

## 验证方法

1. 所有权移交单测：
   - 编写 `tenant-ownership.test.ts`：验证旧 Owner 降级、新 Owner 提升，验证整个过程始终存在至少一个有效 Owner。
2. 离职批量单据交接单测：
   - 编写 `employee-offboarding-handover.test.ts`：验证离职人员创建的订单责任人批量更新至接管人，原单据历史明细与审批流水完好无损。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] Owner 移交过程中绝不出现 0 Owner 异常。
- [ ] 离职批量单据责任人平稳交接。
- [ ] `./scripts/verify.sh` 100% 通过。
