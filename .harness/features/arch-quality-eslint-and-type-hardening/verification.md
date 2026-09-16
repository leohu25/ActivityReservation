# 特性验收标准与证据 (Verification) — arch-quality-eslint-and-type-hardening

## 验收结果与证据 (Evidence)

1. **Turborepo 全仓 ESLint 覆盖与执行畅通**：
   - 为 packages/_、packages/features/_ 与 tooling/* 下全部 14 个子包补齐 `"lint": "eslint ."`；
   - 根级 `eslint.config.mjs` 配置 React 19 / Compiler 实验规则兼容与单元测试/UI底层泛型豁免；
   - 运行 `pnpm lint`（16 packages）100% 成功执行，0 error。

2. **消除 material-center 与全仓 (client as any) 恶性降解**：
   - 在 `packages/db-tenant/src/pool/manager.ts` 导出 `TenantPrismaNamespace`；
   - 彻底修复 `classification`, `unit-management`, `item-master`, `bom-management` 中的 60 余处 `(client as any)`；
   - 恢复 `TenantPrismaClient` 强类型 Prisma 查询与 mutation 校验。

3. **修正状态与字段联合类型 | string 宽化反模式**：
   - 修复 `customer-center`（store-management, quotation-management, customer-management, classification）中的 `status: "ACTIVE" | "DISABLED" | string` 反模式；
   - 严格收敛为强类型字面量联合或 `MasterDataStatus` 常量对象。

4. **压实动态菜单迁移历史 (Migration Squash)**：
   - 将原先 3 个产生外键死锁与快速撤销约束的修补迁移压缩为一个干净、确定性的迁移：`20260915124216_add_tenant_menu_item`；
   - 重新编译 runtime catalog 并通过 `pnpm --filter @base/db-migrate check` 校验。

5. **全栈门禁验证通过**：
   - `pnpm check` 16/16 成功；
   - `pnpm test` 16/16 成功（全仓数百用例通过）；
   - `pnpm lint` 16/16 成功；
   - `node scripts/verify.mjs` 9 项门禁全绿通过。
