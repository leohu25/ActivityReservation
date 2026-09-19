# 设计系统、UI 样式架构与外挂主题规范 (Design System & UI Architecture)

> **核心架构原则**：
>
> 1. **技术基础设施中立 (Headless & Neutral UI Infrastructure)**：
>    底层通用组件库（`@base/ui` / `packages/ui`）保持绝对技术中立，**严禁与任何特定业务系统、企业品牌或具体视觉风格（如工业风、极简风、酷炫科技风等）进行硬编码绑定**。
> 2. **设计文件外挂生成 (External Design Files by UI Pro Max)**：
>    项目根目录或设计系统目录中的设计文件（如 `design-system/chenrun-digital-erp/MASTER.md`），是由 **UI Pro Max** 技能根据具体项目需求独立生成的。它作为该系统视觉语言的权威事实源，与底层技术组件库完全正交解耦。
> 3. **CSS 语义变量外挂注入 (Theme as CSS Configuration)**：
>    具体系统的视觉呈现（色彩、字体、阴影、圆角、紧凑密度），纯粹通过外挂的 CSS 预设样式表（如 `apps/tenant/src/styles/theme-industrial-erp.css`、`apps/control/src/styles/theme-cyber-tech.css`）将 CSS 语义变量注入到 `:root` 与 `.dark` 中，组件源码（TSX）零侵入。
> 4. **100% 遵循 shadcn/ui 官方原生范式**：
>    杜绝手写裸 `div` 布局或裸浏览器原生控件，所有布局、排版、表单与交互一律基于 shadcn 官方原语构建。

---

## 一、 为什么采用这套解耦架构？

本架构严格对齐 shadcn/ui 官方正统设计哲学，并服务于现代 Modular Monorepo 平台基座：

1. **符合 shadcn/ui 官方正统范式**：
   - shadcn 的核心是 **“代码所有权 + 语义设计令牌 (Semantic Tokens)”**。它底层由官方推荐的 Base UI (`@base-ui/react`) Primitives 提供无样式的无障碍状态机，上层仅消费 `bg-background`、`text-foreground`、`bg-primary`、`border-border`、`rounded-(--radius)` 等抽象语义令牌。
   - 组件内部绝不写死 `#2563EB` 等具体十六进制色值，任何风格都只是配置表。
2. **支持不同业务系统构建个性化样式**：
   - 同一套中立的 `@base/ui` 基础设施，既可支撑**租户端数据平面**运行稳重、高密度的“工业 ERP 风”；
   - 也能支撑**平台总控管控平面**运行极客、深邃的“炫酷科技风”；
   - 未来孵化医疗、消费、仓储等其他垂直 SaaS 项目时，**底层组件库零修改**，只需外挂一份由 UI Pro Max 生成的新主题 CSS 文件即可无缝换肤。

---

## 二、 架构分层模型与组件样式边界

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 外挂设计语言事实源 (Design System SSoT by UI Pro Max)                 │
│    • design-system/chenrun-digital-erp/MASTER.md (色盘、字体、阴影、密度) │
│    • 外挂生成，定义各系统的具体视觉品牌，不侵入通用组件代码              │
├────────────────────────────────────────────────────────────────────────┤
│ 2. 应用层主题预设与变量外挂 (Theme CSS Presets)                          │
│    • apps/tenant/src/styles/theme-industrial-erp.css (工业ERP风预设)    │
│    • apps/control/src/styles/theme-cyber-tech.css (总控炫酷科技风预设)    │
│    • 通过 apps/<app>/src/app/globals.css 纯外挂 @import 注入 :root/.dark │
├────────────────────────────────────────────────────────────────────────┤
│ 3. 技术中立组件库 (Neutral UI Infrastructure: @base/ui)                  │
│    • Layer 1: ui/* (官方原子 Primitives，落实 Code Ownership 与 CVA 变体) │
│    • Layer 2: data-table, auth, form, tree, layout, feedback, icon 高阶资产│
├────────────────────────────────────────────────────────────────────────┤
│ 4. 垂直业务切片层 (Vertical Slice Features)                             │
│    • packages/domains/* (纯业务切片，100% 消费 @base/ui 语义化组件)       │
└────────────────────────────────────────────────────────────────────────┘
```

### 核心澄清：基础组件“无样式”与上层复合组件“布局重置”的边界

在 shadcn/ui 官方架构中，必须严格区分 **“视觉风格 (Visual Style)”** 与 **“结构布局内衬 (Structural Layout & Padding)”**：

1. **基础原子层 (`packages/base/ui/src/components/ui/*`)**：
   - 保持官方无头原语特性，**落实源码所有权 (Code Ownership)**。支持就地通过 `cva()` 扩展语义变体（如 `badge.tsx`）与内嵌修复（如 `select.tsx`），杜绝 1:1 伪包装层。色彩完全依托语义变量（如 `bg-card`、`text-card-foreground`、`border-border`）；
   - 官方为通用展示卡片预置了基础内边距（如 `Card` 自带 `py-6`、`gap-6`）。
2. **高阶业务资产与容器层 (`packages/base/ui/src/components/{data-table,auth,form,tree,layout,feedback}/*`)**：
   - 当原子组件组装为高阶面板（例如 `TreeFilter`）时，由于内部容器 Header 拥有独立的背景色与边框，官方原子层默认的 `py-6` 会在顶部产生 24px 的空隙白条；
   - **允许且推荐的做法**：上层高阶组件通过 `className` 传入 `py-0 gap-0`（如 `<Card className="py-0 gap-0 ...">`）执行**结构布局重置 (Layout Padding Reset)**；
   - **原则核验**：只要覆盖的依然是结构尺寸或纯语义 Token，没有硬编码十六进制色值，就**绝对没有违反基础组件技术中立与无样式的红线**。开发时直接指明使用 `.agents/skills/shadcn/` 最佳范式 Skill。

---

## 三、 标准样式注入与外挂最佳实践

### 1. 目录规范 (Directory Best Practice)

- **绝对不要放在 `app/` 目录下**：`app/` 是 Next.js App Router 的专属路由树。
- **推荐位置：`src/styles/`**：平级于 `src/app/`，清晰收敛全系统的主题文件，如：
  - `apps/tenant/src/styles/theme-industrial-erp.css`
  - `apps/control/src/styles/theme-cyber-tech.css`

### 2. 应用入口接入 (`globals.css`)

在对应应用的 `src/app/globals.css` 中，只需一行干净的引入：

```css
@import "tailwindcss" source("../../../../");

/* 引入当前项目/应用的外挂主题预设 */
@import "../styles/theme-industrial-erp.css";

@custom-variant dark (&:is(.dark *));
```

---

## 四、 平台 UI 基建沉淀触发机制 (UI Infrastructure Extraction Trigger)

> **团队与智能体协作铁律**：
> 在垂直切片开发或页面重构过程中，一旦发现当前构建的组件或交互模式具备通用性（如：单据行明细编辑表格、组织拓扑导航树、审批时间线等），**严禁在切片内部私造或闭门造车，必须主动向用户发起提问**，评估并沉淀至公共 `@base/ui` 库中，确保基础设施持续沉淀、全平台最大化复用。
