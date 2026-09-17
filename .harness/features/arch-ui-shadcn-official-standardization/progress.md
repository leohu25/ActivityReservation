# 特性进展追踪 — arch-ui-shadcn-official-standardization

## 里程碑规划与当前进度

- [x] **M0: 破除过度防御**
  - [x] 锁死 `@base-ui/react` (1.8.0) 等关键 UI 依赖版本；
  - [x] 删除 `check-shadcn-immutability.mjs`、`.shadcn-manifest.json` 与 `sync-shadcn.mjs`；
  - [x] 从 `scripts/verify.mjs` 门禁中解绑该校验。
- [x] **M1: 目录正名与配置对齐**
  - [x] `packages/base/ui/src/components/shadcn/` 正名为 `src/components/ui/`；
  - [x] `packages/base/ui/components.json` 别名更新为 `"ui": "@/components/ui"`。
- [x] **M2: 原子能力就地合流与消灭多余 Wrapper**
  - [x] `badge.tsx` 合流 `success/warning/process` 变体与 `sm/lg` 尺寸，物理删除 `composite/badge/`；
  - [x] `select.tsx` 就地内嵌中文 label 回显修复，物理删除 `composite/form/Select.tsx`，对应测试迁移为 `select.test.tsx`；
  - [x] 彻底物理删除废弃的 `components/ui/toast.tsx`，统一使用 `sonner`。
- [x] **M3: 目录重构为教科书级扁平语义形态**
  - [x] 解构 `composite/` 与 `templates/`，收敛为 `ui/` (Primitives), `data-table/`, `auth/`, `form/`, `tree/`, `layout/`, `feedback/`, `icon/`；
  - [x] 净化 `packages/base/ui/src/index.ts`，导出干净透明，彻底消除同名覆盖；
  - [x] 全仓 16 个包与双端应用类型检查 100% PASS，`@base/ui` 13 项单元测试 100% PASS；
  - [x] 全套架构门禁 `node scripts/verify.mjs` 100% 绿灯。
