# 特性开发进度 — feat-central-kitchen-production-bom

## 实施阶段进度记录

- [x] 特性初始化与沙盒创建
- [x] 深度研读观麦 8 张 BOM 原型截图与中央厨房第一版业务设计文档
- [x] 设计与落地 BOM 中心领域服务 (BomService)、查询 (Queries) 与 Server Actions (create/update/delete/setDefault)
- [x] 搭建 BOM 列表视图 (BomListView：单品/组合/包装切签、商品分类筛选、关键字搜索、默认标签、CSV导出)
- [x] 实现 BOM 新增/编辑 (BomFormPage / useBomFormState：高保真还原单品加工、组合配方、包装装配三大类型交互、配比清单与工序路线录入)
- [x] 实现 BOM 详情查看与版本图谱视图 (BomDetailDrawer：版本流程图谱与配方工艺全貌双核心 Tab、版本切换与下钻)
- [x] 【精细化落地】完成 BOM 9 项核心优化：
  1. 子 BOM 引用具体版本快照 (child_bom_version_id)，历史版本不可变；
  2. 实现“一键更新子BOM至最新版”批量刷新操作；
  3. 副产品升级为明细表结构，支持产出数量、单位与成本分摊比；
  4. 产出单位由商品默认生产单位带出，可更换且强约束在商品单位库内；
  5. 投入物料选择商品自动带出关联的默认 BOM 方案与快照版本；
  6. 落地 MRP 物料需求与采购折算算法引擎 (mrp-calculator.ts)，以 BOM 投入为实际准绳换算为采购单位并结合起订量向上取整；
  7. 工序工艺规格联动：1对多规格明细下拉，选择规格后自动将加工说明带入操作指引；
  8. 投入、产出、工艺路线一屏合屏展示，消除冗余碎片 Tab；
  9. 详情抽屉顶部优化为 Tab 与版本切换并排单行展示，释放最大垂直可视空间。
- [x] 补齐 MRP 换算引擎单测 (mrp-calculator.test.ts) 与 Schema 测试，类型检查 0 错误，单测全部绿灯通过。
