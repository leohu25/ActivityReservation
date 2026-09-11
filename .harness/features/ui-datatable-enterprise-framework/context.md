# ui-datatable-enterprise-framework 上下文说明与对齐规格

## 1. 业务与技术目标

升级 `@chenrun/ui` 的复合积木化数据表格体系（DataTable），彻底终结现有页面中“搜索框、操作按钮与表格孤立散落、和页面底色融为一体、缺乏层次感与整体感”的粗糙视觉体验。
对齐现代化工业 ERP 高保真工作台风格：**整体采用一张具有细腻边框与阴影的纯白背景实体大卡片（Card Shell），将标题区、全局操作区、筛选过滤条、数据表格主体以及分页栏高度整合为一体化的沉浸式操作容器**。
同时保持**纯标准 shadcn 原子组件驱动**与**与具体业务彻底解耦**。
所有能力以可配置插槽和积木开关暴露，支持后续每个业务页面按需自由开启、关闭某些功能，并支持自定义挂载特定操作。最终将完整经验沉淀至 `.agents/skills/erp-feature-dev/` 技能中。

---

## 2. 视觉痛点对比与对齐标准（基于对比截图分析）

### 现有实现问题（图 2 现状）

1. **容器失真，背景相融**：搜索框、表格和分页条零散漂浮在浅灰背景上，没有任何外层卡片边界包裹，缺少主工作区的实体感。
2. **过滤栏简陋单薄**：只有一个孤立的 Input 和两个浮动 Tag，缺乏内嵌标签前缀（如 `[业务日期 | ...]`, `[关键字 | ...]`, `[状态 | ...]`）和标准化的 `查询` / `重置` / `高级筛选` 交互联动。
3. **表格排版松散**：表头与行高间距过大，缺少编号列 `#`，无单号强调高亮，所有操作全部缩进 `...` 菜单，操作链路冗长。
4. **分页条不专业**：仅显示 `共 2 条记录` 与固定 4 个翻页箭头，缺少 `显示第 1-2 条` 的明确范围与直观的紧凑数字页码。

### 目标高保真标准（图 1 规范）

1. **一体化纯白背景大卡片 (`DataTable.Card` / `bg-card border shadow-xs rounded-xl p-5`)**：
   - 整个工作区为一个完整的 Card，背景纯白（`#FFFFFF`），边缘带有微边框（`border-border/80`），与页面底色（`#F8FAFC`）形成清晰的高级层次反差。
2. **一体化紧凑表头与工具栏 (`DataTable.Header` + `DataTable.Toolbar`)**：
   - 左侧：小标分类 `BUSINESS WORKSPACE` + 带品牌色粗竖条的标题 + 描述辅文。
   - 右侧：集成常用标准按钮组（`批量提交`、`刷新`、`导入`、`导出`、`列设置 15/15`、`打印`、`新增`），且各按钮均可按页面配置显隐、自定义扩展与权限控制。
3. **一体式组合筛选栏 (`DataTable.FilterBar`)**：
   - 筛选控件采用前缀 Label 一体化输入组（`InputGroup`），紧凑高密度。
   - 包含主色 `查询` 按钮、次级描边 `重置` 按钮，以及右侧独立的 `高级筛选` 抽屉触发器。
4. **高密度专业数据表格 (`DataTable.Content`)**：
   - 表头为浅灰微底 (`bg-muted/40`)，文字小巧精致 (`text-xs font-semibold`)。
   - 内置自增序号列 `#`（跨页自动计算），支持复选框 Checkbox。
   - 主键/单号列支持强调蓝（`font-mono font-bold text-primary`）。
   - 行操作支持平铺文本链接（`详情`、`编辑`）与折叠下拉菜单共存。
5. **一体式高保真分页器 (`DataTable.Pagination`)**：
   - 左侧：`共 N 条  显示第 X-Y 条`。
   - 右侧：紧凑下拉 `20 条/页 ∨` + 数字页码器（`<` `1` `2` `3` `>`）。

---

## 3. 核心积木零件与可拔插功能矩阵 (Pluggable Features)

每个业务页面可根据自身诉求，自由选择开启或关闭对应零件，并支持挂载自定义特定组件：

