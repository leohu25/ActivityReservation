# 特性任务看板: 平台与租户数据库 Day 0 自愈初始化

## 一、阶段任务分解

- [x] 建立统一数据库状态判定与强类型错误
- [x] 平台严格空库 Baseline、迁移台账与超管 Seed
- [x] 平台启动门禁与解耦运行时（发布态与运行态彻底解耦）
- [x] 租户 Baseline 初始化逻辑复用与可注入的首次连接兜底钩子
- [x] 咨询锁改用事务级 pg_advisory_xact_lock 并设置 lock_timeout 防止死锁
- [x] 空库检测升级为 Ledger-First 机制（兼容云厂商预装扩展表如 spatial_ref_sys）
- [x] 统一超管配置事实源（CONTROL_ADMIN_EMAILS 回退 CONTROL_BOOTSTRAP_ADMIN_EMAIL，生产 Fail-Closed）
- [x] 非空残缺库、并发去重与幂等测试
- [x] 专项类型检查、测试与交接证据

## 二、实际验证记录

- `pnpm --filter @base/db-migrate test`：18/18 PASS（新增事务级锁超时与云扩展表兼容测试）。
- `pnpm --filter @base/feature-control-admin test`：3/3 PASS（覆盖超管环境变量回退与生产 Fail-Closed 鉴权测试）。
- `pnpm --filter @base/db-tenant test`：25/25 PASS。
- `pnpm --filter @base/auth test`：15/15 PASS。
- `pnpm --filter @base/db-control test`：7/7 PASS。
- `pnpm check` (全仓 13 个包)：13/13 PASS，0 错误。
- `pnpm test` (全仓单测)：11/11 测试包全部 PASS (总计 140+ 单测全绿)。
- `./init.sh`：5 步自检全部通过，平台库 Day 0 检查输出 `Platform database is ready at 20260910141042`。
