# 任务进度与执行记录：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 总状态

- [x] Phase 0 基线
- [x] Phase 1 单一动作源（契约派生）
- [x] Phase 2 危险操作上锁（toggle_status）
- [x] Phase 3 超管与类型收敛
- [x] Phase 4 字段三态单点
- [x] Phase 5 Enforcement（customer-center 全量 CASL）
- [x] Phase 6 ADR-007 + skill 手册更新
- [x] Phase 7 总验收

## Phase 7 证据（2026-09-12）

- `pnpm -r check`：13/13 包 tsc 通过
- `pnpm -r test`：shared 14、db-control 7、db-tenant 25、ui 31、db-migrate 18、auth 15、authorization 39、control-admin 3、tenant-admin 13、procurement 12、customer-center 12 — 全部 pass 0 fail
- customer-center test 脚本修正为带引号 glob，确保递归用例纳入
- `feature_list.json` 状态 → completed

## 终态链路

```
页面契约 actions（标准 + 自定义）
  → manifest → Catalog / 角色树 / Nav
  → getTenantSubjectPermissions（契约派生，无硬编码白名单）
  → 前端 ActionButton / RowActions（同 action）
  → Server Action assertAbility（同 action）
  → 字段三态 resolveFieldAccess / isFieldAllowedForAction 单点
  → owner 仅 buildOwnerActionRules
  → BA 只负责会话/成员（ADR-007）
```
