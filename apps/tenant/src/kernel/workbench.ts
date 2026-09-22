import { headers } from "next/headers";
import {
	getCurrentTenantContext,
	getServerAuthRuntime,
	assertTenantAccessGate,
} from "@base/auth";
import {
	CaslAbilityFactory,
	getAccessibleWhere,
	getFieldMode,
	type AppPrismaAbility,
} from "@base/authorization";
import {
	getTenantDbManager,
	resolveEmployeeTopology,
	type ResolvedDepartmentTopology,
} from "@base/db-tenant";
import { toPlainData } from "@base/shared";
import { customerCatalog } from "@domain/customer-center/catalog";
import { CustomerSubject } from "@domain/customer-center/customer-management";
import type {
	EmployeeProfileDTO,
	WorkbenchDataDTO,
	WorkbenchPageData,
} from "@platform/tenant-admin/workbench";

export type { EmployeeProfileDTO, WorkbenchDataDTO, WorkbenchPageData };

/**
 * 获取租户工作台页面所需的完整纯数据 DTO (Server-Side Facade)
 * 装配在 apps/tenant/src/kernel，聚合业务能力与四层门禁
 */
export async function getTenantWorkbenchData(): Promise<WorkbenchPageData> {
	const reqHeaders = await headers();

	let tenantCtx;
	try {
		tenantCtx = await getCurrentTenantContext(reqHeaders);
	} catch (err: unknown) {
		const rawMsg = err instanceof Error ? err.message : "";
		const isNoOrg =
			rawMsg.includes("no active organization") ||
			rawMsg.includes("ACTIVE_ORGANIZATION_REQUIRED");
		return {
			kind: "unauthenticated",
			message: rawMsg,
			isNoOrg,
		};
	}

	const authRuntime = getServerAuthRuntime();
	const org = await authRuntime.prisma.organization.findUnique({
		where: { id: tenantCtx.organizationId },
		select: { id: true, name: true, slug: true, authorizationVersion: true },
	});

	const manager = getTenantDbManager({
		repository: authRuntime.tenantContextRepository,
	});
	const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

	const profile = (await tenantPrisma.employeeProfile.findUnique({
		where: { memberId: tenantCtx.member.id },
		include: {
			department: { select: { id: true, name: true, code: true } },
			position: { select: { id: true, name: true, code: true } },
		},
	})) as EmployeeProfileDTO | null;

	try {
		assertTenantAccessGate(profile);
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "员工档案状态异常，业务准入受限";
		return {
			kind: "blocked",
			message,
			status: profile?.status,
		};
	}

	const topology: ResolvedDepartmentTopology = await resolveEmployeeTopology(
		{
			findEmployeeProfile: async (memberId: string) =>
				tenantPrisma.employeeProfile.findUnique({
					where: { memberId },
					select: {
						id: true,
						memberId: true,
						departmentId: true,
						employeeNo: true,
						jobTitle: true,
						status: true,
					},
				}),
			findAllDepartments: async () =>
				tenantPrisma.department.findMany({
					select: { id: true, parentId: true },
				}),
		},
		{ userId: tenantCtx.user.id, memberId: tenantCtx.member.id },
	);

	const factory = new CaslAbilityFactory(
		authRuntime.tenantContextRepository,
		customerCatalog,
	);

	const prismaAbility = (await factory.createPrismaAbilityForTenant(
		tenantCtx,
		topology,
	)) as AppPrismaAbility<string, typeof CustomerSubject>;

	const sqlWhere = getAccessibleWhere(prismaAbility, CustomerSubject, "read");

	const data: WorkbenchDataDTO = {
		kind: "authenticated",
		org: {
			name: org?.name ?? "ERP 租户控制台",
			slug: org?.slug ?? tenantCtx.organizationId,
			authorizationVersion: org?.authorizationVersion ?? 1,
		},
		user: {
			name: tenantCtx.user.name || tenantCtx.user.email,
			role: tenantCtx.member.role,
		},
		profile,
		treeCount: topology.departmentTreeIds.length,
		sqlWhere,
		fieldModes: {
			customerName: getFieldMode(
				prismaAbility,
				CustomerSubject,
				"customerName",
			),
			settlementType: getFieldMode(prismaAbility, CustomerSubject, "settlementType"),
			contactPhone: getFieldMode(prismaAbility, CustomerSubject, "contactPhone"),
		},
		permissions: {
			canReadCustomer: prismaAbility.can("read", CustomerSubject),
			canCreateCustomer: prismaAbility.can("create", CustomerSubject),
			canUpdateCustomer: prismaAbility.can("update", CustomerSubject),
			canExportCustomer: prismaAbility.can("export", CustomerSubject),
		},
	};

	return toPlainData(data);
}
