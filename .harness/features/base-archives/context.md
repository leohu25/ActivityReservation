# 特性背景：基础档案与租户业务数据字典切片 (base-archives)

## 一、 业务目标与需求背景

- 当前系统内各模块的下拉选项（如客户等级、结算方式等枚举数据）在各自业务模块前端硬编码，租户无法根据自身实际业务进行增删改或启停用；
- 建立统一的基础档案/数据字典中心（@domain/base-archives），使用一张字典项表（TenantDictItem）按 `type` 统一归集和隔离存储；
- 在契约层定义 `DictType` 常量（`as const`），页面和业务模块引用常量进行强类型按 `type` 过滤获取下拉选项列表；
- 后续可平滑扩展更多租户业务基础设置。

## 二、 核心实体与模型设计

- **模型**：`TenantDictItem`
- **字段规范**：
  - `id`: String @id (CUID)
  - `type`: String @db.VarChar(50) (必填，字典类型，如 CUSTOMER_LEVEL)
  - `code`: String @db.VarChar(50) (必填，字典项编码，如 HIGH)
  - `name`: String @db.VarChar(100) (必填，字典项显示名称，如 高价值客户)
  - `status`: String @db.VarChar(10) (必填，状态 ACTIVE/DISABLED)
  - `sort`: Int @default(0) (必填，排序权重)
  - `isDefault`: Boolean @default(false) (选填，是否默认选项)
  - `remark`: String? @db.VarChar(255) (选填，备注)
  - `createdAt`: DateTime @default(now())
  - `updatedAt`: DateTime @updatedAt
- **索引**：
  - `@@unique([type, code])` 同类型下编码唯一
  - `@@index([type, status])` 加速按类型与启用状态查询
  - `@@index([status])`

## 三、 权限规划

- **Subject**: `TenantDictItem`
- **Actions**: `READ`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT`
- **Data Scope**: 全租户共享配置（EXEMPT_MODELS 豁免，无部门数据范围限制）
