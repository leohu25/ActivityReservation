# 验证方案与验收标准：租户组织人事模型与四层权限底层对齐 (foundation-tenant-rbac-core)

## 验证标准与证据

1. **类型检查与单元测试**：
   - 全仓 `pnpm check` (11/11 packages) 类型检查 0 错误。
   - `packages/db-tenant` 增加针对 EmployeeProfile 与部门拓扑解析的单元测试 (18/18 PASS)。
   - `packages/authorization` 增加元数据自描述、四层角色解析的单元测试 (29/29 PASS)。
   - `packages/ui` 增加针对 AuthorizedField 组件自动 Ability 感应的测试 (7/7 PASS)。
   - 全仓 7 个测试套件，75/75 个自动化单测 100% 全部通过。
2. **端到端门禁**：
   - `./scripts/verify.sh` 执行全部通过（账本合法、沙盒合规、红线扫描通过、类型检查通过）。
   - `pnpm build` 双应用（apps/control, apps/tenant）Turbopack 生产编译全部通过。
