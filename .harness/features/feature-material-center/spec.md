# 任务规格说明书 (Task Spec)：物料管理与工艺BOM中心 (feature-material-center)

- **特性编号 (Feature ID)**: `feature-material-center`
- **特性名称**: 物料管理与工艺BOM中心 (Material & Process BOM Center)
- **负责角色**: coordinator (需求架构与自包含规格化) / implementer (代码实现) / reviewer (门禁审计)
- **关联上游标准**:
  - `PROC-ITEM-001-品类品种与商品档案.md`
  - `PROC-ITEM-002-工艺BOM.md`
  - `PROC-ITEM-002-示例数据.md`
  - `ADR-009` (实体审计与软删除强制基线)
  - `next-saas-base-dev` (8 阶段标准垂直切片流水线)

---

## 一、 领域设计与边界契约 (Domain Design & Boundary Invariants)

### 1. 架构定位与物理边界

- **工作区包路径**: `packages/features/material-center`
- **npm 包名**: `@base/feature-material-center`
- **多租户隔离模式**: **PostgreSQL Database-per-tenant 物理隔离**。所有业务表由 `TenantDbManager` 动态路由至租户私有数据库，**数据模型中严禁出现 `tenantId` 字段**。
- **八大实体审计基线 (ADR-009)**: 所有具有独立生命周期的主数据实体，必须强制包含：
  `createdById: String`、`deptId: String?`、`updatedById: String?`、`isDeleted: Boolean`、`deletedAt: DateTime?`、`deletedById: String?`、`createdAt: DateTime`、`updatedAt: DateTime`。
  门禁脚本 `scripts/check-entity-baseline.mjs` 硬性拦截违规定义。

### 2. 核心子领域与概念口径（已根据用户问询对齐）

1. **分类、品种与等级**：
   - **商品分类 (ItemCategory)**：树状结构（支持一级品类、二级品类、三级细分），服务于商品挂载、筛选与分类统计；
   - **独立品种档案 (ItemVariety)**：作为独立主数据（如：土豆、青椒、精选五花肉），承接农产品原始生物品种属性；
   - **品种等级 (ItemGrade)**：作为品级字典（如：一级品、精选级、特选级）。
2. **计量单位与多单位换算**：
   - **单位字典 (UnitOfMeasure)**：分为重量 (WEIGHT)、计件 (COUNT)、体积 (VOLUME) 等类别。设定基准折算率（以克 g 为基准，1斤=500g, 1kg=1000g）；
   - **物料级专属换算 (UnitConversion)**：支持特定商品个性化换算（如某冬瓜 `1件 = 40斤`），优先级高于全局通用折算；
   - **精度控制**：销售与报工时遵循商品档案声明的 `qtyPrecision`（2位/3位）严格截断。
3. **商品档案 (ItemMaster)**：
   - 四类物料角色：原料 (RAW)、半成品 (SEMI_FINISHED)、成品 (FINISHED)、包材 (PACKAGING)；
   - 供应方式：外购 (PURCHASE)、自制 (MANUFACTURE)、自制为主可外购 (HYBRID)；
   - 包含批次管理、温区、加工形态、净菜标识、默认工艺路线、验收标准与控制阈值。
4. **工序与工艺 BOM**：
   - 工序档案 (`ProcessMaster`) 与加工规格指导参数 (`ProcessSpec`，如切丝5MM、清洗2遍)；
   - 生产产线 (`ProductionLine`，如蔬菜清洗切割线、荤菜加工线、包装分拣线)；
   - 三类 BOM 模型 (`BomHeader`)：单品 BOM (SINGLE)、组合 BOM (COMPOSITE)、包装 BOM (PACKAGING)；
   - 基础发布生命周期流转：草稿 (DRAFT) $\to$ 评审中 (UNDER_REVIEW) $\to$ 已发布 (ACTIVE) $\to$ 已归档 (ARCHIVED)。发布后生成不可变版本快照，工单强锁定；
   - 双轨出成率计算：工序出成率连乘（$\prod$）与表头总出成率强覆盖；
   - 投入产出有向流转：工序节点明细指定投入物料（流转品/外部子件/外购件）、产出物料（主产物/副产物/废料）及流向工序 `nextProcessSeq`；
   - DFS 循环引用检测：保存与发布时执行递归依赖校验，拦截环形引用；
   - MRP 运行时策略覆盖 (`BomMrpOverride`)：排产阶段支持临时将外部子件改为外购件，原 BOM 主数据不变。

