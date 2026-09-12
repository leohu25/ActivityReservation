# 宸润数智 ERP 设计系统规范与 shadcn/ui 实施宪法 (Chenrun Modern Industrial Design System)

> **设计系统定位**：专为数字化中央厨房、高端离散制造与生鲜供应链量身打造的**现代轻量科技数智风 (Clean Crisp Modern Industrial Cockpit)**。
> **强制 UI 框架**：**全工程统一强制采用 `shadcn/ui` (基于 Tailwind CSS v4 + CVA + Radix 原生语义 + Lucide 图标)**。
> **AI 协同法则**：所有 AI 智能体（Coordinator, Implementer, Reviewer）在生成或重构前端 UI 页面与组件时，**必须无条件遵循本规范与 shadcn/ui 组件规范**，禁止随意引入第三方未经审核的 UI 库或散写内联样式。

---

## 一、 整体设计哲学与视觉基调

1. **通透纯净与低认知负荷 (Airy & Crisp Minimalist Cockpit)**：
   - 拒绝沉闷灰暗与杂乱无章，整体底色采用极浅冷灰蓝背景（`#F4F7FB` / CSS `--background`），衬托纯白浮动卡片；
   - 视觉层级清晰，呼吸感充沛，通过微边框（`#E8EEF5`）与极微柔和阴影划分区域，而非大面积深色背景。
2. **纯白浮动卡片 (Floating Pure White Surface)**：
   - 主体容器与信息卡片统一使用 `#FFFFFF`（CSS `--card`）；
   - 标配极微边框（`border border-slate-100` 或 `#E8EEF5`）与柔和弥散投影（`shadow-xs` 或 `shadow-[0_1px_3px_rgba(15,23,42,0.03)]`）；
   - 悬停交互带有平滑微抬升反馈（`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`）。
3. **现代大圆角体系 (Soft Modern Geometry)**：
   - 主屏面板/Banner/主看板：`rounded-2xl` (16px) ~ `rounded-3xl` (24px)；
   - 业务卡片/列表容器/对话框：`rounded-xl` (12px) ~ `rounded-2xl` (16px)；
   - 按钮/输入框/下拉菜单：`rounded-lg` (8px)；
   - 状态微徽章/过滤胶囊/搜索栏：`rounded-full` (Pill)。
4. **高密度信息的可视化降噪 (High Density with Low Cognitive Load)**：
   - 数字指标统一大字号加粗 + 等宽排版（`tabular-nums font-bold tracking-tight`）；
   - 状态标记采用“彩色浅底 + 深色文字/图标”微型圆角胶囊，告别生硬纯色块；
   - 复杂流程使用横向步进图（Process Pipeline）表达，清晰呈现当前瓶颈与节点进度。

---

## 二、 全局主题与 shadcn/ui CSS 变量体系

全应用统一遵循 shadcn/ui 官方 CSS 变量命名契约，位于各应用 `globals.css` 中：

```css
:root {
  /* 基础画布与文字 */
  --background: #F4F7FB;          /* 极浅冷灰蓝底色 */
  --foreground: #0F172A;          /* Slate-900 主文本 */
  
  /* 卡片与浮层 */
  --card: #FFFFFF;                /* 纯白卡片表面 */
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;
  
  /* 品牌主色 (科技皇家蓝) */
  --primary: #1864F5;             /* 核心品牌蓝 (主操作、激活项、当前节点) */
  --primary-foreground: #FFFFFF;
  
  /* 次级与静音色 */
  --secondary: #F1F5F9;           /* Slate-100 次级色块 */
  --secondary-foreground: #0F172A;
  --muted: #F8FAFC;
  --muted-foreground: #64748B;    /* Slate-500 辅助文字 */
  
  /* 交互强调与微背景 */
  --accent: #EFF6FF;              /* Blue-50 浅蓝背景 */
  --accent-foreground: #1864F5;
  
  /* 告警破坏色 */
  --destructive: #EF4444;         /* 危险红 */
  --destructive-foreground: #FFFFFF;
  
  /* 边框与输入框 */
  --border: #E8EEF5;              /* 细腻浅冷灰边框 */
  --input: #E2E8F0;
  --ring: #1864F5;
  --radius: 1rem;                 /* 默认 16px 大圆角 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0B0F19;
    --foreground: #F8FAFC;
    --card: #111827;
    --card-foreground: #F8FAFC;
    --popover: #111827;
    --popover-foreground: #F8FAFC;
    --primary: #3B82F6;
    --primary-foreground: #FFFFFF;
    --secondary: #1F2937;
    --secondary-foreground: #F8FAFC;
    --muted: #1F2937;
    --muted-foreground: #94A3B8;
    --accent: #1E293B;
    --accent-foreground: #60A5FA;
    --destructive: #DC2626;
    --destructive-foreground: #FFFFFF;
    --border: #1F2937;
    --input: #374151;
    --ring: #3B82F6;
  }
}
```

---

## 三、 制造业与央厨业务语义色表 (Domain Semantics)

