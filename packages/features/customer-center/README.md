# @chenrun/feature-customer-center

辰润 ERP 的**客户中心与门店报价垂直切片模块（Customer & Store Management Feature）**。

## 1. 模块定位与职责

本模块专注于企业客户资产、销售网点与报价策略的统一数字化管理：

- **数据契约与 DTO (`contracts/`)**：
  - `customer.contract.ts`: 客户主数据、等级（VIP/普通）、跟进状态、联系方式契约。
  - `store.contract.ts`: 客户旗下门店网点信息、地址、负责人。
  - `quote.contract.ts`: 阶梯价格与报价单条目。
  - `category-tag.contract.ts`: 客户多维行业标签与分类体系。
- **客户领域服务 (`services/`)**：
  - `customer-service.ts`: 客户生命周期（潜在、签约、流失）、信用额度与档案维护。
  - `store-service.ts`: 门店网点维护。
  - `quote-service.ts`: 客户报价历史、有效期限与审批支持。
  - `category-tag-service.ts`: 客户分类标签树构建与管理。
- **Next.js Server Actions (`actions.ts`)**：提供客户、门店、报价单和分类标签的增删改查 Server Actions，数据由 `toPlainData` 完成安全序列化。
- **专属业务交互组件 (`components/`)**：
  - `CustomerView`: 客户主数据台账与详情管理。
  - `StoreView`: 门店网点视图。
  - `QuoteView`: 客户专属报价管理。
  - `CategoryTagView`: 标签分类编排视图。
- **模块清单元数据 (`manifest.ts`)**：注册客户中心导航菜单项及权限动作。

## 2. 内部架构与目录结构

```text
packages/features/customer-center/
├── src/
│   ├── contracts/                    # 纯 TypeScript 业务契约与 DTO
│   │   ├── category-tag.contract.ts  # 分类标签契约
│   │   ├── customer.contract.ts      # 客户实体契约与校验规则
│   │   ├── quote.contract.ts         # 报价单契约
│   │   ├── store.contract.ts         # 门店契约
│   │   └── index.ts
│   ├── services/                     # 领域服务实现与单测
│   │   ├── category-tag-service.ts
│   │   ├── customer-service.ts
│   │   ├── quote-service.ts
│   │   ├── store-service.ts
│   │   └── index.ts
│   ├── components/                   # 专属 UI 视图
│   │   ├── CategoryTagView.tsx       # 分类标签视图
│   │   ├── CustomerView.tsx          # 客户工作台主视图
│   │   ├── QuoteView.tsx             # 报价单视图
│   │   ├── StoreView.tsx             # 门店网点视图
│   │   └── index.ts
│   ├── server/                       # 租户上下文服务端提取
│   ├── actions.ts                    # Next.js Server Actions
│   ├── manifest.ts                   # 导航与功能清单元数据
│   ├── types.ts                      # 领域类型
│   └── index.ts                      # 统一导出入口
└── package.json
```

## 3. 核心 API 与使用示例

### 3.1 消费客户领域服务

```ts
import { getCustomerService } from "@chenrun/feature-customer-center";

const service = await getCustomerService();
const customers = await service.listCustomers({
  page: 1,
  pageSize: 20,
  keyword: "辰润",
});
```

### 3.2 客户组件集成

```tsx
import { CustomerView } from "@chenrun/feature-customer-center";

export function CustomerManagePage() {
  return <CustomerView />;
}
```

## 4. 架构原则与红线

1. **严格物理隔离**：所有客户与报价数据落库于租户物理库，绝不允许管控库混存。
2. **敏感联系信息保护**：客户手机号、关键联系人受 CASL 字段权限及脱敏保护（`AuthorizedField` / `maskPhone`）。
3. **高内聚业务切片**：客户中心相关契约、服务与组件完全内聚于本包，禁止与其他业务切片产生循环依赖。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @chenrun/feature-customer-center check

# 运行单元测试
pnpm --filter @chenrun/feature-customer-center test
```
