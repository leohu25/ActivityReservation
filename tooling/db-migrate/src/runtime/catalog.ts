import { loadLatestBaseline, loadMigrationArtifacts } from "../core/artifacts";
import { findWorkspaceRoot } from "../core/paths";
import type { MigrationRuntimeCatalog, MigrationScope } from "../core/types";

/**
 * 动态从物理文件系统加载指定 scope 的真实 SQL 资产（baselines/*.sql 与 migrations/*.sql）
 * 彻底消除 TS 代码打包中的硬编码 SQL 字符串，保证开发态、编译态与运行态 100% 忠实执行真实 SQL 文件
 */
export function getMigrationCatalog(
  scope: MigrationScope,
  workspaceRoot?: string,
): MigrationRuntimeCatalog {
  const root = workspaceRoot ?? findWorkspaceRoot();
  const baseline = loadLatestBaseline(root, scope);
  const migrations = loadMigrationArtifacts(root, scope);
  return {
    scope,
    baseline,
    migrations,
  };
}

