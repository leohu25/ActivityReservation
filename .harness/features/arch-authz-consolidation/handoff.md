# 会话换手交接单：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 一句话交接

对权限体系做系统性收敛：保持契约 SSoT 主链，补齐运行时下发、超管、字段、类型、enforcement 等旁路，使「角色可配 = 页面可见 = 后端可拦」。

## 已完成

- 子智能体全量调研 + git 历史核对 + 关键文件人工复核
- 特性沙盒 context / scope / verification / progress 建立

## 下一会话从哪开始

1. 读本沙盒 context.md 问题表与 verification.md Phase 0
2. 与用户确认：是否按 Phase 1→2→3→… 顺序；P3（customer 守卫收紧）何时做
3. 执行 Phase 0 基线命令并勾选

## 关键文件速查

- 硬编码动作：`apps/tenant/src/kernel/permissions.ts:34`
- 停用按钮：`packages/features/customer-center/src/components/CustomerView.tsx` extraActions
- 角色树：`apps/tenant/src/kernel/registry.generated.ts` → `derivePermissionTree`
- 契约样例：`packages/features/customer-center/src/contracts/customer.contract.ts`
- 能力工厂：`packages/authorization/src/ability/ability-factory.ts`

## 禁止事项

- 禁止推翻契约/manifest 架构
- 禁止未确认即上线 customer 写路径收紧
