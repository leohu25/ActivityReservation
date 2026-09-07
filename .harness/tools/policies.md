# 工具安全与受保护边界策略 (Tool Security & Protected Boundaries)

> 遵循 `harness-creator` 的 `tool-registry-pattern`：**默认失败关闭 (Default to Fail-Closed)、调用级并发控制、防绕过免疫保护**。

---

## 一、 受保护路径策略 (Protected Paths)

以下路径受到系统级保护，智能体**严禁自动修改或覆盖**：

1. **版本控制元数据**：`.git/**`（只能通过标准 git 命令操作，禁止文件级写操作）。
2. **依赖包与构建缓存**：`node_modules/**`, `.pnpm-store/**`, `.next/**`, `.turbo/**`。
3. **敏感环境变量与密钥**：`.env`, `.env*.local`, `*.pem`, `*.key`。
4. **受保护架构底座**：在非底座专属特性下，`packages/foundation/**`、`packages/db-control/**` 属于只读底座。

---

## 二、 危险命令拦截策略 (Protected Commands)

以下命令属于高危破坏性操作，智能体**绝对严禁直接执行**：

- `rm -rf /` 或针对非产物目录的大范围递归删除
- `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` 原生危险 SQL（数据库变更必须通过 Prisma Migration 机制执行）
- 强制覆盖 Git 历史（如 `git push --force`，`git reset --hard` 到远端未同步状态）

---

## 三、 角色工具权限沙箱矩阵

| 角色 (Role) | 允许工具 | 只读限制 | 写入范围 |
| :--- | :--- | :--- | :--- |
| `coordinator` | `read`, `grep`, `find`, `ls`, `todo`, `subagent`, `ask_user` | 是 | 仅限状态工件 (`progress.md`, `feature_list.json`) |
| `researcher` | `read`, `grep`, `find`, `ls`, `symbol_search` | 是 | 仅限 ADR 草案 (`.harness/memory/adr/`) |
| `implementer` | `read`, `edit`, `write`, `grep`, `find`, `ls`, `bash` | 否 | 严格限制在激活特性的 `scope.md` 白名单内 |
| `reviewer` | `read`, `grep`, `find`, `ls`, `bash` | 是 | 严禁修改任何代码；只允许执行门禁测试命令 |
