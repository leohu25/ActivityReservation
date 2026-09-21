# 特性任务看板：基础档案与租户业务数据字典切片 (base-archives)

## 一、 阶段任务分解

- [x] 登记 TenantDictItem 到 ADR-009 豁免名单 (`scripts/check/check-entity-baseline.mjs`)
- [x] 创建基础工程结构 (`packages/domains/base-archives`)
- [x] 初始化 Harness 治理文档与更新 `feature_list.json`
- [ ] 同步租户 Schema 并重新生成 TenantPrisma 客户端 (`node scripts/sync/sync-tenant-schema.mjs`)
- [ ] 定义 contract.ts（TenantDictItemSubject、权限动作、DictType 枚举常量 as const、URL 参数解析）与 schema.ts（Zod 校验）
- [ ] 实现 TenantDictItemService、queries.ts（含按 type 缓存读取的下拉选项服务）与 Server Actions（CRUD、状态启停）
- [ ] 基于 @base/ui 实现 TenantDictItemView（DataTable 列表，带 type 过滤）与 TenantDictItemFormModal（轻量新增/编辑弹窗），并编写 manifest.ts
- [x] apps/tenant 路由装配 (`/settings/dict` 或 `/archives/dict`)、特性同步与门禁验证

## 二、 实际验证记录

- 豁免名单测试通过：`node scripts/check/check-entity-baseline.test.mjs` (3/3 pass)
- 实体基线门禁通过：`node scripts/check/check-entity-baseline.mjs` (全部实体合规)
- 特性边界校验通过：`node scripts/check/check-boundary.mjs` (通过)
- 业务切片单测全绿：`pnpm --filter @domain/base-archives test` (8/8 pass)
- 业务切片与应用类型检查：`pnpm --filter @domain/base-archives check` & `pnpm --filter tenant check` (0 error)
- 特性自动发现：`node scripts/sync/sync-features.mjs` (成功注册至 apps/tenant)
