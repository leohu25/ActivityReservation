# 专属验证规范：基础档案与租户业务数据字典切片 (base-archives)

## 验证执行命令

```bash
# 1. 租户 Schema 聚合同步
node scripts/sync/sync-tenant-schema.mjs

# 2. 生成 Prisma Client
pnpm --filter @base/db-tenant generate

# 3. 业务切片与应用编译检查
pnpm --filter @domain/base-archives check
pnpm --filter tenant check

# 4. 专属单元测试
pnpm --filter @domain/base-archives test

# 5. 特性自动发现同步
node scripts/sync/sync-features.mjs

# 6. 全栈门禁预检 (commit 前由 hook 自动触发)
node scripts/check/check-boundary.mjs
node scripts/check/check-entity-baseline.mjs
```

## 判定准则

1. 单元测试 100% 通过（fail-only 模式下无任何用例失败）。
2. TypeScript 严格类型检查 0 错误（严禁 any 降解）。
3. ADR-009 实体审计基线与豁免清单校验通过。
4. 前端使用 DictType 枚举常量驱动下拉查询，类型一致性 100% 编译期保证。
