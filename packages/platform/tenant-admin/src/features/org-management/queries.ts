import { StandardAction } from "@base/authorization";
import "server-only";

import { pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { getControlDbClient } from "../../shared/server/tenant-context";
import { DepartmentSubject } from "./department.contract";
import { PositionSubject } from "./position.contract";
import { EmployeeSubject } from "./employee.contract";
import { DepartmentService } from "./department-service";
import { PositionService } from "./position-service";
import { EmployeeManagementService } from "./employee-management-service";
import type {
  DepartmentTreeNode,
  PositionItem,
  ListPositionsFilter,
  ListPositionsResult,
  EmployeeItem,
  EmployeeListFilter,
} from "./types";

const deptService = new DepartmentService();
const posService = new PositionService();
const empService = new EmployeeManagementService();

export async function listDepartmentTreeQuery(): Promise<
  readonly DepartmentTreeNode[]
> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, DepartmentSubject);

  const tree = await deptService.listDepartmentTree(client);
  return toPlainData(tree);
}

export async function listPositionsPagedQuery(
  filter: ListPositionsFilter = {},
): Promise<ListPositionsResult> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, PositionSubject);

  const result = await posService.listPositionsPaged(client, filter);
  const items: PositionItem[] = result.items.map((p) => {
    // SAFETY: PositionItem is plain data compatible with Record<string, unknown>
    const record = p as unknown as Record<string, unknown>;
    const readable = pickReadableFields(ability, PositionSubject, record);
    // SAFETY: readable 由 pickReadableFields 依据 CASL 过滤，附加唯一标识 id 保障组件展示完整性
    return {
      id: p.id,
      ...readable,
    } as unknown as PositionItem;
  });

  return toPlainData({ ...result, items });
}

export async function listPositionsQuery(): Promise<readonly PositionItem[]> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, PositionSubject);

  const positions = await posService.listPositions(client);
  const items: PositionItem[] = positions.map((p) => {
    // SAFETY: PositionItem is plain data compatible with Record<string, unknown>
    const record = p as unknown as Record<string, unknown>;
    const readable = pickReadableFields(ability, PositionSubject, record);
    // SAFETY: readable 由 pickReadableFields 依据 CASL 过滤，附加唯一标识 id 保障组件展示完整性
    return {
      id: p.id,
      ...readable,
    } as unknown as PositionItem;
  });

  return toPlainData(items);
}

export async function listEmployeesQuery(
  filter?: EmployeeListFilter,
): Promise<readonly EmployeeItem[]> {
  const { client, organizationId, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, EmployeeSubject);

  const controlPrisma = await getControlDbClient();
  const employees = await empService.listEmployees(
    client,
    controlPrisma,
    organizationId,
    filter,
  );

  const items: EmployeeItem[] = employees.map((emp) => {
    // SAFETY: EmployeeItem is plain data compatible with Record<string, unknown>
    const record = emp as unknown as Record<string, unknown>;
    const readable = pickReadableFields(ability, EmployeeSubject, record);
    // SAFETY: readable 由 pickReadableFields 依据 CASL 过滤，附加唯一标识 id 保障组件展示完整性
    return {
      id: emp.id,
      ...readable,
    } as unknown as EmployeeItem;
  });

  return toPlainData(items);
}
