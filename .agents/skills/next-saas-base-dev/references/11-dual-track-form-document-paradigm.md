# 11. 单据与表单双轨开发标准指南 (Dual-Track Form & Document Paradigm)

> **定位**：本文档是全仓所有业务切片（`packages/domains/*` 与 `packages/platform/*`）在开发“单据/主数据表单”时的**最高设计与开发宪法**。  
> 彻底解决业务开发中“标准表单重复手写”与“复杂表单纯配置失控”的两极化痛点，明确**选型判定树**、**外壳与积木来源**及**全链路自动权限穿透**。

---

## 一、 核心心智：为什么必须坚持“双轨策略”？

在中后台企业级 SaaS / ERP 系统中，试图用同一种模式解决所有表单必定导致灾难：
- **如果“全搞纯配置 (Low-Code JSON Schema)”**：遇到制造 BOM、工艺路线、多级物料联动这种深度交互场景，配置项会剧烈膨胀出大量的 `renderHook`、`onFieldChange`、`customActions`，把简单的 TSX 变成不可维护的“配置黑洞”；
- **如果“全搞自由积木 (Free Assembly)”**：遇到计量单位、客户主数据、工序档案等标准档案时，开发者又不得不反复手写布局、Label、必填星号、权限守卫，产生海量冗余样板代码。

因此，底座确立**绝对清晰的双轨分水岭**：

```text
                                  【单据与表单开发需求接入】
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         【轨道 A：标准配置模式 (80%)】                   【轨道 B：积木编排模式 (20%)】
         适用：规整主数据、标准单表/主子表              适用：多子表深度联动、复杂计算、异构交互
         载体：FormModal / FormPage 模板                载体：<DocumentShell> 外壳 + 积木拼装
         开发：传 sections 配置，全自动装配              开发：拼装成熟高阶积木，自由自治扩展
```

---

## 二、 策略选型决策树 (Decision Matrix)

在接到任何表单/单据开发任务时，**按以下 4 步决策树严格定型，严禁过度设计，严禁降级裸写**：

| 维度 / 场景特征 | 推荐轨道 | 采用组件载体 | 典型业务标杆 |
| :--- | :---: | :--- | :--- |
| **轻量辅助主数据**（≤ 8 字段，无子表，弹窗快速录入） | **轨道 A** | `<FormModal>` | 计量单位、客户分类、工序标签、数据字典 |
| **标准主数据 / 档案**（包含主表基本信息 + 0~1 个标准规格明细表） | **轨道 A** | `<FormPage>`（全屏独立路由） | **工序档案** (`operations`)、客户主数据 (`customers`)、供应商档案 |
| **多子表强联动 / 动态试算**（物料-工序联动、公式实时计算、配比切换） | **轨道 B** | `<DocumentShell>` + 积木拼装 | **制造 BOM 维护** (`production/bom`)、生产配方调试 |
| **非标单据工作台 / 异构看板**（步骤条向导、甘特图排产、树状图谱） | **轨道 B** | `<DocumentShell>` + 积木拼装 | 生产领料拆单、工艺路线编排工作台、智能排产看板 |

---

## 三、 轨道 A：标准模式开发规范 (Schema-Driven)

### 1. 架构原则
- **极简高效**：业务切片无需写任何 Flex/Grid 布局，无需手动绑定 Label，只需要声明强类型的 `sections: FormPageSection[]` 与 Zod Schema；
- **自动全受控**：
  - 内部由 `<FormFields />` 自动接入 `<AuthField>` 控件，自动处理 CASL 权限三态（隐藏 / 只读 / 编辑）与红色必填星号 `*`；
  - 底部/顶栏保存按钮自动由 `<AuthGuard action="create" | "update">` 守卫，无权自动隐藏；
  - 明细子表直接配置 `DetailTable`，开箱即用增删行与空状态。

### 2. 标准代码范式（以工序档案 `OperationFormPage` 为标杆）
```tsx
import { FormPage, type FormPageSection } from "@base/ui";
import { OperationSubject } from "../contract";
import { createOperationSchema } from "../schema";

export function OperationFormPage({ initialDetail, options, isView = false }) {
  const sections: FormPageSection<OperationFormData>[] = [
    {
      title: "基本信息",
      fields: [
        { name: "code", label: "工序编码", required: true },
        { name: "name", label: "工序名称", required: true },
        { name: "operationCategoryDictItemId", label: "工序分类", type: "combobox", options: categoryOptions },
      ],
    },
    {
      title: "工艺规格要求 (明细表)",
      customRender: () => <SpecificationTable data={specs} onChange={setSpecs} />,
    },
  ];

  return (
    <FormPage<OperationFormData>
      mode={isView ? "view" : isEdit ? "edit" : "create"}
      subject={OperationSubject}
      sections={sections}
      initialValues={initialValues}
      schema={createOperationSchema}
      onSubmit={handleSubmit}
      backUrl="/production/operations"
    />
  );
}
```

---

## 四、 轨道 B：积木编排模式规范 (Compound Blocks Assembly)

当且仅当业务复杂度超出轨道 A 时启用。**积木编排绝不是“从零手绘原生 HTML”，而是“对平台公共高阶资产的高内聚编排”**。

### 1. 架构三层铁律
1. **外壳铁律**：**严禁积木裸写外壳**！所有个性化单据必须跑在 `@base/ui` 的标准外壳 **`<DocumentShell>`** 中，由外壳统一管理吸顶、三态与权限广播；
2. **资产优先铁律**：积木内部**必须 100% 优先复用底座公共资产**，实在没有的才允许自主实现；
3. **单文件防巨石铁律**：拆分为单一职责积木组件（如 `BasicInfoSection.tsx`、`MaterialInputsSection.tsx`），单文件代码严格控制在 50~180 行以内。

