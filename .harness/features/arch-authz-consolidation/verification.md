# 验证方案与验收标准：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 分阶段验收

### Phase 0 — 基线冻结

- [ ] 记录当前：角色树 action 来源、permissions.ts 硬编码、owner 特判位置清单
- [ ] 全仓 `pnpm check` + 相关包 `test` 基线全绿
- [ ] 不改行为，仅文档/沙盒

### Phase 1 — 单一动作源（P1 + P9）

- [ ] `getTenantSubjectPermissions` 从 Catalog/契约派生 action 列表，删除硬编码 6 元组
- [ ] 去掉对 `resolveRolesAndStatements` 的 unsafe cast（工厂提供公开 API）
- [ ] owner 分支同样走 catalog 派生，不再返回硬编码数组
- [ ] 单测：契约有 `export` 则下发含 export；契约无 `audit` 则 owner 也不含 audit
- [ ] 未使用 StandardAction 清理或文档标记 deprecated

### Phase 2 — 危险操作上锁（P2）

- [ ] Customer 停用/启用 extraAction 挂 `action: "update"`（或契约扩展后使用新 action）
- [ ] 无 update 权限时该菜单项不出现/不可点
- [ ] CustomerView 测试断言

### Phase 3 — 超管与类型收敛（P4 + P6）

- [ ] `buildOwnerRules(catalog)` 仅存在于 ability-factory
- [ ] permissions.ts / roles 页不再特判 owner 字符串（或过渡期 OR + 注释）
- [ ] 删除 tenant-admin 平行 PagePermissionDescriptor，re-export authorization 类型
- [ ] RolePermissionManager 展开态不再硬编码 moduleKey（由 permissionTree 驱动）

### Phase 4 — 字段三态单点（P5）

- [ ] `resolveFieldMode` 导出自 `@base/authorization`
- [ ] 工厂 computeAllowedFields 与角色 UI getFieldAccess 均调用它
- [ ] （可选）下发结构升级为 `{readable,editable}`——若做，需同步全部 View 并写迁移说明
- [ ] 单测：HIDDEN/READONLY/EDITABLE 与工厂行为一致

### Phase 5 — Enforcement 对齐（P3，需用户确认后执行）

- [ ] customer-center 写 Action：create/update/delete/export 均 `ability.can`
- [ ] 无权限返回统一 403 错误结构（与采购一致）
- [ ] 集成/单测：无 delete 权限调 deleteAction → 失败
- [ ] 采购路径回归不破坏

### Phase 6 — 约定落地与文档（P7 + P8 + P10）

- [ ] ADR：BA 只负责会话/成员，业务权限只认 CASL
- [ ] skill 更新：去掉 `canExport && <Button>` 手写范式；改为 ActionButton + hide 约定
- [ ] 约定：hide/不渲染 → 契约删 action；写入 1-contracts.md
- [ ] 契约对齐测试：View 使用 action ⊆ contract.actions（customer 三页 + 采购）
- [ ] （可选）`createPageAbility(subject, permissions)` 共享工具，View 去重

### Phase 7 — 总验收

- [ ] 全仓 `pnpm check` 13/13
- [ ] 全仓相关测试通过（ui + customer-center + tenant-admin + authorization + auth）
- [ ] `./scripts/verify.sh` 绿（由 pre-commit 保证）
- [ ] 角色配置 UI：仅出现契约声明的 action
- [ ] owner 登录：契约内按钮全可见；非授权角色：按权限隐藏
- [ ] progress.md / handoff.md / feature_list.json 证据齐全

## 回归关注点

- 登录 / 组织切换不受影响
- 客户 CRUD、停用级联、导出脱敏
- 采购订单列表与写操作
- 角色保存后立即影响按钮显隐（同一会话刷新）
