# 模块 5：工业风 UI 交互与反馈规范

辰润 ERP 采用现代化数智工业风规范，全面基于 `@chenrun/ui`（shadcn/ui 体系）构建。

> ⚠️ **核心红线**：
>
> 1. **二次确认只在对话框提示一次**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 进行模态对话框确认，严禁在回调函数内再次使用浏览器的 `window.confirm` 进行二次弹窗；
> 2. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有成功、警告与错误提示统一使用右上角 `toast` 浮层通知；
> 3. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更必须由 React 本地 State 即时响应驱动，配合 `router?.refresh()` 静默同步；
> 4. **服务端分页（生产必选）**

`DataTable.Root` 默认**不做**客户端切片：`data` 必须是服务端返回的**当前页**，`total` 来自 API `count`。

```tsx
// RSC page.tsx
const sp = await searchParams;
const page = readInt(sp, "page", 1);
const pageSize = readInt(sp, "pageSize", 20);
const { items, total } = await listAction({ page, pageSize, keyword });

<CustomerView
  initialCustomers={items}
  initialTotal={total}
  initialPage={page}
  initialPageSize={pageSize}
/>

// Client View
<DataTable.Root
  data={customers}
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={(p, ps) => navigateList({ page: p, pageSize: ps })}
>
```

服务层使用 `count` + `skip/take`，严禁 `findMany` 全量返回后再前端切页。
本地演示可用 `clientSidePagination` 显式开启，生产列表禁止。

**一体化卡片容器原则**：搜索栏、工具栏、表格主体与分页条必须包在同一张 `DataTable.Root` 白卡内，严禁零散漂浮在页面灰色背景上。

---

## 1. 统一通知组件 (Toast)

在 `@chenrun/ui` 中封装了基于 `sonner` 的统一通知工具：

```tsx
import { toast } from "@chenrun/ui";

toast.success("客户创建成功");
toast.error(res.error || "删除客户失败");
toast.warning("检测到该客户存在未结款项");
```

---

## 2. 现代化工业风 DataTable 通用积木与权限开发手册

### 2.1 一体化卡片容器原则

**反模式（禁止）**：搜索框、筛选 Tag、表格、分页条各自裸露在页面 `#F4F7FB` 底色上，缺少主工作区实体感。

**标准范式**：使用 `DataTable.Root` 默认开启的 `integratedCard`，将标题区、全局操作区、筛选条、表格主体与分页栏整合进同一张纯白大卡片：

```tsx
<DataTable.Root
  data={data}
  columns={columns}
  rowKey={(item) => item.id}
  subject="Customer"
  permissions={permissions}
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPagination}
>
  <DataTable.Header
    category="BUSINESS WORKSPACE"
    title="客户档案"
    description="按业务清单维护查询字段、状态流、业务数据与操作留痕。"
    actions={
      <DataTable.Toolbar>
        <DataTable.ActionButton action="export" variant="outline" size="sm">
          导出
        </DataTable.ActionButton>
        <DataTable.ColumnSettings />
        <DataTable.ActionButton action="create" size="sm">
          新增
        </DataTable.ActionButton>
      </DataTable.Toolbar>
    }
  />

  <DataTable.FilterBar onSearch={handleSearch} onReset={handleReset}>
    <DataTable.InputGroup label="关键字" className="w-64">
      <Input placeholder="单号 / 名称 / 客户" />
    </DataTable.InputGroup>
    <DataTable.InputGroup label="状态" className="w-36">
      <Select ... />
    </DataTable.InputGroup>
  </DataTable.FilterBar>

  <DataTable.Content selectable showIndex />

  <DataTable.Pagination />
</DataTable.Root>
```

特殊内嵌场景可关闭卡片壳：`integratedCard={false}`。

### 2.2 核心积木零件矩阵