---

## 二、 数据库物理数据模型 (Prisma Schema Specification)

在 `packages/features/material-center/prisma/schema.prisma` 中实现：

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client-material"
}

datasource db {
  provider = "postgresql"
}

// ----------------------------------------------------
// 1. 分类、品种与等级
// ----------------------------------------------------

/// 商品分类树（支持一级品类、二级品类及多级扩展）
model ItemCategory {
  id             String    @id @default(cuid())
  categoryCode   String    @unique @map("category_code") @db.VarChar(30)
  categoryName   String    @map("category_name") @db.VarChar(100)
  parentId       String?   @map("parent_id") @db.VarChar(30)
  level          Int       @default(1)
  sortOrder      Int       @default(0) @map("sort_order")
  status         String    @default("ACTIVE") @db.VarChar(20)

  // 框架强制基础审计基线 (ADR-009)
  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  parent         ItemCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children       ItemCategory[] @relation("CategoryTree")
  items          ItemMaster[]

  @@index([parentId])
  @@index([createdById])
  @@index([isDeleted])
  @@map("item_category")
}

/// 独立品种档案（农产品原始属性，如：土豆、青椒、精选五花肉）
model ItemVariety {
  id             String    @id @default(cuid())
  varietyCode    String    @unique @map("variety_code") @db.VarChar(30)
  varietyName    String    @map("variety_name") @db.VarChar(100)
  description    String?   @db.VarChar(200)
  status         String    @default("ACTIVE") @db.VarChar(20)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  items          ItemMaster[]

  @@index([createdById])
  @@index([isDeleted])
  @@map("item_variety")
}

/// 品种等级字典（如：一级品、精选级）
model ItemGrade {
  id             String    @id @default(cuid())
  gradeCode      String    @unique @map("grade_code") @db.VarChar(30)
  gradeName      String    @map("grade_name") @db.VarChar(100)
  description    String?   @db.VarChar(200)
  status         String    @default("ACTIVE") @db.VarChar(20)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  items          ItemMaster[]

  @@index([createdById])
  @@index([isDeleted])
  @@map("item_grade")
}

// ----------------------------------------------------
// 2. 计量单位与多单位换算
// ----------------------------------------------------

/// 计量单位字典
model UnitOfMeasure {
  id             String    @id @default(cuid())
  unitCode       String    @unique @map("unit_code") @db.VarChar(30)
  unitName       String    @map("unit_name") @db.VarChar(50)
  unitType       String    @map("unit_type") @db.VarChar(20) // WEIGHT / COUNT / VOLUME
  baseRatio      Decimal   @map("base_ratio") @db.Decimal(12, 4)
  isBaseUnit     Boolean   @default(false) @map("is_base_unit")
  status         String    @default("ACTIVE") @db.VarChar(20)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  conversionsAsFrom UnitConversion[] @relation("FromUnit")
  conversionsAsTo   UnitConversion[] @relation("ToUnit")

  @@index([createdById])
  @@index([isDeleted])
  @@map("unit_of_measure")
}

/// 多单位换算规则（从表，级联单位与物料）
model UnitConversion {
  id             String    @id @default(cuid())
  itemCode       String?   @map("item_code") @db.VarChar(50)
  fromUnitId     String    @map("from_unit_id") @db.VarChar(50)
  toUnitId       String    @map("to_unit_id") @db.VarChar(50)
  conversionRate Decimal   @map("conversion_rate") @db.Decimal(12, 4)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  fromUnit       UnitOfMeasure @relation("FromUnit", fields: [fromUnitId], references: [id])
  toUnit         UnitOfMeasure @relation("ToUnit", fields: [toUnitId], references: [id])
  item           ItemMaster?   @relation(fields: [itemCode], references: [itemCode])

  @@unique([itemCode, fromUnitId, toUnitId])
  @@map("unit_conversion")
}

// ----------------------------------------------------
// 3. 商品档案主数据
// ----------------------------------------------------

