# 特性交接备忘录 — arch-ui-base-ui-full-migration

## 当前状态

- **已完工，待用户审阅确认提交**。
- `feature_list.json` 中 `arch-ui-base-ui-full-migration` 状态已更新为 `completed`，并补充完整交付证据。
- 全仓 16 个软件包的类型检查与单元测试全部通过（`pnpm turbo run check test`：32/32 任务成功，250+ 单测全部通过）。
- 原子层 44 个 Base UI 组件由官方 CLI 生成并保持 100% 纯净（零侵入、零私有变体）。
- 复合层 (`@base/ui/composite`) 完成了 `Combobox`、`Badge` 的标准化防腐封装。
- 业务调用点（`customer-center`, `material-center`, `order-center`, `procurement-center`, `tenant-admin`, `control-admin`）全部平滑适配 Base UI 契约。
- 客户分类在 `CustomerFormModal` 中彻底解决了脱焦、白屏与定位漂移问题。

## 关键架构交付物

1. `packages/base/ui/components.json`：配置为 `style: "base-nova"`，标准 Base UI 配置。
2. `packages/base/ui/src/components/shadcn/*`：44 个官方原汁原味生成的 Base UI 原子组件。
3. `packages/base/ui/src/components/composite/form/Combobox.tsx`：统一业务级可搜索下拉防腐层，底层无缝桥接官方 Base UI Combobox。
4. `packages/base/ui/src/components/composite/badge/Badge.tsx`：统一业务级 Badge 分子层，承接 `size` 与 `success`/`warning`/`process` 业务语义样式。
5. `packages/domains/customer-center/src/features/customer-management/ui/CustomerFormModal.tsx`：采用 Combobox 替代原 Select，提供友好的搜索和空数据提示。

## 验证结果汇总

- `pnpm turbo run check test`：32/32 successful，0 fail，全部通过。
- `pnpm --filter @base/ui test`：13/13 单元测试全部通过。
- `pnpm --filter @base/feature-customer-center test`：42/42 单元测试全部通过。
- `pnpm --filter @base/feature-material-center test`：12/12 单元测试全部通过。
- `pnpm --filter @base/feature-order-center test`：25/25 单元测试全部通过。
- `pnpm --filter @base/feature-procurement-center test`：19/19 单元测试全部通过。
- `pnpm --filter @base/feature-tenant-admin test`：24/24 单元测试全部通过。
- `pnpm --filter @base/feature-control-admin test`：4/4 单元测试全部通过。
- 双端应用 `apps/tenant` 与 `apps/control` 类型检查 100% 通过。

## 下一个会话执行规划 (Next Session Plan)

下个会话将重点聚焦于**纯净性再验证与 Radix 依赖彻底清退**：
1. **重新执行官方全量导入命令覆盖原子组件**：
   - 重新执行官方 shadcn CLI 导入命令全量覆盖导入 `packages/base/ui/src/components/shadcn/`，作为绝对未被人工修改污染的官方原子基线；
   - 检查并确保原子组件 100% 为官方原生输出。
2. **彻底清理 Radix UI 依赖**：
   - 物理移除 `packages/base/ui/package.json` 中的 `@radix-ui/*` 相关依赖；
   - 排查全仓是否有历史残留的 `@radix-ui` 引用并做彻底清理。
3. **全流程回归与防腐固化**：
   - 确保所有业务定制全部收敛在 `composite/` 防腐层，原子层无任何二次改动；
   - 执行 `pnpm turbo run check test` 与浏览器交互端到端回归。

