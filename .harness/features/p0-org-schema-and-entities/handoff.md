# 换手交接单：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 状态总览

- 当前状态: COMPLETED (实施与 Reviewer 独立审计均已完成)
- 负责人: @implementer -> @coordinator
- 前置依赖: `procurement-center` (已就绪)
- 后续承接特性: `p0-tenant-seed-and-provisioning`

## 实施交付物清单

1. `packages/db-tenant/prisma/schema.prisma`：
   - 增强 `Department`（补充 `leaderMemberId`、`sort`、`status`）；
   - 新增 `Position` 实体（编码唯一索引、排序、状态，实现 Position != Role 解耦）；
   - 重构 `EmployeeProfile`（主键独立自生成 cuid、`memberId` 变为可空唯一索引、补齐 `userId`、`invitationId`、`employeeNo`、`departmentId`、`positionId`、`managerEmployeeId` 自关联外键、`nameSnapshot`、`emailSnapshot`、`status`、`joinedAt`、`terminatedAt`）；
   - 新增 `CompanyProfile` 实体（企业私有资料：全称、简称、信用代码、法人、地址、联系电话、币种、时区）。
2. `packages/db-control/prisma/schema.prisma`：
   - `Organization` 新增 `authorizationVersion Int @default(1)`。
3. `tooling/tenant-migrate/migrations/202609080002_org_entities_and_positions/`：
   - 落地安全幂等迁移脚本与回滚脚本。
4. `packages/db-tenant/src/schema-entities.test.ts`：
   - 新增完整实体与字段覆盖测试，全仓 9 个测试套件 89/89 单测 100% 通过。
5. Reviewer 独立审计：
   - 独立 Reviewer 智能体审计结论为 **PASS (OK with notes)**，无越界修改，类型安全 100%。

## 移交至下阶段注意事项

下一特性 `p0-tenant-seed-and-provisioning` 开通租户时，可直接使用本次新增的模型，向租户库注入 ROOT 部门、3 个默认岗位字典与 Owner 的 EmployeeProfile。
