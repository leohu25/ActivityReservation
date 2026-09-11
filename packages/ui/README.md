# @chenrun/ui

辰润 ERP 的**工业级现代化设计系统与核心 UI 组件库（Industrial Design System & UI Kit）**。

## 1. 模块定位与职责

本模块是全平台（平台管控端 `apps/control` 与企业租户端 `apps/tenant`）统一的前端视觉与交互底座。遵循沉稳内敛的工业风设计规范，提供高复用、高一致性、强无障碍支持（Radix UI）以及无缝集成 CASL 权限的组件资产：

- **设计底座与主题系统**：基于 Tailwind CSS 与 `next-themes` 实现工业暗黑/明亮主题体系（工业蓝/石板灰主调，高信息密度，高对比度状态呈现）。
- **通用原子基元 (`primitives/`)**：基于 Radix UI 构建的无障碍基础组件，包括 Button, Input, Select, Dialog, Sheet, Popover, Tooltip, Table, Tabs, Badge 等。
- **全局交互反馈 (`feedback/`)**：轻量统一的消息提示（`toast` / Sonner）、二次操作硬确认弹窗（`ConfirmDialog`，防意外误触）、空状态展示（`EmptyState`）。
- **复合业务级组件 (`composite/` & 顶级组件)**：
  - `DataTable`: 工业级高密度数据表格组件，内置多维过滤、排序、分页与批量操作容器。
  - `AuthorizedField`: 权限三态（可编辑 / 只读脱敏 / 物理剥离不可见）字段级渲染守护组件。
  - `DashboardShell` / `Sidebar` / `TopHeader`: 工业 ERP 标准中后台响应式工作台骨架。
  - `MetricCard` / `ProcessStepper` / `ExceptionList`: 指标统计卡片、业务流转进度指示器与异常单据列表。

## 2. 内部架构与目录结构

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── primitives/       # 基础原子组件 (Radix UI 封装，按钮、输入框、弹窗等)
│   │   ├── feedback/         # 反馈组件 (ConfirmDialog, Toast, EmptyState)
│   │   ├── composite/        # 复合场景组件 (DataTable, Auth 表单等)
│   │   ├── layout/           # 框架布局骨架 (DashboardShell, Sidebar, TopHeader)
│   │   ├── AuthorizedField.tsx # 字段权限三态守护组件
│   │   ├── MetricCard.tsx    # 工业指标卡
│   │   ├── ProcessStepper.tsx# 业务步进器
│   │   ├── ThemeProvider.tsx # 主题上下文 Provider
│   │   ├── ThemeToggle.tsx   # 主题切换按钮
│   │   └── index.ts          # 组件聚合导出
│   ├── lib/
│   │   └── utils.ts          # clsx 与 tailwind-merge (cn 工具)
│   ├── index.ts              # 统一导出入口
│   └── *.test.ts(x)          # 自动化单测
├── components.json           # shadcn/ui 元数据配置
└── package.json
```

## 3. 核心 API 与使用示例

### 3.1 字段级权限渲染 (`AuthorizedField`)

结合 `@chenrun/authorization` 的 CASL Ability，实现字段级安全控制：

```tsx
import { AuthorizedField } from "@chenrun/ui";

<AuthorizedField
  ability={userAbility}
  action="read"
  subject="ProcurementOrder"
  field="totalAmount"
  fallback={<span className="text-muted-foreground">***</span>}
>
  <span className="font-mono font-medium">¥ 120,500.00</span>
</AuthorizedField>
```

### 3.2 交互反馈与操作二次确认

```tsx
import { ConfirmDialog, toast } from "@chenrun/ui";

// 触发 Toast
toast.success("单据审核成功并已下发");

// 破坏性操作二次确认
<ConfirmDialog
  title="确认作废采购订单？"
  description="作废后库存占用将被释放，此操作不可撤销。"
  destructive
  onConfirm={async () => {
    await cancelOrder(orderId);
  }}
>
  <Button variant="destructive">作废订单</Button>
</ConfirmDialog>
```

### 3.3 工业风高密度布局骨架

```tsx
import { DashboardShell, Sidebar, TopHeader } from "@chenrun/ui";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      sidebar={<Sidebar items={navItems} />}
      header={<TopHeader user={currentUser} />}
    >
      <main className="p-6">{children}</main>
    </DashboardShell>
  );
}
```

## 4. 架构原则与红线

1. **绝对禁止依赖服务端/ORM 模块**：本包纯属前端/UI 层，严禁引入任何 Prisma、Node 专有 API 或数据库连接包。
2. **纯粹展现与解耦**：组件不直连具体业务接口（Server Actions），数据与操作回调通过 Props 传入，保持组件纯粹可测。
3. **符合工业风无障碍标准**：所有可交互元素必须具备键盘焦点态、ARIA 语义并经过暗黑模式兼容性测试。

## 5. 验证命令

```bash
# 运行类型检查
pnpm --filter @chenrun/ui check

# 运行单元测试
pnpm --filter @chenrun/ui test
```