/// 商品主档案
model ItemMaster {
  id                 String    @id @default(cuid())
  itemCode           String    @unique @map("item_code") @db.VarChar(50)
  itemName           String    @map("item_name") @db.VarChar(100)
  itemAlias          String?   @map("item_alias") @db.VarChar(100)
  pictureUrl         String?   @map("picture_url") @db.VarChar(500)
  
  itemCategory       String    @map("item_category") @db.VarChar(20) // RAW / SEMI_FINISHED / FINISHED / PACKAGING
  categoryId         String    @map("category_id") @db.VarChar(50)
  varietyId          String?   @map("variety_id") @db.VarChar(50)
  gradeId            String?   @map("grade_id") @db.VarChar(50)
  supplyMode         String    @map("supply_mode") @db.VarChar(20)   // PURCHASE / MANUFACTURE / HYBRID
  itemType           String    @default("STANDARD") @map("item_type") @db.VarChar(20)
  itemTags           String?   @map("item_tags") @db.VarChar(200)
  
  baseUnit           String    @map("base_unit") @db.VarChar(20)
  purchaseUnit       String    @map("purchase_unit") @db.VarChar(20)
  stockUnit          String    @map("stock_unit") @db.VarChar(20)
  productionUnit     String?   @map("production_unit") @db.VarChar(20)
  salesUnit          String?   @map("sales_unit") @db.VarChar(20)
  
  minPurchaseQty     Decimal?  @map("min_purchase_qty") @db.Decimal(12, 3)
  minSalesQty        Decimal?  @map("min_sales_qty") @db.Decimal(12, 3)
  maxSalesQty        Decimal   @default(99999) @map("max_sales_qty") @db.Decimal(12, 3)
  qtyPrecision       Int       @default(2) @map("qty_precision")
  
  defaultSupplierId  String?   @map("default_supplier_id") @db.VarChar(50)
  defaultWarehouseId String?   @map("default_warehouse_id") @db.VarChar(50)
  defaultRouteCode   String?   @map("default_route_code") @db.VarChar(50)
  
  shelfLifeHours     Int?      @map("shelf_life_hours")
  batchManaged       Boolean   @default(true) @map("batch_managed")
  temperatureZone    String?   @map("temperature_zone") @db.VarChar(20)
  processingForm     String?   @map("processing_form") @db.VarChar(50)
  freshCutFlag       Boolean   @default(false) @map("fresh_cut_flag")
  acceptanceStandard String?   @map("acceptance_standard") @db.Text
  referencePrice     Decimal?  @map("reference_price") @db.Decimal(10, 2)
  status             String    @default("ACTIVE") @db.VarChar(20)

  createdById        String    @map("created_by_id") @db.VarChar(50)
  deptId             String?   @map("dept_id") @db.VarChar(50)
  updatedById        String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted          Boolean   @default(false) @map("is_deleted")
  deletedAt          DateTime? @map("deleted_at")
  deletedById        String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  category           ItemCategory     @relation(fields: [categoryId], references: [id])
  variety            ItemVariety?     @relation(fields: [varietyId], references: [id])
  grade              ItemGrade?       @relation(fields: [gradeId], references: [id])
  conversions        UnitConversion[]
  bomsAsOutput       BomHeader[]      @relation("BomOutputItem")

  @@index([itemCategory, status])
  @@index([createdById])
  @@index([isDeleted])
  @@map("item_master")
}

// ----------------------------------------------------
// 4. 车间产线、工序与加工规格
// ----------------------------------------------------

/// 生产产线
model ProductionLine {
  id             String    @id @default(cuid())
  lineCode       String    @unique @map("line_code") @db.VarChar(30)
  lineName       String    @map("line_name") @db.VarChar(100)
  description    String?   @db.VarChar(200)
  status         String    @default("ACTIVE") @db.VarChar(20)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  boms           BomHeader[]

  @@index([createdById])
  @@index([isDeleted])
  @@map("production_line")
}

/// 工序档案
model ProcessMaster {
  id              String    @id @default(cuid())
  processCode     String    @unique @map("process_code") @db.VarChar(30)
  processName     String    @map("process_name") @db.VarChar(100)
  category        String    @db.VarChar(20) // PRE_TREAT / CLEAN / CUT / SEASON / COOK / PACK
  defaultLossRate Decimal   @default(0) @map("default_loss_rate") @db.Decimal(5, 2)
  minBatchQty     Decimal?  @map("min_batch_qty") @db.Decimal(12, 3)
  stdLaborHours   Decimal?  @map("std_labor_hours") @db.Decimal(8, 3)
  description     String?   @db.VarChar(200)
  status          String    @default("ACTIVE") @db.VarChar(20)

  createdById     String    @map("created_by_id") @db.VarChar(50)
  deptId          String?   @map("dept_id") @db.VarChar(50)
  updatedById     String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted       Boolean   @default(false) @map("is_deleted")
  deletedAt       DateTime? @map("deleted_at")
  deletedById     String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  specs           ProcessSpec[]
  bomProcesses    BomProcess[]

  @@index([createdById])
  @@index([isDeleted])
  @@map("process_master")
}

