# 架构资产：企业级字段权限控制全链路设计与实战规范 (Field-Level Permissions)

> **版本**：v1.0.0  
> **适用环境**：Next.js 16 (App Router) + React 19 + TypeScript + CASL + PostgreSQL  
> **设计哲学**：单一事实源 (SSoT) + 字段三态推导 (Field Policy) + 物理级数据剥离 (Fail-Closed)  
> **核心目标**：实现从底层契约定义、管理端授权矩阵、CASL 权限引擎编译、服务端响应脱敏到前端组件物理剔除的全链路字段安全防护，杜绝网络抓包泄露与越权篡改。

---

## 一、 业务背景与安全痛点

在企业级制造与供应链 SaaS ERP 中，数据资产具有强烈的敏感度分级：

- **敏感商业资产**：如采购订单的“采购单价/成本价”、客户档案的“授信额度”、供应商的“返利比例”；
- **隐私合规数据**：如客户与员工的“手机号”、“身份证号”；
- **关键状态字段**：如订单的“审核状态”、“结算方式”。

### 传统前端字段权限的致命误区

1. **“假隐藏”与网络抓包裸奔**：仅在前端通过 `display: none` 或 `v-if` 隐藏 UI 元素，但服务端下发的 JSON 接口数据中依然包含完整字段，攻击者打开浏览器 Network 控制台即可一览无余；
2. **“导出后门”**：页面表格虽然隐藏了列，但点击【导出 Excel/CSV】时直接拉取了全量数据库字段，导致敏感资产通过导出文件批量泄露；
3. **“只读防君子不防小人”**：表单里的 `input` 仅仅加上了 `disabled` 属性，黑客直接构造 HTTP 请求即可篡改不该被修改的受保护字段；
4. **“配置与代码脱节”**：后台管理矩阵配了一堆字段，前台列定义却遗漏了绑定，配置形同虚设。

---

## 二、 核心心智模型：字段访问三态 (`FieldPolicy`)

整个系统的字段权限收敛于 `@base/shared` 定义的字段访问控制三态标准：

```ts
export enum FieldPolicy {
  /** 剥离隐藏：对当前操作员不可见，列物理级移除，接口数据彻底剥离 */
  HIDDEN = "HIDDEN",
  /** 只读锁定：可见但不可编辑，表单输入框置灰禁用并上锁，服务端拦截变更 */
  READONLY = "READONLY",
  /** 正常交互：完整读写权限 */
  EDITABLE = "EDITABLE",
}
```

### 三态与 CASL 原语的等价推导公式

- **`HIDDEN`** $\iff$ `ability.cannot("read", Subject, Field)`
- **`READONLY`** $\iff$ `ability.can("read", Subject, Field)` $\land$ `ability.cannot("update", Subject, Field)`
- **`EDITABLE`** $\iff$ `ability.can("read", Subject, Field)` $\land$ `ability.can("update", Subject, Field)`

---

## 三、 全链路闭环架构图

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 页面契约单一事实源 (src/contracts/<page>.contract.ts)                 │
│    - 声明实体字段字典枚举 (CustomerField)                               │
│    - 标记受控字段元数据 (configurableFields: [{ field, label, sensitive }])│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 自动挂载至 Manifest
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. 租户管理端授权矩阵 (RolePermissionManager)                            │
│    - 管理员勾选：【查看权限】 ✖ 【编辑权限】                              │
│    - 自动换算为三态策略并持久化至 Control DB (organizationRole)         │
│      fieldPolicies: [{ subject: "Customer", field: "creditLimit", ... }]│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 登录后加载上下文
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. CASL 授权编译引擎 (CaslAbilityFactory)                              │
│    - 将 fieldPolicies 编织进 CASL Ability 规则体系                     │
│    - 生成带有字段白名单/黑名单约束的 PrismaAbility 实例                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ 4. 服务端安全网 (Server-Side Defense)  │   │ 5. 前端 UI 组件拦截 (UI-Side Defense)  │
│ • pickReadableFields:                  │   │ • DataTableContent:                    │
│   下发给前端前彻底 delete HIDDEN 字段  │   │   读权限校验失败则整列从 DOM 物理剔除  │
│ • assertEditableFields:                │   │ • <AuthorizedField>:                   │
│   保存前拦截对 READONLY/HIDDEN 字段修改│   │   自动推导三态并锁定/隐藏表单输入控件  │
│ • 安全 CSV 导出:                        │   │ • 智能列头与表头对齐:                  │
│   动态过滤 HIDDEN 字段，防止导出后门   │   │   无 field 辅助列自动放行，受控列严审  │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 四、 关键技术实现解析

