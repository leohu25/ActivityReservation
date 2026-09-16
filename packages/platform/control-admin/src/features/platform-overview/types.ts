/**
 * 控制平面大盘核心统计概览契约
 */
export interface ControlStats {
 readonly totalTenants: number;
 readonly activeTenants: number;
 readonly suspendedTenants: number;
 readonly failedTenants: number;
 readonly provisioningTenants: number;
}
