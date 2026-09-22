# 验证用例与验收证据 — central-kitchen-phase1-entities-and-domains

## 验收检查清单与真实证据

1. **实体规范性 (ADR-009)**:
   - 23 张租户业务表全部具备 ADR-009 8 大审计与软删除字段；
   - `node scripts/check/check-entity-baseline.mjs` 100% 通过（全部业务实体审计与软删除规范校验通过）。

2. **Schema 聚合机制与逻辑外键**:
   - `packages/runtime/db/scripts/sync-schema.mjs` 正常执行，成功汇总 5 大业务域（23 张表）至集中租户 Schema；
   - `node scripts/check/check-relation-mode.mjs` 校验通过，100% 遵守 `relationMode = "prisma"`。

3. **多租户迁移引擎**:
   - 生成迁移 `20260922130156_add_central_kitchen_phase1_entities`；
   - `pnpm db:migrate:check` 验证一致性通过；
   - `pnpm db:tenant:diff` 校验通过（0 结构漂移）。

4. **编译与垂直切片完整性**:
   - `pnpm check` 25/25 任务成功；
   - `pnpm test` 21/21 测试套件全量通过 (390+ 单测无失败)；
   - `node scripts/verify.mjs` 15 项门禁全部绿灯。