/// 工序加工规格与指导参数
model ProcessSpec {
  id              String    @id @default(cuid())
  processId       String    @map("process_id") @db.VarChar(50)
  specCode        String    @map("spec_code") @db.VarChar(30)
  specName        String    @map("spec_name") @db.VarChar(100)
  specParams      Json      @map("spec_params")
  defaultLossRate Decimal?  @map("default_loss_rate") @db.Decimal(5, 2)
  status          String    @default("ACTIVE") @db.VarChar(20)

  createdById     String    @map("created_by_id") @db.VarChar(50)
  deptId          String?   @map("dept_id") @db.VarChar(50)
  updatedById     String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted       Boolean   @default(false) @map("is_deleted")
  deletedAt       DateTime? @map("deleted_at")
  deletedById     String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  process         ProcessMaster @relation(fields: [processId], references: [id])
  bomProcesses    BomProcess[]

  @@unique([processId, specCode])
  @@index([createdById])
  @@index([isDeleted])
  @@map("process_spec")
}

// ----------------------------------------------------
// 5. 工艺 BOM（单品 / 组合 / 包装）
// ----------------------------------------------------

/// BOM 表头
model BomHeader {
  id                 String    @id @default(cuid())
  bomCode            String    @unique @map("bom_code") @db.VarChar(50)
  bomName            String    @map("bom_name") @db.VarChar(100)
  bomType            String    @map("bom_type") @db.VarChar(20) // SINGLE / COMPOSITE / PACKAGING
  version            String    @default("V1.0") @db.VarChar(20)
  isResearch         Boolean   @default(false) @map("is_research")
  isDefault          Boolean   @default(true) @map("is_default")
  
  outputItemCode     String    @map("output_item_code") @db.VarChar(50)
  batchQty           Decimal   @default(1) @map("batch_qty") @db.Decimal(12, 3)
  batchUnit          String    @map("batch_unit") @db.VarChar(20)
  
  productionLineId   String?   @map("production_line_id") @db.VarChar(50)
  routeCode          String?   @map("route_code") @db.VarChar(50)
  overrideTotalYield Boolean   @default(false) @map("override_total_yield")
  totalYieldRate     Decimal?  @map("total_yield_rate") @db.Decimal(5, 2)
  
  status             String    @default("DRAFT") @db.VarChar(20) // DRAFT / UNDER_REVIEW / ACTIVE / ARCHIVED
  effectiveDate      DateTime  @default(now()) @map("effective_date")
  remark             String?   @db.VarChar(200)

  createdById        String    @map("created_by_id") @db.VarChar(50)
  deptId             String?   @map("dept_id") @db.VarChar(50)
  updatedById        String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted          Boolean   @default(false) @map("is_deleted")
  deletedAt          DateTime? @map("deleted_at")
  deletedById        String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  outputItem         ItemMaster      @relation("BomOutputItem", fields: [outputItemCode], references: [itemCode])
  productionLine     ProductionLine? @relation(fields: [productionLineId], references: [id])
  processes          BomProcess[]

  @@index([outputItemCode, bomType, status])
  @@index([createdById])
  @@index([isDeleted])
  @@map("bom_header")
}

/// BOM 工序明细（级联主表）
model BomProcess {
  id                    String    @id @default(cuid())
  bomId                 String    @map("bom_id") @db.VarChar(50)
  seqNo                 Int       @map("seq_no")
  processId             String    @map("process_id") @db.VarChar(50)
  specId                String?   @map("spec_id") @db.VarChar(50)
  
  lossRate              Decimal   @map("loss_rate") @db.Decimal(5, 2)
  yieldRate             Decimal   @map("yield_rate") @db.Decimal(5, 2)
  stdLaborHours         Decimal?  @map("std_labor_hours") @db.Decimal(8, 3)
  qcCheckpoint          Boolean   @default(false) @map("qc_checkpoint")
  
  instructionParams     Json?     @map("instruction_params")
  operatingInstructions String?   @map("operating_instructions") @db.Text

  bom                   BomHeader      @relation(fields: [bomId], references: [id], onDelete: Cascade)
  process               ProcessMaster  @relation(fields: [processId], references: [id])
  spec                  ProcessSpec?   @relation(fields: [specId], references: [id])
  inputs                BomInputItem[]
  outputs               BomOutputItem[]

  @@index([bomId, seqNo])
  @@map("bom_process")
}

