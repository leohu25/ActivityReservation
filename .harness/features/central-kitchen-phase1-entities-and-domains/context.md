# 特性背景：中央厨房第一版基础基建与业务实体建模 (central-kitchen-phase1-entities-and-domains)

## 一、 业务目标与需求背景

中央厨房 ERP 第一版旨在打通基础资料、商品、供应商、仓储设施、生产工艺到生产 BOM 的完整业务闭环。
本特性的核心任务是实施“第一阶段：基础工作（建表与实体）”，作为后续各团队并行开发业务切片的坚实基石。

核心目标：
1. **业务域物理切片**：
   按照 Modular Monorepo 与 Vertical Slice 架构，划分 5 个业务域 Package：
   - `@domain/base-archives`: 租户数据字典管理 (`tenant_dict_item`)
   - `@domain/product-center`: 商品主档、分类、单位计量、单位换算、等级与标签 (`unit_of_measure`, `product_category`, `product`, `product_unit_conversion`, `product_quality_grade`, `product_tag`)
   - `@domain/supplier-center`: 供应商主档与可供商品 (`supplier`, `supplier_product`)
   - `@domain/warehouse-center`: 仓库主档与库位管理 (`warehouse`, `warehouse_location`)
   - `@domain/production-center`: 生产资源（车间、产线、产线仓库）、工艺资料（工序、规格、产线能力）与 BOM 中心（BOM族、BOM版本、默认BOM、投入清单、产出清单、工艺清单）共 12 张表。

2. **实体与建表规范严格落地**：
   - 23 张租户业务表全部使用 PostgreSQL UUID (UUIDv7) 作为主键；
   - 严格遵循 ADR-009，强制包含 8 大审计与软删除字段；
   - 采用 `relationMode = "prisma"` 应用层逻辑关系，零物理外键约束与零死锁；
   - 数量、比例、精度统一遵循架构规范；
   - 数据字典项关联规范化（外键存储 UUIDv7，关联 `tenant_dict_item.id`）。

3. **数据库迁移与多租户引擎集成**：
   - 聚合至 `@runtime/db/prisma/schema.prisma` 并由 `tooling/db-migrate` 生成迁移与实库验证。
