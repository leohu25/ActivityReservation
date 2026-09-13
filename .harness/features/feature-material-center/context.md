# 特性背景：物料与工艺BOM中心 (feature-material-center)

## 一、业务目标与需求背景

生鲜配送与净菜加工业务是典型的**连续加工 + 规格化分装 + 菜品组合调理**复合业态。与传统离散制造业不同，生鲜净菜加工具备以下独特痛点：

1. **物料角色多变**：同一个初级蔬菜（如土豆毛料）经过分拣、清洗、切丝后形成中间半成品，再经过包装成为销售成品，边角产生副产品（废料或边角料）。
2. **多单位频繁换算**：采购按件/箱，库存按公斤/斤核算，销售按袋/份，生产投料按克/两，必须由全局换算基准与物料级自定义换算表保证数量与金额精度（对齐 DEC-ITEM-001 数量精度控制）。
3. **出成率与损耗波动**：每道工序存在加工损耗，存在工序出成率连乘（$\prod$）与表头总出成率直接覆盖双轨模式。
4. **BOM 三态与多层级装配**：单品加工（初级清洗切割）、组合调理（配方菜谱）、包装分装（定量规格封袋）三类 BOM，构成多层级有向无环图 (DAG)。
5. **研发与生产双轨版本**：新净菜配方需经历研发打样（研发BOM），试制评审通过后发布为具有严格版本号（V1.0、V2.0）的生产BOM，生产工单下发时强锁定版本，禁止运行时主数据漂移。

---

## 二、核心功能切片划分 (Features & Sub-Features)

整个 Business Area 命名为 `@base/feature-material-center`（工作区目录 `packages/features/material-center`），内聚以下 4 大纵向业务特性：

### 1. 计量单位与多单位管理 (`unit-management`)

- **度量衡基准字典**：重量 (WEIGHT)、计件 (COUNT)、体积 (VOLUME) 等大类，以法定标准单位为基准（如克 `g` 为重量基准，`1斤 = 500g`, `1kg = 1000g`）。
- **物料专属换算规则**：支持为特定物料单独配置换算率（如特定冬瓜 `1件 = 40斤`，某番茄酱 `1箱 = 24瓶`）。
- **数量精度引擎**：根据物料主档案设置的 `qtyPrecision`（2位/3位）严格执行截断或舍入，消除浮点数累计误差。

### 2. 品类、品种与商品分类 (`classification`)

- **商品分类树 (ItemCategory)**：支持一级品类、二级品类（以及三级分类）树状拓扑维护，用于采购分类、报价单分组与报表统计。
- **独立品种档案 (ItemVariety)**：独立主数据（如：土豆、青椒、精选五花肉、黄瓜），承接生物学/农产品原始品种属性。
- **品种等级字典 (ItemGrade)**：一级品、特选级、精选级等标准化品级字典。

### 3. 商品档案管理 (`item-master`)

- **四类物料划分**：原料 (RAW)、半成品 (SEMI_FINISHED)、成品 (FINISHED)、包材 (PACKAGING)。
- **供应与排产策略**：外购 (PURCHASE)、自制 (MANUFACTURE)、自制为主可外购 (HYBRID)。
- **多单位绑定**：基本核算单位 (baseUnit)、采购单位 (purchaseUnit)、库存单位 (stockUnit)、生产单位 (productionUnit)、销售单位 (salesUnit)。
- **控制阈值**：最小采购量、最小销售量、单次最大销售量、销售数量精度。
- **净菜加工与储运属性**：是否批次管理、温区（常温/冷藏/冷冻）、加工形态（整棵/丁/丝/片/段）、净菜加工品标识、默认工艺路线编码、质检验收标准。

### 4. 工序与工艺 BOM 管理 (`bom-management`)

- **工序档案与规格模板 (`process`)**：工序分类、默认损耗率、标准工时、最小批次、工序指导参数模板（如切丝5MM、清洗2遍）及操作指引图文。
- **生产产线模型 (`production-line`)**：蔬菜清洗切割线、荤菜加工线、调理加工线、包装分拣线等车间物理工作中心。
- **工艺 BOM 主体 (`bom`)**：
  - BOM 类型：单品 BOM (SINGLE)、组合 BOM (COMPOSITE)、包装 BOM (PACKAGING)。
  - 版本生命周期流转：草稿 (DRAFT) $\to$ 研发打样 (RESEARCHING) $\to$ 评审中 (UNDER_REVIEW) $\to$ 已发布/生产生效 (ACTIVE) $\to$ 已归档 (ARCHIVED)。
  - 双轨出成率核算：工序级联出成率计算与表头总出成率强覆盖模式。
  - 工序有向流转：工序顺序号 (`seqNo`)、投入明细（含流转品、外部子件、直接外购件及投料配比）、产出明细（主产出、副产物/边角料、废品及下游工序指向 `nextProcessSeq`）。
  - 循环引用检测：保存与发布时使用 DFS 检测装配依赖环，杜绝 A $\to$ B $\to$ A 死循环。
  - 运行时计划员策略覆盖 (`BomMrpOverride`)：MRP 计算前允许针对特定排产计划调整外部子件为外购件，原 BOM 主数据保持不变。

---

## 三、架构边界与红线遵从

1. **租户物理隔离**：全量业务表存放在租户独立 PostgreSQL 数据库中，彻底消除任何 `tenantId` 逻辑冗余列。
2. **八大审计基线 (ADR-009)**：所有独立主数据表（`ItemCategory`、`ItemVariety`、`ItemGrade`、`UnitOfMeasure`、`ItemMaster`、`ProductionLine`、`ProcessMaster`、`ProcessSpec`、`BomHeader`、`BomMrpOverride`）必须 100% 具备 `createdById`、`deptId`、`updatedById`、`isDeleted`、`deletedAt`、`deletedById`、`createdAt`、`updatedAt` 8 个字段，从表（`UnitConversion`、`BomProcess`、`BomInputItem`、`BomOutputItem`）级联主表。
3. **CASL 纯数据权限契约 (SSoT)**：4 个受控页面各拥有独立的 `contract.ts`，禁止平铺 permissions，统一在应用装配层注入 `MaterialAbilityBoundary`。
4. **工业风 UI 与设计系统**：严格使用 `@base/ui` 的 `DataTable.Workspace`、`DataTable.Root`、`FormModal`、`Badge`、`Tabs` 搭建，禁止手写裸 DOM、原生表格与原生弹窗。