### 2. 积木公共资产来源清单 (Asset Catalog)

| 功能诉求 | 推荐使用的公共资产 (来自 `@base/ui`) | 绝对禁止的反模式 (门禁拦截) |
| :--- | :--- | :--- |
| **单据顶层外壳** | **`<DocumentShell>`** | 严禁手写负 margin (`-m-2.5`)、手写 `calc(100svh-3rem)` |
| **写操作动作按钮** | **`<AuthGuard action="update">`** 包裹 `<Button>` | 严禁手写裸 `<Button>` 进行增删改，必须受控 |
| **表单字段受控** | **`<AuthField>`** 包裹 `<Input>` / `<Combobox>` / `<Switch>` | 严禁手写裸 `<label>`，手写 `disabled={isView}` |
| **明细数据表格** | 规范的受控明细表格（行操作包裹 `<AuthGuard>`） | 严禁随意拼凑不带权限保护的手写裸 `<table>` |
| **破坏性操作确认** | **`<ConfirmDialog>`** | 严禁使用浏览器原生 `confirm(...)` |

### 3. 标准代码范式（以制造 BOM `BomFormPage` 为标杆）
```tsx
import { DocumentShell, AuthGuard, Button, Badge } from "@base/ui";
import { StandardAction } from "@base/authorization";
import { BomSubject } from "../../contract";
import { useBomFormState } from "./useBomFormState";
import { BasicInfoSection } from "./BasicInfoSection";
import { MaterialInputsSection } from "./MaterialInputsSection";
import { ProductOutputsSection } from "./ProductOutputsSection";
import { OperationRoutesSection } from "./OperationRoutesSection";

export function BomFormPage({ mode, bomId, initialDetail, formOptions, backUrl }) {
  // 1. 纯业务逻辑下沉到自定义 Hook
  const state = useBomFormState({ mode, bomId, initialDetail, formOptions, backUrl });

  return (
    // 2. 统一由 DocumentShell 外壳包裹，自动注入上下文与只读穿透
    <DocumentShell
      mode={mode}
      subject={BomSubject}
      title={state.name || "新建生产 BOM"}
      documentNumber={initialDetail?.code}
      badge="制造BOM"
      statusBadge={<Badge>已生效</Badge>}
      slotMiddle={<BomTypeTabs value={state.bomType} onChange={state.setBomType} />}
      backUrl={backUrl}
      submitting={state.submitting}
    >
      {/* 3. 内部自由拼装高阶业务积木 */}
      <BasicInfoSection {...state.basicProps} />
      <ProductOutputsSection {...state.outputProps} />
      <MaterialInputsSection {...state.inputProps} />
      <OperationRoutesSection {...state.routeProps} />
    </DocumentShell>
  );
}
```

---

## 五、 特性体验：全链路自动权限穿透与上下文感知

积木化拼装最强大的地方在于：**`<DocumentShell>` 与底座控件打通了只读态穿透，消灭了业务层海量重复的 `!isView` 样板代码**。

### 1. 自动只读穿透工作机制
```text
           <DocumentShell mode="view" subject="ProductionBom">
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
   深层 <AuthGuard action="update">            深层 <AuthField field="price">
           │                                           │
   [自动感知 mode === 'view']                  [自动感知 mode === 'view']
   写操作自动阻断，不渲染子元素！               字段强制降级为 READONLY，自动注入
   (业务完全无需写 !isView && <AuthGuard>)       只读 Badge 与 disabled 属性！
```

### 2. 对比收益表

| 场景 | 传统重合冗余写法（已淘汰） | 双轨架构标准优雅写法（现行） |
| :--- | :--- | :--- |
| **添加明细行按钮** | `{!isView && <AuthGuard action="update"><Button>添加</Button></AuthGuard>}` | `<AuthGuard action="update"><Button>添加</Button></AuthGuard>`（view 态自动隐藏） |
| **行内删除按钮** | `{!isView && <Button onClick={del}>删除</Button>}` | `<AuthGuard action="update"><Button onClick={del}>删除</Button></AuthGuard>`（自动鉴权 + view 态隐藏） |
| **表单字段置灰** | `<Input disabled={isView || !canWrite} />` | `<AuthField field="name"><Input /></AuthField>`（自动根据权限与单据模式禁用） |
| **深层积木读取环境** | 层层通过 Props 传递 `mode`、`isView`、`subject` | 直接调用 `const { mode, isReadonly, subject } = useDocumentContext();` |

---

## 六、 开发者自检清单 (Checklist)

在提交任何表单/单据代码前，必须对照本清单自检：

- [ ] **选型正确**：80% 规整表单是否优先选用了 `FormModal` / `FormPage`？没有无事生非搞积木拼装？
- [ ] **外壳规范**：如果是积木拼装，是否统一使用了 `<DocumentShell>`？有没有残留负 margin 或裸写顶栏？
- [ ] **杜绝裸写**：积木内部是否消灭了手写裸 `<table>`、裸 `<input>`？写操作按钮是否都包裹了 `<AuthGuard>`？
- [ ] **零冗余 `isView`**：是否充分利用了 `<AuthGuard>` 与 `<AuthField>` 的自动只读穿透，删除了冗余的 `!isView &&`？
- [ ] **通过门禁**：运行 `node scripts/verify.mjs`，切片规范与受控门禁 100% 绿灯。
