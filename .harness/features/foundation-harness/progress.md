# 特性任务进度：Harness 基础设施 (foundation-harness)

## 一、 任务清单

- [x] 生成全中文最高宪法 `AGENTS.md` 与 `CLAUDE.md`
- [x] 生成 `member.local.example.md` 与会话锚点
- [x] 建立全中文全局特性总账 `feature_list.json`
- [x] 建立环境探测脚本 `init.sh`（极简输出规范）
- [x] 建立极简门禁脚本 `scripts/verify.sh` 与 `scripts/status.sh`
- [x] 建立 `.harness/` 目录结构（含 memory、protocols、features）
- [x] **重构治理单源体系**：彻底删除根目录冗余的 `progress.md` 与 `session-handoff.md`
- [x] 将特性阶段进展、清单与换手交接单严格收敛至各沙盒 `.harness/features/<id>/progress.md` 与 `handoff.md`
- [x] 将跨特性公共踩坑经验与当前成熟框架沉淀至 `.harness/memory/learnings.md`
- [x] 将跨模块历史遗留问题统一登记至 `.harness/memory/technical-debt.md`
- [x] 适配 `session-end.mjs` 与 `check-boundary.mjs`，消除对根目录冗余文件的依赖与白名单检查
- [x] 通过全栈极速门禁与收尾验证

## 二、 阶段结论与验证

- Harness 基础设施全面优化完毕，工作区处于整洁、高内聚的健康可用状态。
- 单源治理落地，根目录冗余彻底清除，各特性沙盒与团队公共 memory 职责边界清晰。
