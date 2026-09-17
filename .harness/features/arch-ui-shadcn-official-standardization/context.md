# 架构背景与决策上下文 — arch-ui-shadcn-official-standardization

## 1. 背景与痛点

历史实现中，为了保证所谓的“100% 官方原子纯净不可篡改”，引入了过度防御机制：

1. 建立了 SHA256 哈希清单（`.shadcn-manifest.json`）与门禁校验，将原子层锁死；
2. 导致为组件添加变体（如 `Badge` 的 `success/warning/process`）或修复上游 Base UI 缺陷（如 `Select` 中文 label 回显）时，只能在 `composite/` 层套一层同名 Wrapper；
3. 产生了“两个 Badge”、“两个 Select”、`baseToast` 等命名冲突和顶层同名覆盖导出，且组件存放在 `components/shadcn/` 违背了 Code Ownership 原则。

## 2. 演进目标与官方范式对齐

按照 `.agents/skills/shadcn/` 权威标准：

1. **代码所有权 (Code Ownership)**：原子 Primitives 存放在 `components/ui/`，由 Git 跟踪历史；
2. **CVA 变体扩展规范**：在原子源码的 `cva()` 中就地添加设计系统所需的 variants 和 sizes；
3. **缺陷就地修复**：将 Base UI Select 的中文 label 自动解析直接内嵌在 `components/ui/select.tsx`；
4. **单事实源 Feedback**：彻底清除无用 `toast.tsx`，统一使用 `sonner`；
5. **纯粹的公开导出**：净化 `packages/base/ui/src/index.ts`，彻底消除同名覆盖与重名污染。
