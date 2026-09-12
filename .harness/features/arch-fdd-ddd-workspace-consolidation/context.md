# arch-fdd-ddd-workspace-consolidation 上下文

## 历史目标与术语修正

该阶段完成采购工作台修复、biz-shared 骨架、CrudFormModal 增强，以及 Customer Center UI 文件的初步业务归类。历史上称为“宏观 FDD 垂直切片 + 微观 DDD 聚合根”，后续确认该表述不准确：FDD 是开发方法，UI 文件夹也不能直接等同于 DDD 聚合。

真正的代码架构收敛由后续 `arch-feature-vertical-slice-consolidation` 完成，采用 Modular Monorepo + Feature-based Vertical Slice + Horizontal Shared / Platform Modules，复杂 Feature 内按需使用 DDD。
