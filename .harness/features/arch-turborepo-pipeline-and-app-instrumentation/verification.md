# 交付验证记录：Turborepo 拓扑流水线与 Next.js instrumentation 运行时自愈 (arch-turborepo-pipeline-and-app-instrumentation)

## 验证项与指标

1. **总控端运行时自愈**：
   - 清除外部前置命令后单独执行 `apps/control` dev，Next.js 服务启动并自动输出 `[Control DB] Platform database is ready at ...`。
2. **Turborepo 拓扑 codegen**：
   - 第一次执行 `pnpm dev` 触发 `codegen` 生成文件；
   - 第二次执行 `pnpm dev` 显示 `codegen: cache hit` 且耗时 ~0ms；
   - 修改切片 `manifest.ts` 后再次执行，精准失效缓存并刷新。
3. **IDE 断点调试**：
   - 在 Zed / VS Code 中使用 `Next.js: Debug Tenant` 和 `Debug Control` 启动，无僵尸进程，断点秒级挂起。
4. **全栈门禁**：
   - 运行 `./scripts/verify.sh` 8 项全绿通过。