针对中央厨房、食品加工与数字化制造，在 shadcn/ui 的基础上预设 5 类标准化语义微徽章与背景色彩：

| 业务领域 | 语义用途 | 强调色 (Text/Icon) | 浅色底 (Background) | 边框 (Border) | 实际应用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **达成 / 合格 / 正常** | `success` | `#059669` (Emerald-600) | `#ECFDF5` (Emerald-50) | `#A7F3D0` | 达成率 94.2%、质检合格、系统正常 |
| **预警 / 缺口 / 临期** | `warning` | `#D97706` (Amber-600) | `#FFFBEB` (Amber-50) | `#FDE68A` | 原料缺口 186kg、采购待处理 |
| **紧急 / 超期 / 阻断** | `destructive` | `#DC2626` (Red-600) | `#FEF2F2` (Red-50) | `#FECACA` | 批次临期、高优待办、阻断异常 |
| **计划 / 审核 / 工艺** | `process` | `#6366F1` (Indigo-600) | `#EEF2FF` (Indigo-50) | `#C7D2FE` | 生产执行流程节点、生产任务确认 |
| **物流 / 履约 / 调度** | `dispatch` | `#0284C7` (Sky-600) | `#F0F9FF` (Sky-50) | `#BAE6FD` | 鄞州一线装车、履约交付节点 |

---

## 四、 核心组件规范与代码契约 (All from `@base/ui`)

所有组件统一从 `@base/ui` 导出，严禁直接手写散乱类名：

```tsx
import { 
  Button, 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, 
  Input, 
  WelcomeHero, 
  MetricCard, 
  ProcessStepper, 
  ExceptionList 
} from "@base/ui";
```

### 1. `Button` 按钮规范

必须使用 `class-variance-authority` 管理变体：

- `variant="default"`：高饱和度科技蓝 (`bg-[#1864F5] text-white shadow-xs hover:bg-blue-700`)，用于关键 CTA，如“待审批事项”；
- `variant="outline"`：纯白背景细灰边 (`border-slate-200 bg-white text-slate-700 hover:bg-slate-50`)，用于次要操作，如“我的任务”；
- `variant="secondary"`：浅色微底 (`bg-slate-100 text-slate-900 hover:bg-slate-200/80`)；
- `variant="ghost"`：无边框悬停显底 (`hover:bg-slate-100 text-slate-600`)；
- `variant="pill"`：胶囊型微按钮 (`rounded-full px-3 py-1 text-xs`)。

### 2. `Card` 卡片规范

遵循纯白大圆角浮动卡片设计：

- 默认容器：`rounded-2xl border border-slate-100 bg-white shadow-xs`；
- 间距：内部内边距统一 `p-5` 或 `p-6`；
- 标题排版：`text-sm font-bold text-slate-800`，副标题 `text-xs text-slate-400 font-normal`。

### 3. `Badge` 徽章与标签规范

- 变体支持：`default`（蓝）、`secondary`（浅灰）、`destructive`（红）、`outline`、`success`（翠绿）、`warning`（琥珀橙）、`process`（靛青紫）、`dispatch`（天青蓝）；
- 统一小胶囊形态：`rounded-full px-2.5 py-0.5 text-xs font-semibold border`。

### 4. `MetricCard` KPI 紧凑指标卡

专门用于顶部横向指标栏（如“今日订单 20单 +8.2%”、“计划生产 3.86吨”）：

```tsx
<MetricCard
  title="计划生产"
  icon={<Activity className="size-4" />}
  value="3.86"
  unit="吨"
  badgeText="完成 75%"
  badgeVariant="success"
  iconBg="bg-blue-50 text-blue-600"
/>
```

### 5. `ProcessStepper` 业务全链路流程图

完整覆盖央厨供应链 6 大环节：`01 客户需求` ➔ `02 生产汇总` ➔ `03 原料保障` ➔ `04 生产执行` ➔ `05 质量放行` ➔ `06 履约交付`。
支持节点高亮蓝色发光圆圈、状态徽标及底部指标卡（经营目标、最大风险、现场负荷）。

### 6. `ExceptionList` 待办与异常决策中心

展示分级标签（高/中/审/配），支持精准导航到对应中心。

---

## 五、 AI 前端生成必须遵循的红线检查单

任何 AI 在交付前端页面代码前，必须对照本检查单自查通过：

1. [ ] **必须且仅使用 `shadcn/ui` 体系与 `@base/ui` 导出组件**；
2. [ ] **严禁使用 Emoji 作为界面图标**，必须使用 `lucide-react` 矢量图标；
3. [ ] **所有数字必须包含 `tabular-nums`**，防止数据跳动；
4. [ ] **所有可点击元素必须包含 `cursor-pointer` 与平滑 Hover 动效**；
5. [ ] **文本颜色严格遵循层级**：主文本 `text-slate-900`，次文本 `text-slate-500`，元信息 `text-slate-400`，严禁在浅色背景使用低对比度字体；
6. [ ] **代码注释必须使用规范中文**。
