# 特性执行进度 — arch-ui-base-ui-full-migration

## 阶段任务

- [x] 建立 `feature_list.json` 特性记录与专属沙盒
- [x] 确认 shadcn 官方 Base UI 默认方向与 Radix 共存/迁移建议
- [x] 初步盘点现有 shadcn 原子组件、官方 Combobox 与本地定制冲突
- [x] 固化迁移前基线，记录环境既有阻塞与当前测试状态
- [x] 将 shadcn 配置切换为 Base UI 并生成官方原子组件
- [x] 迁移表单控件族：Combobox、Select、Checkbox、RadioGroup、Switch、Slider、Form
- [x] 迁移浮层族：Dialog、AlertDialog、Sheet、Popover、Tooltip、HoverCard
- [x] 迁移菜单导航族：DropdownMenu、ContextMenu、Menubar、NavigationMenu、Tabs、Accordion、Collapsible
- [x] 迁移展示与布局族：Button、Badge、Card、Table、Pagination、Empty、Alert 等
- [x] 适配 `@base/ui` Composite 与 Templates 全部调用点
- [x] 适配 apps、platform、domains 全仓调用点
- [x] 废弃历史自封装非标 Combobox，统一接入官方 Base UI Combobox 原子封装
- [x] 完成 `@base/ui` 类型检查与单测 (13/13 tests pass)
- [x] 完成全仓所有 16 个包类型检查与单测 (32/32 tasks pass via `pnpm turbo run check test`)
- [x] 修复客户表单模态框客户分类 Combobox 弹窗脱焦、白屏及位置漂移问题
- [ ] 向用户提交修改清单，获得明确审阅确认后再提交

## 已知基线问题

- `node scripts/init.mjs` 在 Control DB 基线检查阶段失败：`Command "db:platform:ensure" not found`。该问题发生于本特性代码实施之前，需作为环境/脚本基线阻塞单独记录，不得误算为 Base UI 迁移回归。
- shadcn CLI `add --all` 当前会因官方 registry 的 `questionnaire.json` 缺失而中止；迁移需使用明确组件清单或官方迁移技能逐组件推进。
