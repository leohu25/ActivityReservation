# 特性背景：Turborepo 拓扑流水线与 Next.js instrumentation 运行时自愈 (arch-turborepo-pipeline-and-app-instrumentation)

## 一、架构背景与痛点

当前工程的启动与构建命令过度依赖根 `package.json` 中的 Shell `&&` 胶水串联（如 `sync:features && db:migrate:check && db:platform:ensure && turbo run dev`），引发以下工程痛点：

1. **认知负荷过载（黑盒感）**：开发者难以分辨启动时底层到底暗中执行了哪些操作，各命令之间前置逻辑不对称；
2. **IDE 调试器附加死锁**：Shell `&&` 派生的短命 Node CLI 进程触发调试器的 `autoAttachChildProcesses`，导致进程退出时挂起在 `Waiting for the debugger to disconnect...`，断点调试受阻；
3. **缺少增量缓存**：每次启动无差别执行扫描，未发挥 Turborepo 基于文件输入输出 Hash 的增量跳过能力。

## 二、架构目标与方案设计

1. **Next.js 官方生命周期自愈**：利用 `apps/control/src/instrumentation.ts` 的 `register()` 钩子，将平台总控库的 Day 0 检查与初始管理员 Seed 内聚至应用进程内，消除外部 `db:platform:ensure` 脚本；
2. **Turborepo 拓扑任务化**：将切片注册表与租户 Schema 聚合作为 Turbo 的 `codegen` Task，配置 `inputs` 与 `outputs` 增量缓存，并通过 `dependsOn: ["^codegen"]` 由 Turbo 自动拓扑调度；
3. **门禁职责归位**：将 `db:migrate:check` 从本地开发启动链路解耦，收敛到 `pre-commit`（`scripts/verify.sh`）与 CI；
4. **启动命令纯粹化**：根 `package.json` 彻底废除 `&&`，回归 `turbo run dev` 与裸 `--filter`，终端与 IDE 调试 100% 同源同轨。