| 积木 | 职责 | 关键开关 |
| :--- | :--- | :--- |
| `DataTable.Root` | 状态上下文 + 一体化白卡 | `integratedCard` |
| `DataTable.Header` | 分类小标 + 竖条标题 + 说明 + actions 插槽 | `category/title/description/actions` |
| `DataTable.Toolbar` | 全局操作按钮容器 | children 自由装配 |
| `DataTable.ActionButton` | 声明式权限按钮 | `action/subject/unauthorizedStrategy` |
| `DataTable.ColumnSettings` | 动态列显隐（DropdownMenu+Checkbox） | 列定义 `lockVisible/defaultVisible` |
| `DataTable.FilterBar` | 组合筛选栏 | `onSearch/onReset/onAdvancedFilter` |
| `DataTable.InputGroup` | `[标签 \| 控件]` 一体化输入组 | `label` |
| `DataTable.Content` | 紧凑表格主体 | `selectable/showIndex` |
| `DataTable.RowActions` | 行内平铺 + 折叠菜单 | `inlineActions/extraActions/menuOnly` |
| `DataTable.Pagination` | 范围文案 + 数字页码 | `showRange/pageSizeOptions` |
| `DataTable.FormModal` | 编辑/新建弹窗（品牌徽标+审计底栏） | `badge/headerExtra/auditHint` |
| `DataTable.FormSection/FieldGrid/Banner` | 表单分组/字段网格/信息横幅 | 配合 FormModal 使用 |
| `DataTable.DetailDrawer` | 详情查看居中弹窗（与编辑弹窗同构） | `record/onClose/children/badge` |
| `DataTable.AuthField` | 字段三态表单控件 | `field/action` |
| `DataTable.AuthGuard` | 权限包裹任意插槽 | `action` |

### 2.3 自定义操作按钮如何加权限

```tsx
// 声明式：自动从 Root 继承 subject，Fail-Closed
<DataTable.ActionButton action="create" size="sm">新增</DataTable.ActionButton>

// 跨实体覆盖
<DataTable.ActionButton action="export" subject="Report" variant="outline">
  导出报表
</DataTable.ActionButton>

// 未授权策略：hidden（默认）| disabled-tooltip（置灰+提示）
<DataTable.ActionButton
  action="audit"
  unauthorizedStrategy="disabled-tooltip"
  unauthorizedTooltip="暂无审核权限"
>
  审核
</DataTable.ActionButton>

// 函数式插槽：批量流转
<DataTable.Actions>
  {({ can, isAnySelected, selectedKeys }) =>
    isAnySelected && can("batchSubmit") ? (
      <Button size="sm" onClick={() => batchSubmit(selectedKeys)}>
        批量提交
      </Button>
    ) : null
  }
</DataTable.Actions>
```

**Fail-Closed 规则**：`subject` 与 `ability` 齐备时，无权限 → 隐藏/置灰；缺 `ability` 时视为无权限（禁止默认放行）。

### 2.4 行级操作：平铺链接 + 折叠菜单

对齐工业风参考：高频操作直接平铺文字链接（详情/编辑），次要与危险操作折叠进 `...`：

```tsx
<DataTable.RowActions
  record={row}
  onView={() => setViewing(row)}
  onEdit={() => setEditing(row)}
  extraActions={[
    {
      label: row.status === "ACTIVE" ? "停用" : "启用",
      variant: row.status === "ACTIVE" ? "destructive" : "default",
      action: "update",
      onClick: () => handleToggle(row),
      confirm: row.status === "ACTIVE"
        ? { title: `确认停用「${row.name}」？`, confirmText: "确认停用" }
        : undefined,
    },
  ]}
  onDelete={() => handleDelete(row)}
  deleteConfirm={{
    title: `确认删除「${row.name}」？`,
    confirmText: "确认删除",
  }}
/>
```

### 2.5 动态列设置

列定义上声明 `defaultVisible` / `lockVisible`：

```tsx
const columns: ColumnDef<Customer>[] = [
  { id: "code", header: "客户编码", lockVisible: true, cell: (r) => r.code },
  { id: "name", header: "客户名称", cell: (r) => r.name },
  { id: "secret", header: "内部成本", field: "secretCost", defaultVisible: false, cell: ... },
];
```

- `lockVisible: true` → 列设置面板中锁定不可隐藏；
- `defaultVisible: false` → 初始隐藏，用户可手动打开；
- `field` 列同时受 CASL `HIDDEN` 物理剥离（服务端与客户端双重过滤）。

### 2.6 字段三态自动推导与拦截

**列表列**：`ColumnDef.field` + ability → 无 `read` 权限时整列从表头与单元格物理剥离，列设置面板同步剔除。

**表单控件**：使用 `DataTable.AuthField` 自动三态：

```tsx
<DataTable.AuthField field="costPrice" label="成本价" action="update">
  <Input type="number" />
</DataTable.AuthField>
// HIDDEN → 不渲染；READONLY → disabled + 只读徽标；EDITABLE → 正常交互
```

