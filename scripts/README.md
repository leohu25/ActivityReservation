# Scripts 目录职责与组织规范 (Single Responsibility Principle)

本项目 `scripts/` 目录遵循单一职责原则（SRP）进行模块化分类与组织，杜绝所有脚本无序平铺在根目录下，彻底移除空壳与胶水转发文件，全仓调用直接对齐物理路径。

## 目录拓扑

```text
scripts/
├── check/                          # 质量门禁与架构红线静态自检脚本
│   ├── check-boundary.mjs          # 沙盒白名单与跨特性越权修改拦截
│   ├── check-redlines.mjs          # 数据库直连/幽灵依赖/穿透引用等红线扫描
│   ├── check-redlines.test.mjs     # 红线扫描器专属单元测试
│   ├── check-vertical-slices.mjs   # 业务垂直切片 (Vertical Slice) 架构完整性门禁
│   └── check-vertical-slices.test.mjs # 垂直切片门禁专属单元测试
│
├── sync/                           # 静态元数据与 Schema 构建期自发现/聚合生成器
│   ├── sync-features.mjs           # 自动发现租户切片 manifest 并生成静态注册表 (ADR-005/006)
│   └── sync-tenant-schema.mjs      # 自动聚合 Canonical Tenant Prisma Schema (物理库隔离)
│
├── reporter/                       # 测试与控制台输出报告器
│   └── fail-only-reporter.mjs      # 仅报告失败异常与简洁 ok N/N 的 Node Test Reporter
│
├── tools/                          # 日常开发与协同辅助工具
│   ├── status.sh                   # 协同会话上下文与 Git 状态查看
│   └── save-patch.sh               # 越界改动提取为补丁并归档至 .harness/patches/
│
├── verify.sh                       # 全栈门禁总装入口 (由 .git/hooks/pre-commit 驱动)
└── README.md                       # 目录规范与职责说明说明文档
```

## 模块职责分工

| 目录/文件 | 核心职责 | 调用方式 / 场景 |
| --- | --- | --- |
| `scripts/check/` | 质量与架构安全静态门禁 | `./scripts/verify.sh` 或 CI/Commit 阶段执行 |
| `scripts/sync/` | 编译期静态代码与 Schema 自动生成 | `pnpm sync:features` / `pnpm build` 前置执行 |
| `scripts/reporter/` | 精简测试日志输出，抑制无关噪音 | 各 package `package.json` 中的 `test` 脚本挂载 |
| `scripts/tools/` | 开发者与智能体日常辅助运维 | `./scripts/tools/status.sh` 等手动按需调用 |
| `scripts/verify.sh` | 集中汇聚所有门禁自检的统一入口 | `git commit` 时由 `.git/hooks/pre-commit` 自动触发 |

## 垂直切片架构门禁检查规则 (check-vertical-slices)

门禁针对 `packages/features/*` 下的租户业务特性包执行严格自动化检查：

1. **基础契约完备性**：
   - 必须在 `src/manifest.ts` 导出自描述特性清单 `TenantFeatureManifest`；
   - 必须在 `src/catalog.ts` 导出 CASL 权限目录 `PermissionCatalog`；
   - 必须在 `src/shared/server/context.ts` 或 `tenant-context.ts` 封装租户物理隔离与准入门禁上下文；
   - 必须在 `src/shared/public.ts` 导出 Client-Safe 的 Ability Boundary 与跨切片共享组件。
2. **Package Subpath Exports 规范**：
   - 严禁在 `package.json#exports` 中导出 `"."` 根平铺大杂烩桶；
   - 必须为每个 Feature / Sub-Feature 暴露语义子路径（区分前端出口与 `/server` 纯服务端出口）；
   - 必须显式暴露 `"./manifest"` 与 `"./shared"`。
3. **彻底清理历史平铺残留**：
   - 严禁在 `src` 根目录残留 `index.ts`, `actions.ts`, `types.ts`, `components/`, `services/`, `contracts/`, `server/` 等旧平铺技术层。
4. **切片内聚与运行时物理边界**：
   - 每个业务切片必须包含 `contract.ts`, `types.ts`, `public.ts` 以及对应的 `public.server.ts`；
   - 纯服务端出口（`public.server.ts`、`queries.ts`）必须在头部显式声明 `import "server-only";`；
   - mutation 操作（`actions.ts`）必须在头部声明 `"use server";`；
   - 客户端出口（`public.ts`）及 `ui/` 严禁直接导入数据库客户端或 Node 服务端私有能力；
   - 切片之间严禁通过相对路径穿透调用兄弟切片的私有实现文件（如 `../other/service`），跨切片集成必须在应用装配层完成。

## 执行命令

```bash
# 执行全量质量与架构门禁
./scripts/verify.sh

# 查看当前开发者协同状态与激活特性
./scripts/tools/status.sh

# 手动触发特性注册表与 Schema 自动同步
pnpm sync:features

# 单独执行垂直切片架构自检
node scripts/check/check-vertical-slices.mjs

# 运行垂直切片门禁自身单测
node --test scripts/check/check-vertical-slices.test.mjs
```
