# 专属验证规范与证据：SaaS Web 门户与主面板框架 (foundation-web-shell)

## 验证目标与规范

| 检查项 | 验证内容 | 预期结果 |
| :--- | :--- | :--- |
| 前端类型检查 | `pnpm check` | PASS，8/8 模块 0 错误 |
| 前端组件与交互测试 | `pnpm test` | PASS，单测全部通过 |
| 生产环境构建 | `pnpm build` | PASS，Next.js App 路由构建成功 |
| 全栈门禁验证 | `./scripts/verify.sh` | PASS，白名单边界合规，0 红线违规 |
| 环境可重启性自检 | `./init.sh` | PASS，环境完好可重启 |
| Reviewer 独立审查 | Reviewer 审计 | PASS |

## 验证记录

- 待执行
