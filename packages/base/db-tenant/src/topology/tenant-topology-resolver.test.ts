import test from "node:test";
import assert from "node:assert/strict";
import { resolveTenantEmployeeTopology } from "./tenant-topology-resolver";
import type { TenantPrismaClient } from "../pool/manager";

test("resolveTenantEmployeeTopology 能够委托 TenantPrismaClient 解析成员部门拓扑", async () => {
	let findUniqueCalled = false;
	let findManyCalled = false;

	const mockPrisma = {
		employeeProfile: {
			async findUnique(args: { where: { memberId: string } }) {
				findUniqueCalled = true;
				assert.equal(args.where.memberId, "m_001");
				return {
					id: "emp_1",
					memberId: "m_001",
					departmentId: "dept_it",
					employeeNo: "IT-01",
					jobTitle: "工程师",
					status: "ACTIVE",
				};
			},
		},
		department: {
			async findMany() {
				findManyCalled = true;
				return [
					{ id: "dept_root", parentId: null },
					{ id: "dept_it", parentId: "dept_root" },
				];
			},
		},
	} as unknown as TenantPrismaClient;

	const topology = await resolveTenantEmployeeTopology(mockPrisma, {
		userId: "u_001",
		memberId: "m_001",
	});

	assert.equal(findUniqueCalled, true);
	assert.equal(findManyCalled, true);
	assert.equal(topology.userId, "u_001");
	assert.equal(topology.departmentId, "dept_it");
	assert.deepEqual(topology.departmentTreeIds, ["dept_it"]);
});
