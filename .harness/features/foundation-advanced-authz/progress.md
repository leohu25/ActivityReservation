# 特性任务看板：数据与字段权限引擎 (foundation-advanced-authz)

- [x] 在 `AGENTS.md` 中持久化架构规范：高内聚低耦合单一职责、全中文代码注释规范、TypeScript 强类型与零 any 纪律
- [x] 实现基于 `@casl/ability` 与 `@casl/prisma` 的五种数据范围引擎 (`data-scope.ts`)
  - 支持 `SELF`, `DEPT`, `DEPT_TREE`, `CUSTOM`, `ALL`
  - 缺失上下文数据时强制 Fail-Closed 安全关闭
  - 多角色范围条件通过 OR 并集自动融合
- [x] 实现字段权限读写拦截策略 (`field-policy.ts`)
  - 推导 `HIDDEN`, `READONLY`, `EDITABLE` 三态
  - `pickReadableFields` 剥离隐藏敏感字段
  - `assertEditableFields` 拦截对非编辑或只读字段的越权写入并抛出 `ForbiddenError`
- [x] 实现基于 `@casl/prisma` 的查询下推提取器 (`prisma-access.ts`)
  - `getAccessibleWhere` 提取 Prisma 兼容的 `where` 对象
  - 对 CASL 拒绝结果 `{ OR: [] }` 或异常严格执行 Fail-Closed
- [x] 扩展 `CaslAbilityFactory` (`ability-factory.ts`)
  - 统一编译生成带 Data Scope 条件与 Field Policies 的 `PrismaAbility`
  - 精确按 Action 过滤隔离数据范围，防止读权限污染写权限
  - 写操作 (`create`, `update`) 严格仅允许 `EDITABLE` 字段
- [x] 编写全矩阵专属单测与异常边界测试 (27/27 PASS)
- [x] 派发独立 Reviewer 智能体进行审查并严格闭环修复所有意见，最终取得 PASS 裁决
- [x] 门禁验证 (`./scripts/verify.sh`、`./init.sh`、`pnpm check` 8/8) 100% 通过

## 验证记录

- 单元测试：`pnpm test` (39/39 PASS，其中 authorization 27/27 全部通过)
- 实库集成：`pnpm --filter @chenrun/authorization test:integration` (1/1 PASS)
- 类型检查：`pnpm check` (8/8 packages 全部通过)
- 门禁自检：`./scripts/verify.sh` (边界合规、40 个源码无红线违规全部通过)
- 环境自检：`./init.sh` (环境健康可重启)
- Reviewer 独立审计：OK (PASS / Merge verdict OK)
