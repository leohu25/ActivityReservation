# Base UI 全量迁移矩阵

## 基线盘点

- shadcn CLI：`4.21.0`
- 当前配置：`style=new-york`、`base=radix`
- 目标配置：`style=base-nova`、`base=base`
- 当前官方组件数：46（含已生成但尚未接线的 Base UI Combobox）
- 当前含 Radix import 的 shadcn wrapper：30
- 全仓 `asChild` 调用文件：26
- 非 Radix 第三方组件按官方规则保持不动：`cmdk` Command、`sonner`、`react-day-picker` Calendar、`react-resizable-panels` Resizable。

## 迁移顺序

### 0. 叶子与多态基元 [已完成]

- Button（已适配 Base UI render 契约）
- Badge（官方原子组件保持纯净，复合层 Badge 承接业务变体）
- Breadcrumb
- Label（原生 label / Field.Label）
- Separator

### 1. 表单控件族 [已完成]

- Checkbox
- Switch
- RadioGroup + Radio
- Slider
- Toggle + ToggleGroup
- Select（已支持 Base UI 原生与 null 回调防护）
- Combobox（基于 Base UI 官方 Combobox 原子完成业务级复合封装）
- Form / Field / FormFields

### 2. 浮层族 [已完成]

- Dialog（适配 render 契约）
- AlertDialog
- Sheet
- Popover
- Tooltip
- HoverCard

### 3. 菜单与导航族 [已完成]

- DropdownMenu
- ContextMenu
- Menubar
- NavigationMenu
- Sidebar

### 4. Disclosure 与状态展示 [已完成]

- Accordion
- Collapsible
- Tabs
- Progress
- ScrollArea
- Avatar

### 5. Composite / Templates 与业务调用点 [已完成]

- Composite：form、table、tree、auth、layout、feedback
- Templates：DataTable、FormModal、DataTree
- Apps / Platform / Domains 全仓调用点适配完毕

## 关键机械映射

- `asChild` → `render={<... />}`
- `Portal > Content` → `Portal > Positioner > Popup`
- Dialog `Overlay` → `Backdrop`，`Content` → `Popup`
- `data-[state=open|closed]` → `data-open` / `data-closed` 或 starting/ending style
- Select `position="popper"` → `alignItemWithTrigger={false}`
- Accordion/Collapsible/Tabs `Content` → `Panel`
- Tabs `Trigger` → `Tab`
- Slider `Range` → `Control > Track > Indicator`
- DropdownMenu → Base UI Menu
- HoverCard → Base UI PreviewCard

## 风险点

1. 当前 `new-york` 是 legacy style，没有 `base-new-york` 对应版本；切换到 `base-nova` 会引入视觉类名差异。迁移时须保留项目语义颜色与高密度布局，不能把业务视觉变化混同于底层替换。
2. Radix 与 Base UI 的回调普遍多一个 eventDetails 参数，现有单参数处理器通常兼容，但依赖 Radix Event 的处理器必须逐个审阅。
3. Dialog、Select、Popover、Menu 的 Portal/焦点/关闭行为需浏览器人工回归。
4. Accordion、ToggleGroup 的 value 从标量变为数组；Tabs 默认激活行为变化必须记录。
5. 官方 CLI `add --all` 因 registry `questionnaire` 缺失不可用；按组件依赖顺序逐个迁移。

## 验证节奏

- 每个原子组件：wrapper LSP + `@base/ui check`
- 每个组件族：`@base/ui test`
- 每批调用点：对应业务包 check/test
- 收敛阶段：全仓 check/test/build + 浏览器关键流程
