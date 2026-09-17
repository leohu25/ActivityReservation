# 特性验收标准 — arch-ui-base-ui-full-migration

## 一、静态验收

1. `packages/base/ui/components.json` 明确声明 Base UI。
2. `packages/base/ui/src/components/shadcn/` 已采用官方 Base UI 实现；自定义业务逻辑不进入原子层。
3. 全仓不再残留 Radix 专属调用模式，重点包括：
   - 可迁移调用点中的 `asChild`；
   - Radix 专属 `data-[state=*]` 样式；
   - 对 `radix-ui` 或 `@radix-ui/*` 的无必要直接依赖。
4. 历史 `composite/form/Combobox.tsx` 已删除或收敛为官方原子组件的稳定兼容包装，系统只保留一套标准 Combobox 交互。
5. 客户分类无数据时显示明确空状态，不渲染无内容空白浮层；有数据时支持搜索和选择。

## 二、自动化验证

```bash
pnpm --filter @base/ui check
pnpm --filter @base/ui test
pnpm --filter @base/feature-customer-center check
pnpm --filter @base/feature-customer-center test
pnpm check
pnpm test
pnpm build
```

日常阶段只运行受影响包的即时检查；全仓命令在迁移收敛阶段执行。提交由 pre-commit 门禁负责最终验证，严禁使用 `--no-verify`。

## 三、浏览器关键流程

- 客户档案新建：客户分类 Combobox 定位、搜索、空状态和选择正常。
- Dialog 内嵌 Select/Combobox：鼠标、键盘、滚轮和 Escape 正常。
- ConfirmDialog：单次确认、焦点恢复和关闭正常。
- DataTable：筛选、分页、列设置、行操作菜单正常。
- Sidebar 与动态导航：展开、折叠、Tooltip 与菜单正常。
- 租户端与管控端主要页面无 Hydration、Portal、焦点和滚动锁异常。

## 四、完成判定

- 类型检查、测试和构建全部通过。
- 关键浏览器流程通过。
- Radix 依赖清理完成或对保留项提供明确理由。
- `progress.md`、`handoff.md`、迁移报告和 `feature_list.json` 证据完整。
- 用户完成修改清单审阅并明确允许提交。
