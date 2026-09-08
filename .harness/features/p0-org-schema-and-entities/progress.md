# 任务进度与执行记录：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 阶段任务清单

- [x] 阶段 1: Researcher 审计现有 Prisma Schema、Migration 脚本与单测受影响面
- [x] 阶段 2: Coordinator 细化 Migration SQL 与类型兼容方案
- [x] 阶段 3: Implementer 更新 `packages/db-tenant/prisma/schema.prisma` 与 `packages/db-control/prisma/schema.prisma`
- [x] 阶段 4: Implementer 生成 Migration SQL，更新 `TenantProvisioner` 与 SQL 基线
- [x] 阶段 5: Implementer 适配 `department-topology.ts` 与既有集成单测
- [x] 阶段 6: Reviewer 审查 Schema 规范合规性与 `./scripts/verify.sh` 全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义第一梯队核心数据实体规格与约束。
- 2026-09-08: 重构 packages/db-tenant/prisma/schema.prisma：
  - 增强 Department：增加 leaderMemberId, sort, status 及状态索引；
  - 新增 Position 模型：包含编码唯一索引、排序、状态及员工关联；
  - 重构 EmployeeProfile 模型：主键自生成 cuid，memberId 改为可选唯一索引（nullable），补齐 userId、invitationId、positionId、managerEmployeeId、nameSnapshot、emailSnapshot、joinedAt、terminatedAt 与自关联；
  - 新增 CompanyProfile 实体：包含企业全称、简称、税号、法人、联系方式、时区与本位币。
- 2026-09-08: 在 packages/db-control/prisma/schema.prisma 的 Organization 增加 authorizationVersion 字段。
- 2026-09-08: 生成 Prisma Client 客户端，增加 202609080002_org_entities_and_positions 物理库迁移脚本，同步升级基线初始化 SQL。
- 2026-09-08: 适配 department-topology.ts 使其兼容 EmployeeProfile.memberId 为 nullable 的契约。
- 2026-09-08: 编写 schema-entities.test.ts 专属单测，全仓 9 套件 89/89 单测 100% 通过，12 个包类型检查 0 错误，全栈门禁 verify.sh 验证通过。
