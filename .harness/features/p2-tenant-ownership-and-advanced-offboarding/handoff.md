# 换手交接单：【P2】租户所有权移交与复杂离职批量单据交接 (p2-tenant-ownership-and-advanced-offboarding)

## 状态总览

- 当前状态: PENDING (第三梯队排期)
- 负责人: @coordinator -> @implementer
- 前置依赖: `p2-tenant-member-invitation-flow`

## 关键交接事项与注意事项

1. 始终确保系统处于至少有一个有效 Owner 的状态。
2. 批量单据交接必须保留原单据创建人快照。
