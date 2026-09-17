# 设计系统与样式资产规范 (Design System & Semantic Tokens)

> **核心原则**：
>
> 1. **技术基础设施中立 (Headless & Neutral Infrastructure)**：
>    所有底层通用组件（`@base/ui`）与业务切片视图（`packages/features/*`）必须保持技术中立，**严禁与特定视觉风格（如工业风、极简风等）进行硬编码绑定**。
> 2. **设计语言作为外观配置 (Theme as Configuration)**：
>    设计语言、品牌色盘、圆角与密度属于项目的**外观资产/主题预设（Theme Preset / Design Tokens）**，统一通过 CSS 语义变量（CSS Variables）外挂注入，不侵入组件代码逻辑。
> 3. **100% 遵循 shadcn/ui 官方原生哲学**：
>    全面基于 Base UI Primitives (`@base-ui/react`) 的无头无障碍状态机 + Tailwind 语义 Token。排版与交互杜绝裸手写 `<div>` 或裸原生控件，框架已有的原子与复合组件必须 100% 优先复用。

---

## 1. 语义化设计令牌体系 (Semantic CSS Variables)

应用层在 `globals.css` 或主题包中定义纯语义化变量，组件源码仅消费语义 Token：

| 语义 Token                               | 说明                     | 示例用途                                  |
| :--------------------------------------- | :----------------------- | :---------------------------------------- |
| `bg-background` / `text-foreground`      | 全局基础底色与文本色     | 页面背景、默认正文字体                    |
| `bg-card` / `text-card-foreground`       | 卡片与容器表面色         | 统一一体化卡片容器、弹窗背景              |
| `bg-popover` / `text-popover-foreground` | 浮层与下拉面板底色       | Select 下拉、DatePicker 日历、Tooltip     |
| `bg-primary` / `text-primary-foreground` | 品牌主强调色与反转文本色 | 提交按钮、选中高亮、焦点标记              |
| `bg-muted` / `text-muted-foreground`     | 次要灰底与弱化说明文本   | 表头底色、副标题、禁用态、只读提示        |
| `bg-accent` / `text-accent-foreground`   | 悬浮交互与激活微强调     | 菜单 Hover、行 Hover、标签选中            |
| `border-border` / `border-input`         | 边框与输入框线框         | 表格分隔线、Input 描边、卡片边框          |
| `ring-ring`                              | 聚焦光晕环指示器         | 键盘导航与聚焦态 (`focus-visible:ring-2`) |
| `rounded-(--radius)`                     | 全局语义化圆角基准       | 随主题预设自动放大或收敛                  |

---

## 2. 风格解耦实施规约 (Decoupling Invariants)

1. **禁止硬编码非语义色值**：
   - 严禁在组件或页面中硬编码特定调色板（如 `border-[#e8eef5]`、`bg-slate-50`、`text-zinc-600`）；
   - 必须统一写作语义 Token（如 `border-border`、`bg-muted`、`text-muted-foreground`）。
2. **禁止硬编码特定设计语言假定**：
   - 不得在代码逻辑或注释中假设“当前必须为紧凑深沉的工业风”；
   - 切换主题时，只需注入不同的 CSS 变量配置文件（如 `--radius: 0.25rem` 呈现刚性高密度的工业风；`--radius: 0.75rem` 呈现柔和圆润的现代企业风），无需改动任何 TSX 组件。
3. **全量基于 shadcn 原子原语构建**：
   - 输入与表单类：统一使用 `Input`、`Textarea`、`Select`、`DatePicker`、`Checkbox`、`Switch`；
   - 布局与排版类：统一使用 `Card`、`Table`、`Dialog`、`Sheet`、`Tabs`、`Separator`、`ScrollArea`；
   - 反馈与交互类：统一使用 `Button`、`Badge`、`Tooltip`、`Alert`、`EmptyState`、`Toast`。
   - 严禁擅自用原生 HTML 标签手写简陋实现。

---

## 3. 平台 UI 基建沉淀触发机制 (UI Infrastructure Extraction Trigger)

> **智能体与开发团队行为准则**：
> 在垂直切片开发或页面实施过程中，一旦发现当前构建的组件具备以下特征之一：
>
> 1. 具备高通用性，可被 2 个以上单据或业务场景复用（如：单据行明细编辑表、阶梯定价表、审批时间线、多标签选择等）；
> 2. 补齐了框架尚未提供的标准化交互控件（如：基于 `Calendar` + `Popover` 的 `DatePicker`）；
> 3. 可以抽象为标准复合模板或无业务绑定的纯展示/输入积木；
>
> **必须主动向用户发起提问**，确认是否将其抽象并沉淀至 `@base/ui`（`packages/ui`）中，严禁私自将其封闭在特定业务切片内部造成代码腐化与重复造轮子。
