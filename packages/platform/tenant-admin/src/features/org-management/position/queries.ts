import { StandardAction } from "@base/authorization";
import "server-only";

import { pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { PositionSubject } from "./contract";
import { PositionService } from "./service";
import type {
  PositionItem,
  ListPositionsFilter,
  ListPositionsResult,
} from "./types";

const posService = new PositionService();

export async function listPositionsPagedQuery(
  filter: ListPositionsFilter = {},
): Promise<ListPositionsResult> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, PositionSubject);

  const result = await posService.listPositionsPaged(client, filter);
  const items: PositionItem[] = result.items.map((p) => {
    const record: Record<string, unknown> = {
      name: p.name,
      code: p.code,
      description: p.description,
      sort: p.sort,
      status: p.status,
      employeeCount: p.employeeCount,
      createdAt: p.createdAt,
    };
    const readable = pickReadableFields(ability, PositionSubject, record);
    return {
      id: p.id,
      name: typeof readable.name === "string" ? readable.name : p.name,
      code: typeof readable.code === "string" ? readable.code : p.code,
      description:
        typeof readable.description === "string" || readable.description === null
          ? readable.description
          : p.description,
      sort: typeof readable.sort === "number" ? readable.sort : p.sort,
      status: typeof readable.status === "string" ? readable.status : p.status,
      employeeCount:
        typeof readable.employeeCount === "number"
          ? readable.employeeCount
          : p.employeeCount,
      createdAt: readable.createdAt instanceof Date ? readable.createdAt : p.createdAt,
    };
  });

  return toPlainData({ ...result, items });
}

export async function listPositionsQuery(): Promise<readonly PositionItem[]> {
  const { client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, PositionSubject);

  const positions = await posService.listPositions(client);
  const items: PositionItem[] = positions.map((p) => {
    const record: Record<string, unknown> = {
      name: p.name,
      code: p.code,
      description: p.description,
      sort: p.sort,
      status: p.status,
      employeeCount: p.employeeCount,
      createdAt: p.createdAt,
    };
    const readable = pickReadableFields(ability, PositionSubject, record);
    return {
      id: p.id,
      name: typeof readable.name === "string" ? readable.name : p.name,
      code: typeof readable.code === "string" ? readable.code : p.code,
      description:
        typeof readable.description === "string" || readable.description === null
          ? readable.description
          : p.description,
      sort: typeof readable.sort === "number" ? readable.sort : p.sort,
      status: typeof readable.status === "string" ? readable.status : p.status,
      employeeCount:
        typeof readable.employeeCount === "number"
          ? readable.employeeCount
          : p.employeeCount,
      createdAt: readable.createdAt instanceof Date ? readable.createdAt : p.createdAt,
    };
  });

  return toPlainData(items);
}