### 2.7 详情查看居中弹窗

详情与编辑统一使用**居中 Dialog**（非侧边抽屉），视觉同构：

```tsx
<DataTable.DetailDrawer
  record={viewing}
  onClose={() => setViewing(null)}
  title={(r) => `客户详情：${r.name}`}
  description="主数据只读视图 · 操作过程自动留痕"
  footer={(r, close) => (
    <>
      <Button variant="outline" size="sm" onClick={close}>关闭</Button>
      <Button size="sm" onClick={() => { close(); setEditing(r); }}>进入编辑</Button>
    </>
  )}
>
  {(r) => (
    <DataTable.FormSection title="基本信息">
      <DataTable.FormFieldGrid columns={2}>
        <DataTable.InputGroup label="客户编码"><span>{r.code}</span></DataTable.InputGroup>
        <DataTable.InputGroup label="客户名称"><span>{r.name}</span></DataTable.InputGroup>
      </DataTable.FormFieldGrid>
    </DataTable.FormSection>
  )}
</DataTable.DetailDrawer>
```

### 2.8 编辑/新建弹窗标准模板

```tsx
<DataTable.FormModal
  open={open}
  onOpenChange={setOpen}
  record={editing}
  title={(r) => (r ? `编辑客户：${r.name}` : "新建客户")}
  description="净配菜 ERP · 操作过程自动留痕"
  onSubmit={handleSubmit}
  headerExtra={
    <DataTable.FormBanner
      title="客户主数据"
      description="保存后立即进入客户列表，操作自动留痕。"
    />
  }
>
  {({ record }) => (
    <DataTable.FormSection title="基本信息">
      <DataTable.FormFieldGrid columns={4}>
        <DataTable.InputGroup label="客户编码">
          <Input defaultValue={record?.code} />
        </DataTable.InputGroup>
        <DataTable.InputGroup label="客户名称">
          <Input defaultValue={record?.name} />
        </DataTable.InputGroup>
        <DataTable.AuthField field="phone" label="联系电话" action={record ? "update" : "create"}>
          <Input />
        </DataTable.AuthField>
      </DataTable.FormFieldGrid>
    </DataTable.FormSection>
  )}
</DataTable.FormModal>
```

底部自动展示「提交后记录操作人和时间」审计提示（可用 `auditHint={null}` 关闭）。

**底栏按钮分组约定**（对齐参考高保真）：

- 左侧：审计提示（盾牌图标 + 文案）
- 右侧：同一组按钮，`gap-2` 紧凑排列；次级在左、主操作在右
- 常用主数据弹窗按钮组：`返回 / 另存为新产品 / 保存并新增 / 保存`

```tsx
<DataTable.FormModal
  // ...
  cancelText="返回"
  submitText="保存"
  extraActions={[
    {
      key: "saveAs",
      label: "另存为新产品",
      variant: "outline",
      onClick: async (record) => { /* 另存 */ },
    },
    {
      key: "saveAndCreate",
      label: "保存并新增",
      variant: "outline",
      onClick: async (record) => { /* 保存并清空表单 */ },
    },
  ]}
/>
```

**工具栏按钮组约定**：

```tsx
<DataTable.Toolbar> {/* 默认 justify-end，gap-2 */}
  <Button variant="outline" size="sm">刷新</Button>
  <DataTable.ActionButton action="export" variant="outline" size="sm">导出</DataTable.ActionButton>
  <DataTable.ColumnSettings />
  <DataTable.ActionButton action="create" size="sm">新增</DataTable.ActionButton>
</DataTable.Toolbar>
```

主操作（新增/提交）用 solid primary，次级统一 outline，同高同字重。

---

## 3. 表格操作列与单次确认 (`DataTableRowActions`)

见 2.4。破坏性操作必须走 `ConfirmDialog`，按钮文案与动作严格对齐（禁止显示错位的「确认删除」却执行停用）。

---

## 4. 响应式无感更新模式 (No Reload)

```tsx
export function CustomerView({ initialCustomers }: Props) {
  const router = useSafeRouter();
  const [customers, setCustomers] = useState(initialCustomers);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const handleDelete = async (code: string) => {
    setLoading(true);
    try {
      const res = await deleteCustomerAction(code);
      if (res.success) {
        setCustomers((prev) => prev.filter((item) => item.customerCode !== code));
        toast.success("客户已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除客户失败");
      }
    } finally {
      setLoading(false);
    }
  };
}
```
