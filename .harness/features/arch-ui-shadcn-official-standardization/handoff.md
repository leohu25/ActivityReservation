# 交接与会话记录 — arch-ui-shadcn-official-standardization

## 状态简述

已全面完成 `@base/ui` 对齐 shadcn UI 官方最佳实践规范与教科书级架构重构：

1. **原子层正名**：`components/shadcn/` 目录与别名正名为官方标准的 `components/ui/`；
2. **消灭多余伪包装层**：Badge 变体与 Select 中文回显补丁已直接就地内嵌，删除 `composite/badge/` 与 `composite/form/Select.tsx`；
3. **架构扁平语义化**：解构深层嵌套的 `composite/` 和 `templates/`，收敛为 `ui/`, `data-table/`, `auth/`, `form/`, `tree/`, `layout/`, `feedback/`, `icon/`；
4. **废除冗余组件**：彻底删除废弃的 `components/ui/toast.tsx`，统一使用 `sonner`；
5. **门禁与测试**：全 Monorepo 16 个包类型检查、13/13 单元测试、以及 `node scripts/verify.mjs` 全栈门禁 100% 绿灯通过。
