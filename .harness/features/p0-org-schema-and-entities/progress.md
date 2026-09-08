# 任务进度与执行记录：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 阶段任务清单

- [ ] 阶段 1: Researcher 审计现有 Prisma Schema、Migration 脚本与单测受影响面
- [ ] 阶段 2: Coordinator 细化 Migration SQL 与类型兼容方案
- [ ] 阶段 3: Implementer 更新 `packages/db-tenant/prisma/schema.prisma` 与 `packages/db-control/prisma/schema.prisma`
- [ ] 阶段 4: Implementer 生成 Migration SQL，更新 `TenantProvisioner` 与 SQL 基线
- [ ] 阶段 5: Implementer 适配 `department-topology.ts` 与既有集成单测
- [ ] 阶段 6: Reviewer 审查 Schema 规范合规性与 `./scripts/verify.sh` 全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义第一梯队核心数据实体规格与约束。