### 1. 契约层：实体自描述受控字段 (`packages/domains/<domain>/src/features/<feature>/contract.ts`)

每个业务页面必须建立专属契约文件（如 `customer.contract.ts`），杜绝手写魔法字符串：

```ts
// 1. 强类型字段字典
export const CustomerField = {
  CUSTOMER_CODE: "customerCode",
  CUSTOMER_NAME: "customerName",
  CREDIT_LIMIT: "creditLimit",
  STATUS: "status",
} as const;

// 2. 受控字段元数据定义
export const customerConfigurableFields = [
  { field: CustomerField.CUSTOMER_CODE, label: "客户编码", isSensitive: false },
  {
    field: CustomerField.CREDIT_LIMIT,
    label: "授信额度 (敏感资产)",
    isSensitive: true,
  },
  { field: CustomerField.STATUS, label: "客户状态", isSensitive: false },
] as const;
```

---

### 2. 引擎层：CASL 规则编译与持久化反序列化

在 `@base/authorization` 的 `CaslAbilityFactory` 中：

- 当用户属于 `owner` 角色时，默认全量放行（具备所有动作与全部字段的读写权限）；
- 普通角色根据数据库存储的 `fieldPolicies` 解析出各实体的字段白名单：
  - 若 `access === FieldPolicy.HIDDEN`，从该角色的 `can("read", subject)` 字段许可列表中剔除该字段；
  - 若 `access === FieldPolicy.READONLY`，保留读许可，但从 `can("update", subject)` 写入许可列表中剔除该字段。

---

### 3. 表格视图层：DataTable 物理级列剔除机制

在 `packages/base/ui/src/components/composite/table/DataTableContent.tsx` 中：

```tsx
// packages/base/ui/src/components/composite/table/DataTableContent.tsx
const visibleColumns = useMemo(() => {
  return columns.filter((col) => {
    // 1. 用户自定义列设置 visibleColumnIds 过滤
    if (!visibleColumnIds.has(col.id)) return false;
    // 2. 纯 UI 辅助列（无 field 属性，如多选框、操作列、子表展开箭头）默认放行
    if (!col.field || !ability || !subject) return true;

    // 3. 业务受控列：严格向 CASL 校验当前操作员对该字段的读取能力
    return ability.can("read", subject, col.field);
  });
}, [columns, visibleColumnIds, ability, subject]);
```

**效果**：当某字段被设为 `HIDDEN` 时，`visibleColumns` 会直接把该列排除，不管是 `<TableHead>` 还是每一行的 `<TableCell>`，在 HTML 渲染树中**彻底物理消失**，绝非 CSS 视觉隐藏！

---

### 4. 表单与详情层：`<AuthField>` 积木组件

针对表单编辑和弹窗录入，系统在 `@base/ui`（`packages/base/ui/src/components/composite/auth/AuthField.tsx`）预置了 `<AuthField>` 高阶组件：

```tsx
<AuthField field={CustomerField.CREDIT_LIMIT} label="授信额度">
  <Input value={form.creditLimit} onChange={...} />
</AuthField>
```

#### 组件内部推导机制 (`deriveFieldMode`)

```ts
// packages/base/ui/src/components/composite/auth/AuthField.tsx
export function deriveFieldMode(
  ability: AbilityLike | null | undefined,
  subject: string,
  field: string,
  action: string = "update",
  overrideMode?: FieldAccessMode,
): FieldAccessMode {
  if (overrideMode) return overrideMode;
  if (!ability) return FieldPolicy.HIDDEN;

  const readable = ability.can("read", subject, field);
  const writable = ability.can(action, subject, field);

  if (!readable) return FieldPolicy.HIDDEN;
  if (!writable) return FieldPolicy.READONLY;
  return FieldPolicy.EDITABLE;
}
```

