# 模块 5：工业风 UI 交互与反馈规范

辰润 ERP 采用现代化数智工业风规范，全面基于 `@chenrun/ui`（shadcn/ui 体系）构建。

> ⚠️ **核心红线**：
>
> 1. **二次确认只在对话框提示一次**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 进行模态对话框确认，严禁在回调函数内再次使用浏览器的 `window.confirm` 进行二次弹窗；
> 2. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有成功、警告与错误提示统一使用右上角 `toast` 浮层通知；
> 3. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更必须由 React 本地 State 即时响应驱动，配合 `router?.refresh()` 静默同步。

---

## 1. 统一通知组件 (Toast)

在 `@chenrun/ui` 中封装了基于 `sonner` 的统一通知工具：

```tsx
import { toast } from "@chenrun/ui";

// 成功通知 (绿色)
toast.success("客户创建成功");

// 失败与业务阻断通知 (红色)
toast.error(res.error || "删除客户失败");

// 警告通知 (黄色)
toast.warning("检测到该客户存在未结款项");
```

---

## 2. 表格操作列与单次确认 (`DataTableRowActions`)

表格操作列使用 `DataTableRowActions`，内置权限过滤与单次模态对话框确认：

```tsx
<DataTableRowActions
  record={c}
  onView={() => setViewingCustomer(c)}
  onEdit={() => setEditingCustomer(c)}
  extraActions={[
    {
      label: c.status === "ACTIVE" ? "停用客户" : "启用客户",
      variant: c.status === "ACTIVE" ? "destructive" : "default",
      onClick: () => handleToggleStatus(c.customerCode, c.status),
      confirm:
        c.status === "ACTIVE"
          ? {
              title: `确认停用客户 "${c.customerName}"？`,
              description: "警告：停用该客户将导致其名下所有关联门店强制同步停用！",
              confirmText: "确认停用", // 👈 按钮文案与动作严格对齐，禁止显示错位的“确认删除”
              cancelText: "取消",
            }
          : undefined,
    },
  ]}
  onDelete={() => handleDelete(c.customerCode)}
  deleteConfirm={{
    title: `确认删除客户 "${c.customerName}"？`,
    description: "删除后该客户的所有主数据及门店关联将不可恢复。",
    confirmText: "确认删除",
  }}
/>
```

---

## 3. 响应式无感更新模式 (No Reload)

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
        // 1. 本地 State 瞬间更新，零白屏、零延迟
        setCustomers((prev) => prev.filter((item) => item.customerCode !== code));
        // 2. 右上角弹出提示，平滑自然
        toast.success("客户已成功删除");
        // 3. Next.js 后台静默数据同步
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
