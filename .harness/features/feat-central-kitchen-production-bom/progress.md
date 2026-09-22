# 特性开发进度 — feat-central-kitchen-production-bom

## 实施阶段进度记录

- [x] 特性初始化与沙盒创建
- [x] 深度研读观麦 8 张 BOM 原型截图与中央厨房第一版业务设计文档
- [x] 设计与落地 BOM 中心领域服务 (BomService)、查询 (Queries) 与 Server Actions (create/update/delete/setDefault)
- [x] 搭建 BOM 列表视图 (BomListView：单品/组合/包装切签、商品分类筛选、关键字搜索、默认标签、CSV导出)
- [x] 实现 BOM 新增/编辑 (BomEditorModal：高保真还原单品加工、组合配方、包装装配三大类型交互、配比清单与工序路线录入)
- [x] 实现 BOM 详情查看与版本图谱视图 (BomDetailDrawer：高保真还原观麦版本流程图谱、投入产出与工艺路线抽屉)
- [x] 补齐单元测试（契约测试、Schema 校验测试）并通过全栈 24 包 check、21 套件 390+ 单测与 15 项架构门禁全绿