- **遇到 `HIDDEN`**：组件直接返回 `<>{fallback}</>`，表单项在 DOM 中彻底不渲染；
- **遇到 `READONLY`**：组件通过 React 原生 `cloneElement` 为传入的 `<Input />` 或 `<Select />` 自动注入 `readOnly: true`、`disabled: true`，并在外部呈现只读徽章与锁定样式；
- **遇到 `EDITABLE`**：原样放行，支持用户输入交互。

---

### 5. 导出数据层：全自动动态脱敏安全清洗

为防止“前台看不见、一导全露馅”的安全漏洞，所有页面的导出逻辑（如 `handleExport`）必须经过运行时字段读权限校验：

```ts
const activeExportFields = fieldKeys.filter((f) => {
  if (!ability || !f.field) return true;
  // 仅保留当前登录成员具备 read 权限的安全列
  return ability.can("read", CustomerSubject, f.field);
});

// 构建 CSV 内容时，仅拼接 activeExportFields
const csvContent = [
  activeExportFields.map((f) => f.label).join(","),
  ...filteredData.map((row) =>
    activeExportFields
      .map((f) => `"${String(row[f.key] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  ),
].join("\n");
```

---

### 6. 服务端防守：双重拦截函数 (`@base/authorization`)

针对绕过前端 UI 直接调用 Server Action 或 REST API 的场景：

```ts
import { pickReadableFields, assertEditableFields } from "@base/authorization";

// 场景 1：向客户端响应前，物理剥离 HIDDEN 敏感字段
const safeCustomer = pickReadableFields(rawCustomer, ability, CustomerSubject);

// 场景 2：保存客户端提交的变更前，强校验是否越权修改了只读/隐藏字段
assertEditableFields(updatePayload, ability, CustomerSubject);
// 若 payload 包含未授权可写字段，函数直接抛出 AppError 终止事务
```

---

## 五、 自动化契约对齐测试规范

为了防止未来代码迭代破坏字段权限，每个受控页面必须配套编写自动化单测（如 `CustomerView.test.tsx`）：

```tsx
test("CustomerView 严格执行 HIDDEN 字段策略隐藏对应列与数据", () => {
  const htmlWithHidden = renderToString(
    <CustomerView
      permissions={{
        actions: ["read"],
        fieldPolicies: {
          customerCode: "HIDDEN",
          creditLimit: "HIDDEN",
        },
      }}
    />,
  );

  // 断言 1: 表头物理剔除
  assert.doesNotMatch(htmlWithHidden, /<th[^>]*>客户编码<\/th>/);
  assert.doesNotMatch(htmlWithHidden, /<th[^>]*>授信额度<\/th>/);

  // 断言 2: 单元格敏感数据绝不在 HTML 中出现
  assert.doesNotMatch(htmlWithHidden, /CUST-20260909-0001/);
  assert.doesNotMatch(htmlWithHidden, /100000/);
});
```

---

## 六、 开发者 SOP：为新页面接入字段权限的标准 3 步

1. **在 `packages/domains/<domain>/src/features/<feature>/contract.ts` 中定义**：
   - 声明 `MyField` 枚举对象；
   - 编写 `myConfigurableFields` 数组，敏感字段标明 `isSensitive: true`；
   - 挂载入 `myPageContract.configurableFields`。
2. **在 `packages/domains/<domain>/src/features/<feature>/ui/<Page>View.tsx` 中绑定**：
   - `columns` 中凡是受控数据列，必须指定 `field: MyField.XXX`；
   - 导出 CSV 函数中，通过 `ability.can("read", Subject, f.field)` 动态裁剪导出行列。
3. **在单元测试 `ui/<Page>View.test.tsx` 中断言**：
   - 传入 mock 的 `fieldPolicies: { [MyField.XXX]: "HIDDEN" }`，断言列头与数据均被彻底隐藏。
