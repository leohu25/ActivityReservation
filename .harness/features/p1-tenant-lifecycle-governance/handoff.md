# 换手交接单：【P1】租户全生命周期管控与排期安全清理 (p1-tenant-lifecycle-governance)

## 状态总览

- 当前状态: PENDING (第二梯队排期)
- 负责人: @coordinator -> @implementer
- 前置依赖: `p1-tenant-audit-logs`

## 关键交接事项与注意事项

1. 牢记 R-04 铁律，停用租户严禁 Ban 全局 User。
2. 物理库清理必须保证先销毁物理库后清理 Control 库映射。
