# 验证规范：物料与工艺BOM中心 (feature-material-center)

## 一、验证命令清单

```bash
# 1. 业务切片同级单元测试 (覆盖率要求 100% 通过)
pnpm --filter @base/feature-material-center test

# 2. 业务切片与租户应用类型检查
pnpm --filter @base/feature-material-center check
pnpm --filter tenant check

# 3. 数据迁移与模式一致性自检
pnpm db:migrate:check

# 4. 全栈门禁自动化硬校验 (含实体基线、代码红线、Pre-commit)
./scripts/verify.sh
```

---

## 二、判定准则与关键断言

1. **实体审计基线**：
   - `scripts/check-entity-baseline.mjs` 校验 `packages/features/material-center/prisma/schema.prisma` 中的所有独立业务实体（`ItemCategory`、`ItemVariety`、`ItemGrade`、`UnitOfMeasure`、`ItemMaster`、`ProductionLine`、`ProcessMaster`、`ProcessSpec`、`BomHeader`、`BomMrpOverride`）必须 100% 具备 8 大审计字段。
   - 严禁出现 `tenantId` 冗余列。
2. **多单位换算引擎准则**：
   - 重量/计件单位换算测试：输入不同单位自动求得标准基准数量，换算精度符合 `qtyPrecision` 截断。
   - 专属换算规则覆盖全局通用规则。
3. **BOM 领域与拓扑计算准则**：
   - 综合出成率计算测试：工序出成率连乘（如 90% *99%* 96% = 85.536%） vs 总出成率强覆盖。
   - 投入产出反推试算测试：输入成品量反推理论毛料投料量无误。
   - 循环引用检测测试：检测 A -> B -> A 循环依赖必须抛出受控 DomainError 阻断。
4. **生命周期发布流准则**：
   - 研发草稿状态可任意修改投入产出。
   - 发布生效后版本不可变，生成冻结快照。
5. **CASL 权限闭环准则**：
   - 4 个受控页面均有完整 PagePermissionContract，导出 `declaredActions` 与页面按钮完全一致。
   - Server Action 写操作强制校验对应的操作权限与操作人审计落库。
