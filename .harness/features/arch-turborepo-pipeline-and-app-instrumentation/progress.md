# 特性进度追踪：Turborepo 拓扑流水线与 Next.js instrumentation 运行时自愈 (arch-turborepo-pipeline-and-app-instrumentation)

## 状态：已完成 (COMPLETED)

### 阶段一：立项与沙盒初始化

- [x] 在 `feature_list.json` 中立项登记特性
- [x] 建立 `.harness/features/arch-turborepo-pipeline-and-app-instrumentation/` 沙盒文档

### 阶段二：平台总控端 instrumentation.ts 运行时自愈

- [x] 导出 `tooling/db-migrate` 供应用层调用的 `ensurePlatformDatabase()` 模块化 API
- [x] 在 `apps/control/src/instrumentation.ts` 中实现 Next.js 官方 `register()` 钩子
- [x] 验证 `apps/control` 启动时自动完成库自愈，脱离外部脚本依赖

### 阶段三：Turborepo codegen 原生拓扑任务化

- [x] 在 `turbo.json` 声明 `codegen` 任务，配置 `inputs` 与 `outputs` 增量缓存
- [x] 在应用与相关 package 接入 `dependsOn: ["//#codegen"]`
- [x] 验证无改动时 20ms 命中 Turbo 缓存，改动切片时自动精准刷新

### 阶段四：根命令纯化与 IDE 调试同源同轨

- [x] 重构根 `package.json` 的 `dev`, `dev:tenant`, `dev:control`, `build`, `check`，彻底消除 `&&`
- [x] 对齐 `.vscode/launch.json`，确保终端启动与 IDE 调试 100% 行为一致且零附加死锁

### 阶段五：全链路验证与交付收尾

- [x] 运行 `./scripts/verify.sh` 全栈物理门禁
- [x] 更新 `docs/collaboration/scripts-reference.md` 技术手册
- [x] 回填 `feature_list.json` 与 `progress.md` 真实证据
