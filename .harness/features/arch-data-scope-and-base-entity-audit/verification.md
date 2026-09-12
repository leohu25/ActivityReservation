# 专属验证规范：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 验证执行命令

```bash
# 1. 验证实体基础字段与软删除规范门禁
node scripts/check-entity-baseline.mjs

# 2. 执行客户中心专属单测（含数据范围权限过滤与软删除断言）
pnpm --filter @base/feature-customer-center test

# 3. 执行全栈类型检查
pnpm check

# 4. 执行全栈门禁自检
./scripts/verify.sh
```

## 判定准则

1. 业务实体 Schema 必须具备完整的创建人、归属部门和软删除字段；
2. 单元测试 100% 通过（仅本人/本部门/全租户测试场景全部绿灯）；
3. TypeScript 类型检查 0 错误；
4. 软删除记录在任何业务只读查询中默认物理隔离不可见。
