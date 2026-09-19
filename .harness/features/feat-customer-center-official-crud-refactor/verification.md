# 验证方案与验收标准 — feat-customer-center-official-crud-refactor

## 验证项目与测试命令

1. **类型检查**：

   ```bash
   pnpm --filter @domain/customer-center check
   pnpm --filter tenant check
   pnpm -r --parallel check
   ```

   必须 0 错误、0 警告。

2. **单元测试与回归**：

   ```bash
   pnpm --filter @domain/customer-center test
   ```

   单测必须全部通过，覆盖：
   - 权限拦截与字段物理防篡改校验
   - P2002 唯一键并发自愈重试
   - 表单校验与提交
   - 视图受控渲染与 URL 联动

3. **用户体验与交互验收**：
   - 复制 URL 分享/前进/后退：页码、搜索词、筛选条件 100% 还原；
   - 搜索输入框：输入拼音/文字无断字与卡顿，敲击回车或点击查询才发起请求；
   - 切页过渡：点击翻页有局部骨架屏平滑过渡，无全屏白屏或整页闪烁；
   - 数据变更：新增/编辑/停启用/删除后，数据自动无感刷新，无需手动刷新页面。

4. **代码行数指标验收**：
   - 单切片 CRUD UI 综合代码量控制在 300~400 行内（相对重构前缩减 70%）。
