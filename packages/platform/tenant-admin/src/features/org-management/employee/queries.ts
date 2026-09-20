import { StandardAction } from "@base/authorization";
import "server-only";

import {
  pickReadableFields,
  getAccessibleWhere,
} from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { getControlDbClient } from "../../../shared/server/tenant-context";
import { getServerAuthRuntime } from "@base/auth";
import { EmployeeSubject } from "./contract";
import { EmployeeManagementService } from "./service";
import { DepartmentService } from "../department/public.server";
import { PositionService } from "../position/public.server";
import { TenantRoleService } from "../../role-management/public.server";
import type { DepartmentTreeNode } from "../department/types";
import type { PositionItem } from "../position/types";
import type {
  EmployeeItem,
  EmployeeListFilter,
  ListEmployeesFilter,
  ListEmployeesResult,
} from "./types";

const empService = new EmployeeManagementService();
const deptService = new DepartmentService();
const posService = new PositionService();

export async function listEmployeesPagedQuery(
  filter: ListEmployeesFilter = {},
): Promise<ListEmployeesResult> {
  const { client, organizationId, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, EmployeeSubject);

  const accessibleWhere = getAccessibleWhere(ability, EmployeeSubject, "read");
  const controlPrisma = await getControlDbClient();
  const result = await empService.listEmployeesPaged(
    client,
    controlPrisma,
    organizationId,
    filter,
    accessibleWhere,
  );

  const items: EmployeeItem[] = result.items.map((emp) => {
    const record: Record<string, unknown> = {
      name: emp.name,
      email: emp.email,
      employeeNo: emp.employeeNo,
      departmentId: emp.departmentId,
      positionId: emp.positionId,
      status: emp.status,
    };
    const readable = pickReadableFields(ability, EmployeeSubject, record);
    return {
      ...emp,
      name: typeof readable.name === "string" ? readable.name : emp.name,
      email: typeof readable.email === "string" ? readable.email : emp.email,
      employeeNo:
        typeof readable.employeeNo === "string"
          ? readable.employeeNo
          : emp.employeeNo,
      departmentId:
        typeof readable.departmentId === "string" || readable.departmentId === null
          ? readable.departmentId
          : emp.departmentId,
      positionId:
        typeof readable.positionId === "string" || readable.positionId === null
          ? readable.positionId
          : emp.positionId,
      status: typeof readable.status === "string" ? readable.status : emp.status,
    };
  });

  return toPlainData({ ...result, items });
}

export async function getEmployeePageOptionsQuery(): Promise<{
  departmentTree: readonly DepartmentTreeNode[];
  positions: readonly PositionItem[];
  availableRoles: readonly { role: string; name: string }[];
}> {
  const { client, organizationId, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, EmployeeSubject);

  const runtime = getServerAuthRuntime();
  const roleService = new TenantRoleService(runtime.tenantContextRepository);

  const [departmentTree, positions, tenantRoles] = await Promise.all([
    deptService.listDepartmentTree(client),
    posService.listPositions(client),
    roleService.listTenantRoles(organizationId),
  ]);

  return toPlainData({
    departmentTree,
    positions,
    availableRoles: tenantRoles.map((r) => ({
      role: r.role,
      name: r.name,
    })),
  });
}

export async function listEmployeesQuery(
  filter?: EmployeeListFilter,
): Promise<readonly EmployeeItem[]> {
  const paged = await listEmployeesPagedQuery({
    page: 1,
    pageSize: 100,
    ...filter,
  });
  return paged.items;
}
