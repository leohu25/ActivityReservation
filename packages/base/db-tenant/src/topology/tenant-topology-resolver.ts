import type { TenantPrismaClient } from "../pool/manager";
import {
	resolveEmployeeTopology,
	type ResolvedDepartmentTopology,
} from "./department-topology";

export interface TenantEmployeeTopologyContext {
	readonly userId: string;
	readonly memberId: string;
}

/**
 * 依据当前租户的 Prisma 客户端与成员上下文，自动自驱解析部门拓扑与权限继承树。
 * 将各切片中重复手写的 findEmployeeProfile / findAllDepartments 样板代码收敛于底座。
 */
export async function resolveTenantEmployeeTopology(
	client: TenantPrismaClient,
	context: TenantEmployeeTopologyContext,
): Promise<ResolvedDepartmentTopology> {
	return resolveEmployeeTopology(
		{
			findEmployeeProfile: async (memberId: string) => {
				return client.employeeProfile.findUnique({
					where: { memberId },
					select: {
						id: true,
						memberId: true,
						departmentId: true,
						employeeNo: true,
						jobTitle: true,
						status: true,
					},
				});
			},
			findAllDepartments: async () => {
				return client.department.findMany({
					select: { id: true, parentId: true },
				});
			},
		},
		context,
	);
}
