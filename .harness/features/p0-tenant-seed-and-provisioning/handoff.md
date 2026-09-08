# 换手交接单：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 状态总览

- 当前状态: PENDING (待前置特性就绪)
- 负责人: @coordinator -> @implementer
- 前置依赖: `p0-org-schema-and-entities`

## 关键交接事项与注意事项

1. 建库并跑完迁移后立即执行 Seed，Seed 必须支持幂等执行。
2. 严格守卫 R-01 规则，超管绝不能进入租户 Member。
