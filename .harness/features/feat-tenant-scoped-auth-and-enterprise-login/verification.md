# 专属验证规范 — feat-tenant-scoped-auth-and-enterprise-login

## 验证执行命令

```bash
# 1. 单元测试校验 (数据库迁移与种子)
pnpm --filter @tool/db-migrate test
pnpm --filter @base/db-tenant test

# 2. 平台管理与租户端单测
pnpm --filter @platform/control-admin test
pnpm --filter @platform/tenant-admin test

# 3. 认证端与应用类型检查
pnpm --filter @base/auth check
pnpm --filter control check
pnpm --filter tenant check

# 4. 全栈门禁验证 (commit 前物理钩子自动触发)
node scripts/verify.mjs
```

## 判定准则

1. 密码覆盖防护：在开通新租户时，若输入已存在的老用户邮箱与新密码，老用户的既有密码 100% 保持不变，且新租户 Owner 成功挂载。
2. 种子单源与原子性：租户物理库种子执行仅依托 `tenant-seed.sql`，执行完毕后 department、position、employee_profile 三表原子就绪。
3. 咨询锁健壮性：租户开辟过程中的并发重入被 `pg_advisory_xact_lock` 完美序列化，并在事务结束（commit/rollback）后自动安全释放。
