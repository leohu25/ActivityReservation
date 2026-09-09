# 项目执行进展 (Progress Log)

> 遵循 `harness-creator` 规范：记录当前状态、完成工作与下一步指引，支持会话随时无缝重启。

---

## Current State (当前状态)

- **当前目标 (Current Objective)**: 客户中心 (feature-customer-center) 业务特性闭环与工业级数据迁移架构重构
- **当前激活特性 (Active Feature)**: `foundation-web-shell`
- **当前状态 (Status)**: DEFECT_PATCH_COMPLETED
- **最近更新时间 (Last Updated)**: 2026-09-11

---

## What Was Done (已完成工作)

1. **彻底按 Next.js 官方正统范式根治侧边栏整页刷新与展开态丢失缺陷**:
   - **根因复盘**：`@chenrun/ui` 的 `Sidebar` 原先采用伪跨框架解耦设计，默认使用 `DefaultLink`（原生 `<a>` 标签），导致菜单点击触发浏览器的**硬导航 (Hard Navigation)**，销毁整页 DOM 树与 JS 内存堆，手风琴展开状态自然丢失；
   - **拒绝胶水层与过度抽象**：彻底删除前期试验性质的 `app-sidebar.tsx` 包装层，杜绝“脱裤子放屁”式的间接引用；
   - **直接对齐官方原语**：`Sidebar.tsx` 内置 Next.js 16 原生 `next/link` 与 `usePathname()`，直接在组件内部响应路由与渲染软导航，使得 `layout.tsx` 零多余代码直接消费 `<Sidebar />`；
   - **兼顾纯 Node 单测**：支持可选 `currentPath` 覆盖，保证在非路由环境下也可进行纯函数式断言；
   - **瞬时骨架占位**：配置 `(dashboard)/loading.tsx`，遵循官方 Instant Loading States 范式。
2. **多租户基线与全栈类型自愈**:
   - 补全 `db-tenant`、`db-control` 与 `feature-customer-center` 本地 Prisma 客户端生成；
   - 全仓 `pnpm check`（Turbo 14/14 tasks）0 错误通过；
   - `packages/ui` 14/14 单元测试 100% 全部通过；
   - `node scripts/check-redlines.mjs` 192 个源码文件 0 红线违规；
   - 沉淀复盘经验至 `.harness/memory/learnings.md`（规约第 9 条：严禁假解耦与过度抽象，对齐 App Router 嵌套布局与局部渲染范式）。

---

## Next Steps (下一步计划)

1. 从 `feature_list.json` 继续认领下一阶段业务特性（如客户中心剩余交互或采购中心审批流）；
2. 运行 `./init.sh` 确保启动自检通过；
3. 开发新功能时严格受限在对应特性的 `scope.md` 白名单内。
