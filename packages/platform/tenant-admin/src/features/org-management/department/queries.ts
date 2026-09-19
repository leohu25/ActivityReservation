import { StandardAction } from "@base/authorization";
import "server-only";

import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { DepartmentSubject } from "./contract";
import { DepartmentService } from "./service";
import type { DepartmentTreeNode } from "./types";

const deptService = new DepartmentService();

export async function listDepartmentTreeQuery(): Promise<
  readonly DepartmentTreeNode[]
> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, DepartmentSubject);

  const tree = await deptService.listDepartmentTree(client);
  return toPlainData(tree);
}
