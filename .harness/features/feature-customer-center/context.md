# 特性上下文：客户中心 (Feature Customer Center)

## 一、特性定位

落实生鲜B2B ERP系统中的“客户中心”完整业务链路与基础设置，包含：

- 客户档案（PROC-CUS-001）
- 门店档案（PROC-CUS-001）
- 客户分类与客户标签（PROC-CUS-002）
- 门店报价单（PROC-CUS-003）

## 二、架构决策

1. **数据模型内聚在 Feature 内**：
   - 业务模型存放在 `packages/features/customer-center` 内部独立维护。
   - 所有数据库表与字段均包含清晰中文注释（包含表名描述与字段注释）。
   - 物理上连接当前租户数据库实例。
2. **左侧手风琴导航升级**：
   - 顶部第一级手风琴“客户中心”，展开 4 个子菜单项：
     - `/customer/customers` 客户档案
     - `/customer/stores` 门店档案
     - `/customer/categories-tags` 分类与标签
     - `/customer/quotes` 门店报价单
3. **页面与操作严格对齐权限控制**：
   - 增加对 `Customer`、`CustomerStore`、`CustomerCategory`、`CustomerTag`、`CustomerQuote` 的权限控制。
4. **核心业务红线**：
   - 客户停用联动下属门店停用；
   - 存在历史订单或门店的客户禁止物理删除；
   - 门店必须绑定区域编码 `region_code` 与所属客户；
   - 报价单三级匹配优先级：门店报价 > 客户报价 > 区域报价。
