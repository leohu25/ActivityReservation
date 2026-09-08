# 验证方案与验收标准：租户管理员角色与四层权限配置中心 (foundation-tenant-rbac-ui)

## 验证标准与证据

1. **类型检查与单元测试**：
   - 全仓 `pnpm check` (12/12 packages) 类型检查 0 错误。
   - `packages/db-control` 增加针对角色的 CRUD 仓储测试 (7/7 PASS)。
   - `packages/features/tenant-admin` 增加领域服务与四层矩阵组件渲染单测 (6/6 PASS)。
   - 全仓 8 个测试套件，82/82 个自动化单测 100% 全部通过。
2. **UI/UX 合规性**：
   - 遵循 `.harness/context/design-system.md` 与文档第 21、22、41 节规范。
   - 绝无 Emoji 滥用，统一使用 Lucide 矢量图标，配备 tabular-nums，纯白浮动大圆角卡片。
3. **门禁验证**：
   - `./scripts/verify.sh` 全栈门禁通过（账本合法、沙盒合规、红线扫描通过、类型检查通过）。
   - `pnpm build` 双应用（apps/control, apps/tenant）Turbopack 生产编译全部通过。