/// BOM 投入物料明细（级联工序）
model BomInputItem {
  id             String     @id @default(cuid())
  bomProcessId   String     @map("bom_process_id") @db.VarChar(50)
  itemCode       String     @map("item_code") @db.VarChar(50)
  quantity       Decimal    @db.Decimal(12, 3)
  uom            String     @db.VarChar(20)
  materialRole   String     @map("material_role") @db.VarChar(20) // FLOW / SUB_BOM / PURCHASE
  proportion     Decimal?   @db.Decimal(5, 2)
  prevProcessSeq Int?       @map("prev_process_seq")
  childBomId     String?    @map("child_bom_id") @db.VarChar(50)

  bomProcess     BomProcess @relation(fields: [bomProcessId], references: [id], onDelete: Cascade)

  @@index([bomProcessId])
  @@map("bom_input_item")
}

/// BOM 产出物料明细（级联工序）
model BomOutputItem {
  id             String     @id @default(cuid())
  bomProcessId   String     @map("bom_process_id") @db.VarChar(50)
  itemCode       String     @map("item_code") @db.VarChar(50)
  quantity       Decimal    @db.Decimal(12, 3)
  uom            String     @db.VarChar(20)
  outputType     String     @map("output_type") @db.VarChar(20)   // MAIN / BYPRODUCT / SCRAP
  materialRole   String     @map("material_role") @db.VarChar(20) // FLOW / FINAL
  nextProcessSeq Int?       @map("next_process_seq")

  bomProcess     BomProcess @relation(fields: [bomProcessId], references: [id], onDelete: Cascade)

  @@index([bomProcessId])
  @@map("bom_output_item")
}

