# 验证方法与验收标准：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 验证方法

1. Schema 编译与客户端生成验证：
   - 执行 `pnpm --filter @chenrun/db-tenant prisma:generate` 成功；
   - 执行 `pnpm --filter @chenrun/db-control prisma:generate` 成功。
2. 自动化迁移与回归单测验证：
   - 运行 `pnpm test`，确保 `department-topology.test.ts`、`sql-executor`、`tenant-provisioner` 与现有采购业务单测全部通过。
   - 验证 `EmployeeProfile` 能够正常以 `memberId` 为空或直接填入的方式入库。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh` 确保 100% 绿色。

## 验收条件 (Definition of Done)

- [ ] `EmployeeProfile` 支持主键独立自生成，`memberId` 变为可选唯一索引，字段补齐工号、部门、岗位、上级、姓名/邮箱快照。
- [ ] `Position` 表及索引成功定义并包含在初始化迁移中。
- [ ] `Department` 包含 `leaderMemberId`、`sort` 与 `status`。
- [ ] `CompanyProfile` 表成功建立。
- [ ] Control DB `Organization` 增加 `authorizationVersion`。
- [ ] `./scripts/verify.sh` 0 错误通过。
