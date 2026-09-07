# 验证命令与判定标准：Harness 基础设施 (foundation-harness)

## 验证执行命令

```bash
./init.sh
./scripts/status.sh
./scripts/verify.sh
```

## 判定标准

1. `init.sh` 输出简洁，无任何报错，正确识别 Node 24 与 pnpm 11。
2. `scripts/status.sh` 能够清晰识别当前激活特性与 Git 状态。
3. `scripts/verify.sh` 顺利通过门禁检查并输出成功标识。