/// MRP 运行时临时策略覆盖
model BomMrpOverride {
  id             String    @id @default(cuid())
  planId         String    @map("plan_id") @db.VarChar(50)
  bomId          String    @map("bom_id") @db.VarChar(50)
  inputItemId    String    @map("input_item_id") @db.VarChar(50)
  originalRole   String    @map("original_role") @db.VarChar(20)
  newRole        String    @map("new_role") @db.VarChar(20)
  reason         String?   @db.VarChar(200)

  createdById    String    @map("created_by_id") @db.VarChar(50)
  deptId         String?   @map("dept_id") @db.VarChar(50)
  updatedById    String?   @map("updated_by_id") @db.VarChar(50)
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedAt      DateTime? @map("deleted_at")
  deletedById    String?   @map("deleted_by_id") @db.VarChar(50)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([planId, bomId])
  @@index([createdById])
  @@index([isDeleted])
  @@map("bom_mrp_override")
}
```

---

## 三、 纯数据契约与权限规划 (CASL Contract & SSoT)

在 `material-center` 中定义 4 大契约，挂载至 `src/manifest.ts`：

| 模块名称 | Subject | 路由路径 | 核心受控动作 |
| :--- | :--- | :--- | :--- |
| **商品分类与品种** | `ItemCategory` | `/materials/categories` | `read`, `create`, `update`, `delete`, `toggle_status` |
| **计量单位与换算** | `UnitOfMeasure` | `/materials/units` | `read`, `create`, `update`, `delete`, `configure_conversion` |
| **商品档案管理** | `ItemMaster` | `/materials/items` | `read`, `create`, `update`, `delete`, `export`, `toggle_status` |
| **工艺BOM管理** | `BomHeader` | `/materials/boms` | `read`, `create`, `update`, `delete`, `publish`, `archive`, `override_mrp` |

---

## 四、 关键算法与领域计算

1. **单位物理换算算法 (`UnitConversionService`)**：
   - 目标：将输入的 `(fromQty, fromUnitCode)` 折算为目标 `toUnitCode` 对应的数量；
   - 查找顺序：物料级专属换算（直接命中） $\to$ 同类别基准折算（通过 `baseRatio` 线性转换：`baseQty = fromQty * fromRatio`, `toQty = baseQty / toRatio`） $\to$ 无法换算抛出受控 DomainError；
   - 精度保护：按物料主档案 `qtyPrecision` 截断，使用 `Decimal.js` 杜绝浮点失真。
2. **综合出成率与反推算法 (`BomCalculatorService`)**：
   - 若 `overrideTotalYield === true`，直接采用 `totalYieldRate`；
   - 否则：`totalYieldRate = processes.reduce((acc, p) => acc * (p.yieldRate / 100), 1) * 100`；
   - MRP 理论毛料投料量：`inputQty = outputQty / (totalYieldRate / 100)`。
3. **依赖闭环检测器 (`CycleDetector`)**：
   - 在 BOM 保存和发布前，以目标物料作为根节点，对其所有 `SUB_BOM` 投入物料构建依赖邻接表；
   - 运行 DFS 遍历，若访问到当前递归栈中的节点，抛出 `"检测到 BOM 循环引用闭环: A -> B -> A"` 并阻断持久化。
4. **发布不可变版本快照 (`PublishSnapshotEngine`)**：
   - 发布状态机：`DRAFT -> UNDER_REVIEW -> ACTIVE -> ARCHIVED`；
   - `publish` 操作执行前检测：无循环引用、投入产出完整、主产物数量大于 0；
   - 发布后状态置为 `ACTIVE`，版本号锁定为不可变历史，后续变更必须“另存新版本”（如从 V1.0 派生 V1.1）。

---

## 五、 前端高密度交互与 UI 规范 (@base/ui)

1. **导航装配**：在租户侧边栏顶级注入【物料管理】手风琴分组：
   - `/materials/categories`：分类与品种档案（左右联动分栏，左侧分类树，右侧独立品种列表）；
   - `/materials/units`：计量单位与换算管理（基准单位标签页 + 物料专属换算规则）；
   - `/materials/items`：商品档案列表（高密度 `DataTable.Workspace`，包含原料/半成品/成品/包材 Tab 切换）；
   - `/materials/boms`：工艺 BOM 主工作台（单品/组合/包装三 Tab 筛选、出成率展示、发布状态徽标）；
   - `/materials/boms/[bomId]`：BOM 详情与拓扑图视图（集成可视化 DAG 流程图与工序明细表）。
2. **交互红线**：
   - 破坏性删除统一由 `ConfirmDialog` 单次确认；
   - 操作反馈右上角 Toast 提示，零静态大横幅；
   - 零 `window.location.reload()`，使用本地状态驱动与 Server Action 联动。

---

## 六、 任务拆解与实施步骤 (Implementation SOP)

- **Step 1: 包骨架与模式定义**
  - 初始化 `packages/features/material-center` 并配置 Client/Server 语义子路径；
  - 编写 `prisma/schema.prisma` 并由 `sync-tenant-schema.mjs` 聚合；
  - 执行 `pnpm db:migrate:generate` 生成租户增量迁移并在沙盒验证；
  - 运行 `scripts/check-entity-baseline.mjs` 确保 100% 通过。
- **Step 2: 纯数据契约与自发现**
  - 编写 4 个 Feature 的 `contract.ts`；
  - 编写 `src/manifest.ts`，运行 `pnpm sync:features` 生成应用内核注册表。
- **Step 3: 领域服务、计算引擎与单元测试**
  - 编写 `UnitConversionService`、`ItemMasterService`、`BomCalculatorService`、`BomService`；
  - 编写针对换算、出成率、循环检测的同级单测（`*.test.ts`），确保用例 100% 全绿。
- **Step 4: 安全 Actions 与 RSC Queries**
  - 编写 RSC 纯服务端只读查询（支持数据权限与软删除物理下推）；
  - 编写 `defineServerAction` 包装的写操作，执行 CASL 守卫、操作人落库与 `toPlainData` 序列化。
- **Step 5: 租户前端界面与可视化 DAG 视图**
  - 接入 `@base/ui` 的 `DataTable.Workspace` 与 `FormModal`；
  - 实现 DAG 可视化工艺流程组件；
  - 租户路由与 `MaterialAbilityBoundary` 注入。
- **Step 6: 全栈门禁核验与会话收尾**
  - 运行 `./scripts/verify.sh` 确保类型检查、单元测试、实体基线、代码红线全部满分通过。
