# 工程治理与自动化脚本避坑指南 (Engineering & Scripts Learnings)

本模块记录在跨平台环境抹平、Node.js 治理脚本、Git 质量门禁以及项目单一事实源 (SSoT) 维度的工程经验。

---

## 1. 跨平台脚本全量采用 Node.js (*.mjs)，严禁新增 Shell 脚本 (*.sh)

- **痛点**：团队成员跨 Windows、macOS 与 Linux 协同开发，历史上使用 Bash (`*.sh`) 编写的脚本在 Windows（PowerShell / CMD）下无法直接运行或路径解析错乱，导致流程中断，甚至因换行符差异引发门禁误报。
- **解法与铁律**：
  - **100% 纯 Node.js 实现**：全仓所有环境探测、质量门禁、清理与日常辅助工具全面使用 `*.mjs` 编写（如 `scripts/init.mjs`、`scripts/verify.mjs`、`scripts/clean.mjs`）；
  - **双重硬拦截机制**：
    1. **启动时拦截**：`pnpm init`（`scripts/init.mjs`）在启动自检专门扫描工作区，发现任何 `*.sh` / `*.bash` 立即硬退出；
    2. **提交时拦截**：`scripts/check/check-redlines.mjs` 作为提交红线，发现 Shell 脚本立即阻止 `git commit`；
  - **换行符防御**：通过根目录 `.gitattributes` 强制 `eol=lf`，彻底消除跨操作系统文本行尾符差异。

---

## 2. 消除状态双写与沙盒单源治理 (Single Source of Truth)

- **痛点**：在根目录下频繁更新全量 `progress.md` 和 `session-handoff.md`，同时又在 `.harness/features/<id>/` 下重复更新，导致两份记录经常出现内容冲突或维护冗余。
- **解法与铁律**：
  - **彻底移除根目录下冗余的 `progress.md` 和 `session-handoff.md`**；
  - **各特性的执行进度与换手交接单**严格且唯一收敛至其自身专属沙盒目录 `.harness/features/<id>/progress.md` 与 `handoff.md`；
  - **全局特性账本**统一以 `feature_list.json` 为唯一事实源 (SSoT)；
  - **跨特性的经验总结**统一沉淀至 `.harness/memory/learnings/`，**发现的历史遗留问题**统一登记至 `.harness/memory/technical-debt.md`。

---

## 3. 合理执行门禁验证，杜绝机械重复

- **痛点**：在准备执行 `git commit` 前，开发者或智能体已刚刚手动运行过验证并确认通过；由于 Git `pre-commit` 钩子本身已挂载该校验，若在无源码变更下连续手动重复执行，会导致 12 个 package 的全量类型与红线扫描被连续计算两次，造成严重的无效等待。
- **解法与行为准则**：
  - 核心节点只需保证通过一次有效门禁；
  - 刚刚验证通过且代码未再修改时，直接执行提交，由 `pre-commit` 自动兜底；
  - 日常开发优先执行同级改动文件的针对性单测（如 `pnpm --filter <pkg> test`）或类型检查，避免无节制全量扫盘。
