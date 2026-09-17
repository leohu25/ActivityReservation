# 特性背景与目标 — arch-ui-base-ui-full-migration

## 一、目标背景

当前 `@base/ui` 已形成 shadcn 原子层、Composite 复合层、Templates 模板层三层体系，但底层主要采用 Radix UI。shadcn 官方现已将 Base UI 作为新项目默认实现，同时继续支持 Radix。鉴于当前业务规模和调用面仍可控，本特性选择在迁移成本最低窗口完成全量 Base UI 统一，避免未来派生项目和新增切片继续扩大双栈维护成本。

## 二、核心目标

1. 将 `packages/base/ui/components.json` 明确配置为 Base UI。
2. 将 shadcn 原子组件按官方 Base UI 实现迁移，保持原子层纯净。
3. 系统改造 Radix 与 Base UI API 差异，包括但不限于：
   - `asChild` → `render`；
   - `onOpenChange` 事件签名与受控状态；
   - Portal、Positioner、Popup 组合结构；
   - `data-[state=*]` → Base UI 状态属性；
   - Select、Combobox、Dialog、Popover 等浮层定位与焦点行为。
4. 将历史 `composite/form/Combobox.tsx` 迁移至官方 shadcn Base UI Combobox，提供搜索、清除、禁用和无数据状态。
5. 迁移 `@base/ui` Composite/Templates 以及 apps、platform、domains 中全部调用点。
6. 移除无调用残留的 Radix 依赖，通过类型、单测、构建和浏览器关键流程回归。

## 三、实施原则

- 全量迁移是最终目标，实施按组件族推进，每一阶段保持可编译、可测试。
- 原子层采用官方 shadcn Base UI 源码，不在原子层写入业务逻辑。
- 现有视觉语义变量和工业风组合层 API 尽量保持兼容；确需行为变化时明确记录。
- 不混入 Next.js、Prisma、ESLint、TypeScript 等无关全仓依赖升级。
- 不执行 `git commit`，直到用户审阅修改清单并明确确认。
