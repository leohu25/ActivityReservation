# @base/authorization

通用 SaaS 的**四层细粒度权限判定核心与 CASL 能力工厂引擎（Four-tier Authorization Kernel）**。

## 1. 模块定位与职责

本模块是多租户企业 ERP 系统的安全防线中枢，承接 ADR-003（四层权限防御体系）与 ADR-005（Feature Manifest 自描述清单架构）。
它不负责登录鉴权（Who are you，由 `@base/auth` 负责），而是专注于计算与执行**具体权能（What can you do & What can you see）**：

1. **第一层：功能操作权限 (Actions)**：基于 CASL 判定用户角色能否在特定资源上执行操作（`can("read", "ProcurementOrder")`）。
2. **第二层：行级数据范围 (Data Scope)**：解析五种数据范围模式（`SELF`、`DEPT`、`DEPT_TREE`、`CUSTOM`、`ALL`），并下推生成安全 Prisma `where` 查询条件（`accessibleBy` / `getAccessibleWhere`）。
3. **第三层：列级字段权限 (Field Policy)**：解析字段三态（`HIDDEN`、`READONLY`、`EDITABLE`），在服务端 DTO 层直接剥离敏感字段（`pickReadableFields`），在表单输入校验修改合法性（`assertEditableFields`）。
4. **第四层：动态路由与导航过滤 (Manifest Nav)**：依据切片导出的 `TenantFeatureManifest` 自动派生系统菜单树，依据实时 Ability 剔除无权页面（`filterNavSections`）。

## 2. 内部架构分层与真实文件树

```
packages/authorization/
├── src/
│   ├── core/                       # 【契约与清单推导】
│   │   ├── actions.ts              # StandardAction 标准 CRUD 操作定义
│   │   ├── catalog.ts              # PermissionCatalog 权限目录元数据契约与校验
│   │   └── manifest.ts             # TenantFeatureManifest 自描述清单协议与导航派生
│   ├── scopes/                     # 【数据范围引擎】
│   │   └── data-scope.ts           # DataScope 解析器与部门树 SQL 条件装配 (Fail-Closed)
│   ├── fields/                     # 【字段策略引擎】
│   │   └── field-policy.ts         # FieldPolicy 字段三态推导与字段掩码裁剪/拦截
│   ├── ability/                    # 【CASL 核心工厂与下推】
│   │   ├── ability-factory.ts      # CaslAbilityFactory 四层权限整合编译为 AppAbility / AppPrismaAbility
│   │   └── prisma-access.ts        # getAccessibleWhere (@casl/prisma 查询下推适配器)
│   ├── adapters/                   # 【跨端运行适配器】
│   │   ├── server.ts               # 服务端 Server Action 守卫 (createServerAbilityAdapter)
│   │   └── react.tsx               # 浏览器端 React Context, Hooks (useAbility) 与 <Can /> 声明式组件
│   ├── react.tsx                   # ./react 导出桥接
│   └── index.ts                    # 统一平滑聚合导出入口
└── README.md
```

## 3. 核心 API 与使用示例

### 3.1 服务端构建 Ability 并执行数据与字段安全过滤

```ts
import {
  CaslAbilityFactory,
  getAccessibleWhere,
  pickReadableFields,
} from "@base/authorization";

// 1. 编译当前租户身份的 CASL Ability
const factory = new CaslAbilityFactory({ catalog, repository: controlRepo });
const ability = await factory.createForTenant(tenantContext);

// 2. 数据范围下推为 Prisma where 条件（如只能看本部门或本人数据）
const accessibleWhere = getAccessibleWhere(ability, "read", "ProcurementOrder");
const orders = await tenantPrisma.procurementOrder.findMany({
  where: { AND: [baseFilter, accessibleWhere] },
});

// 3. 字段列级安全裁剪（自动抹除无权查看的敏感单价/成本）
const safeOrders = orders.map((order) =>
  pickReadableFields(order, ability, "ProcurementOrder"),
);
```

### 3.2 客户端声明式鉴权组件

```tsx
"use client";
import { createReactAbilityAdapter } from "@base/authorization/react";
import { orderCatalog } from "./order.contract";

const { Can } = createReactAbilityAdapter(orderCatalog);

export function OrderActionBar({ order }: { order: ProcurementOrder }) {
  return (
    <div>
      <Can I="update" a="ProcurementOrder">
        <button onClick={handleEdit}>编辑订单</button>
      </Can>
      <Can I="audit" a="ProcurementOrder">
        <button onClick={handleAudit}>审核订单</button>
      </Can>
    </div>
  );
}
```

## 4. 安全红线与架构原则

1. **绝对 Fail-Closed（安全关闭）原则**：若缺少租户上下文、部门未分配或角色未定义，所有权限判定一律默认拒绝，SQL 下推强制返回不可命中条件（`{ id: FAIL_CLOSED_ID }`），绝不放行。
2. **切片去中心化与开闭原则 (ADR-005)**：核心包不硬编码任何具体业务模型（如 `ProcurementOrder`），业务切片通过 `manifest.ts` 自定义模型并向权限中枢注册。
3. **字段权限物理剥离**：`HIDDEN` 字段必须在服务端直接从返回 DTO 中剔除，不得依赖前端 CSS `display: none` 隐藏。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @base/authorization check

# 单元测试与端到端权限断言 (36 个测试用例全部通过)
pnpm --filter @base/authorization test
```