| 积木零件 | 核心功能 | 可配置性与默认开关 | 权限与插槽扩展 |
| :--- | :--- | :--- | :--- |
| **`DataTable.Root`** | 提供统一的状态上下文与一体化卡片容器 (`integratedCard?: boolean`) | 默认 `true`（渲染一体化背景白卡）；可设为 `false` 适配特殊内嵌场景 | 注入 `subject` 与 `permissions`/`ability`，全树广播权限状态 |
| **`DataTable.Header`** | 页面工作台标题栏（分类徽标、标题竖条、说明文案） | 可选开启；若页面已有外部外层 Header，可关闭 | 右侧操作按钮插槽 `actions` |
| **`DataTable.Toolbar`** | 承载全局主操作按钮组（批量、刷新、导入、导出、列设置、打印、新建） | 页面按需声明需要的按钮零件；不需要的直接不写 | 支持 `DataTable.ActionButton`（声明 `action` 自动做权限拦截，未授权自动隐藏或 tooltip 置灰）；支持自由插入自定义按钮 |
| **`DataTable.ColumnSettings`** | 动态列显示/隐藏（基于 shadcn `DropdownMenu` + `Checkbox`） | 按钮显示 `列设置 X/Y`，支持点击下拉勾选 | 联动 CASL：当前用户无权查看的字段在面板中物理剔除；支持列 `lockVisible: true` 锁定 |
| **`DataTable.FilterBar`** | 组合筛选栏（筛选插槽 + 查询/重置按钮 + 高级筛选抽屉触发器） | `hasSearchBtn`, `hasResetBtn`, `hasAdvancedFilter` 均可布尔配置开启/关闭 | Children 插槽支持任意表单控件；支持自定义触发高级筛选 Drawer/Modal |
| **`DataTable.Content`** | 表格主体（紧凑密度、表头微底） | `selectable` (多选复选框), `showIndex` (自动计算自增序号列 `#`) | 自动执行 CASL 字段级 `HIDDEN` 过滤；支持自定义展开行 `renderExpandedRow` |
| **`DataTableRowActions`** | 行级操作区 | 支持直接平铺主要文字操作 (`inlineActions`) 与次要/危险操作下拉 (`extraActions`) | 自动校验 `read`/`update`/`delete` 与自定义 `action` 权限；无权限时整列或单个动作自动隐藏 |
| **`DataTable.Pagination`** | 底部一体化分页栏 | `showRange` (显示第 X-Y 条), `pageSizeOptions` 可配 | 紧凑型数字页码切换器，左右布局规范对齐 |

---

## 4. 标准使用代码范式 (业务侧装配体验)

```tsx
<DataTable.Root
  data={data}
  columns={columns}
  rowKey={(item) => item.id}
  subject="Customer"
  permissions={permissions}
  total={total}
  page={page}
  pageSize={pageSize}
  onPageChange={handlePageChange}
>
  {/* 1. 一体化卡片顶部标头 */}
  <DataTable.Header
    category="BUSINESS WORKSPACE"
    title="客户档案"
    description="按业务清单维护查询字段、状态流、业务数据与操作留痕。"
    actions={
      <DataTable.Toolbar>
        {/* 特殊批量操作 */}
        <DataTable.ActionButton action="batchSubmit" variant="default" size="sm">
          批量提交
        </DataTable.ActionButton>
        <Button variant="outline" size="sm" onClick={refetch}>刷新</Button>
        <DataTable.ActionButton action="import" variant="outline" size="sm">导入</DataTable.ActionButton>
        <DataTable.ActionButton action="export" variant="outline" size="sm">导出</DataTable.ActionButton>
        {/* 动态列设置 */}
        <DataTable.ColumnSettings />
        <Button variant="outline" size="sm" onClick={() => window.print()}>打印</Button>
        {/* 主新建按钮 */}
        <DataTable.ActionButton action="create" size="sm">
          新增
        </DataTable.ActionButton>
      </DataTable.Toolbar>
    }
  />

  {/* 2. 复合筛选栏 */}
  <DataTable.FilterBar
    onSearch={handleSearch}
    onReset={handleReset}
    onAdvancedFilter={() => setOpenAdvanced(true)}
  >
    <InputGroup label="业务日期" className="w-56">
      <Input placeholder="选择日期范围..." />
    </InputGroup>
    <InputGroup label="关键字" className="w-64">
      <Input placeholder="单号 / 名称 / 客户 / 产品" />
    </InputGroup>
    <InputGroup label="状态" className="w-36">
      <Select ... />
    </InputGroup>
  </DataTable.FilterBar>

  {/* 3. 数据表格：多选 + 序号 + 紧凑行高 */}
  <DataTable.Content selectable showIndex />

  {/* 4. 分页栏 */}
  <DataTable.Pagination />
</DataTable.Root>
```

---

## 5. 沉淀至 `.agents/skills/erp-feature-dev/` 的具体规划

在 `SKILL.md` 中增加章节 **《现代化工业风 DataTable 通用积木与权限开发手册》**：

1. **一体化卡片容器原则**：解释为何不可将搜索栏与表格零散散落在页面灰色背景上，如何使用 `DataTable.Root` 默认的卡片边界包裹。
2. **自定义按钮如何加权限**：
   - 声明式 `DataTable.ActionButton action="xxx"`；
   - 跨实体覆盖 `subject="AnotherEntity"`；
   - 未授权展现策略（`unauthorizedStrategy: "hidden" | "disabled-tooltip"`）。
3. **函数式插槽与上下文联动**：
   - 使用 `DataTable.Actions` 获取 `{ can, selectedKeys, isAnySelected }` 做批量流转按钮。
4. **字段三态如何自动推导与拦截**：
   - 列定义 `field` 与 CASL 联动原理（无权查看时列与数据物理剥离，列设置面板同步剔除）；
   - 表单中 `<DataTable.AuthField>` 的 `HIDDEN` / `READONLY` / `EDITABLE` 自动判定。
5. **完整可复制的模板代码**：提供开箱即用的 CRUD 列表与弹窗表单示例。
