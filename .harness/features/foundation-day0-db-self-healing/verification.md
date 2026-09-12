# 专属验证规范: 平台与租户数据库 Day 0 自愈初始化

## 验证执行命令

```bash
pnpm --filter @base/db-migrate test
pnpm --filter @base/db-migrate check
pnpm --filter @base/db-control test
pnpm --filter @base/db-control check
pnpm --filter @base/db-tenant test
pnpm --filter @base/db-tenant check
pnpm --filter @base/auth test
pnpm --filter @base/auth check
```

## 判定准则

1. 严格空库自动应用最新 Baseline 与幂等 Seed。
2. 完整库重复 ensure 不重复初始化。
3. 非空残缺库、checksum 冲突和连接失败均阻断且不修改业务表。
4. 多副本/并发调用最多执行一次 Baseline。
5. 平台 Bootstrap Secret 不泄露，租户 Seed 与 Control DB 拓扑一致。
6. 变更文件 TypeScript/LSP 诊断无阻断错误。
