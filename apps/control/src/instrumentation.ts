/**
 * Next.js 官方应用生命周期钩子 (Instrumentation)
 * 在 Next.js Node 服务端实例启动时自动执行一次，实现平台总控库 Day 0 自愈
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensurePlatformDatabase } = await import("@base/db-migrate");
      const result = await ensurePlatformDatabase();
      if (result.status === "INITIALIZED") {
        process.stdout.write(
          `[Control DB] 成功初始化平台总控库基线版本: ${result.baselineVersion}\n`,
        );
      } else {
        process.stdout.write(
          `[Control DB] 平台总控库自愈就绪 (状态: ${result.status}, 当前版本: ${result.currentVersion})\n`,
        );
      }
    } catch (err: unknown) {
      console.error(
        "[Control DB] 平台总控库运行时自愈初始化失败:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
