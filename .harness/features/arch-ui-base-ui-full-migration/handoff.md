# 特性交接备忘录 — arch-ui-base-ui-full-migration

## 当前状态

- **已完工，待用户审阅确认提交**。
- `feature_list.json` 中 `arch-ui-base-ui-full-migration` 状态已更新为 `completed`，并补充完整交付证据。
- 全仓 16 个软件包的类型检查与单元测试全部通过（`pnpm turbo run check test`：32/32 任务成功，250+ 单测全部通过）。
- 原子层全部 Base UI 组件通过官方 CLI 全量覆盖生成，并保持 100% 官方原汁原味纯净（零侵入、零私有变体、零人工修改）。
- 全仓彻底清退 Radix UI 依赖（已从 `packages/base/ui/package.json` 移除 `@radix-ui/react-slot` 与 `radix-ui`，全仓生产代码零 `@radix-ui` 引用，pnpm 依赖净减少 45 个包）。
- 清除历史遗留 `form.tsx`（原 Radix 依赖），全面收敛至 Base UI 原生 `field.tsx` 与复合层 `FormFields` / `FormModal`。
- 复合层 (`@base/ui/composite`) 标准化防腐封装 Combobox 与 Badge。
- 业务调用点（`customer-center`, `material-center`, `order-center`, `procurement-center`, `tenant-admin`, `control-admin`）全部平滑适配 Base UI 契约。
- 客户分类在 `CustomerFormModal` 中彻底解决了脱焦、白屏与定位漂移问题。

## 关键架构交付物

1. `packages/base/ui/components.json`：配置为 `style: "base-nova"`，标准 Base UI 配置。
2. `packages/base/ui/src/components/shadcn/*`：官方原汁原味生成的 Base UI 原子组件（包括最新补充的 aspect-ratio, drawer, input-otp, spinner, item, kbd, direction 等）。
3. `packages/base/ui/package.json`：彻底剔除 Radix UI 依赖。
4. `packages/base/ui/src/components/composite/form/Combobox.tsx`：统一业务级可搜索下拉防腐层，底层无缝桥接官方 Base UI Combobox。
5. `packages/base/ui/src/components/composite/badge/Badge.tsx`：统一业务级 Badge 分子层，承接 `size` 与 `success`/`warning`/`process` 业务语义样式。
6. `packages/domains/customer-center/src/features/customer-management/ui/CustomerFormModal.tsx`：采用 Combobox 替代原 Select，提供友好的搜索和空数据提示。

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
- 全仓代码静态扫描：生产代码中零 `@radix-ui` / `radix-ui` 导入。
