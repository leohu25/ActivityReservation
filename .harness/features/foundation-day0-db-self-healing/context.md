# foundation-day0-db-self-healing: 平台与租户数据库 Day 0 自愈初始化

## 一、业务目标与需求背景

本特性解决新环境首次启动时 PostgreSQL 物理库已创建但没有业务表，应用直到首次查询 Better Auth `session` 等表才抛出 Prisma `P2021` 的问题。

开发与生产采用同一套运行时机制：严格空库自动应用已提交、带校验和的最新 Baseline，随后执行幂等种子数据；完整库直接放行；非空残缺库阻断并告警；已有库的增量迁移仍走显式发布流程。

## 二、核心功能用例

- 平台库严格空库时，应用启动前自动应用 platform Baseline，登记迁移台账并创建初始超管。
- 标准启动入口遗漏 ensure 时，平台认证运行时首次访问前执行进程内去重兜底。
- 新租户开通或已登记租户指向严格空库时，复用 tenant Baseline 与现有 ROOT/岗位/Owner Seed 完成初始化。
- 多副本并发初始化由 PostgreSQL advisory lock 串行化。
- 非空但缺少关键表、台账冲突或 checksum 不一致时禁止自动补齐。

## 三、安全与运维边界

- 运行时消费 `tooling/db-migrate/generated/runtime-catalog.ts`，不依赖 Prisma CLI 或绝对文件路径。
- 自动结构修改仅允许发生在严格空库。
- 平台初始超管凭据来自受保护环境变量，不硬编码密码、不打印敏感值。
- Day 1+ 增量迁移不随应用请求自动执行。
