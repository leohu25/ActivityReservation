# 专属验证规范与证据：数据与字段权限引擎 (foundation-advanced-authz)

## 验证结果

| 检查项 | 命令 | 结果 |
| :--- | :--- | :--- |
| Authorization 单元测试 | `pnpm --filter @chenrun/authorization test` | PASS，27/27 用例全部通过 |
| 全仓单元测试 | `pnpm test` | PASS，39/39 用例全部通过（auth 10 + authorization 27 + db-control 4 - db-tenant 8） |
| PostgreSQL 17 实库集成测试 | `pnpm --filter @chenrun/authorization test:integration` | PASS，1/1 用例通过 |
| 全仓 TypeScript 类型检查 | `pnpm check` | PASS，8/8 模块 0 错误 |
| 全栈极速门禁 | `./scripts/verify.sh` | PASS，边界合规，40 个源码无红线违规 |
| 环境可重启性自检 | `./init.sh` | PASS，环境完好可重启 |
| Reviewer 独立审查 | 独立 reviewer 子智能体审计 | PASS / Merge verdict OK |

## 关键断言与安全证据

1. **高内聚、低耦合与单一职责**：数据范围计算与字段过滤仅依赖 `@casl/ability` 与 `@casl/prisma`，通过 `DataScopeFieldMapping` 抽象实体字段，底座完全解耦于具体的采购业务表。
2. **TypeScript 强类型与零 any 纪律**：全模块移除所有滥用 `any` 声明，必要的底层库断言均附带 `// SAFETY:` 详细说明。
3. **Fail-Closed 绝对安全关闭**：
   - `SELF` 模式空 `userId` 严格返回 `{ [userIdField]: "__NO_USER_FAIL_CLOSED__" }`，防止全表越权查询；
   - `DEPT` 缺失 `departmentId`、`DEPT_TREE` 空部门树、`CUSTOM` 空枚举列表均返回 Fail-Closed 过滤条件；
   - `@casl/prisma` 拒绝结果 `{ OR: [] }` 统一归一化为 `{ AND: [{ id: "__NO_PERMISSION_FAIL_CLOSED__" }] }`。
4. **Action 维度精确隔离**：数据范围过滤严格根据 `(!s.action || s.action === grant.action)` 精确下推，彻底杜绝读权限（如部门树）污染写权限（如本人）的漏洞。
5. **字段读写三态拦截**：`pickReadableFields` 剥离隐藏字段，`assertEditableFields` 拦截对只读与隐藏字段的写入并抛出 `ForbiddenError`。写操作（`create` 与 `update`）严格仅允许 `EDITABLE` 字段。
