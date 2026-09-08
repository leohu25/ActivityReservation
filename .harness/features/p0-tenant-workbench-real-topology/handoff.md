# 换手交接单：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 状态总览

- 当前状态: PENDING (待前置特性就绪)
- 负责人: @coordinator -> @implementer
- 前置依赖: `p0-tenant-org-management`

## 关键交接事项与注意事项

1. 必须彻底清除工作台中写死的任何静态 mock 数据。
2. 租户访问门禁必须为 Fail-Closed。
