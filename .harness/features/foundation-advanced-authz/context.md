# 特性背景：数据与字段权限引擎 (foundation-advanced-authz)

## 一、 目标

基于 @casl/prisma 与 CASL Fields 实现五种数据范围 (SELF, DEPT, DEPT_TREE, CUSTOM, ALL) 查询下推过滤，与字段权限 (HIDDEN, READONLY, EDITABLE) 读写拦截。

## 二、 范围内能力

1. 数据权限范围定义与条件转换：整合租户当前用户的部门上下级拓扑与自定义部门列表，构建 CASL Prisma Query Conditions。
2. 字段权限定义：基于角色和字段配置，提供读/写双向字段过滤能力。
3. 专属自动化测试覆盖数据范围过滤与字段掩蔽。

## 三、 明确不做

- 具体业务订单表 CRUD（留待 procurement-center 等业务切片）。
- 多租户物理库迁移 CLI（属于 foundation-migration）。
