import React from "react";
import type { AppAbility } from "./ability-factory";
import { createPermissionCatalog } from "./catalog";
import { createReactAbilityAdapter } from "./react";
import { createServerAbilityAdapter } from "./server";

const definition = {
  resource: "contract.order",
  subject: "ContractOrder",
  actions: ["read", "audit"],
} as const;
const catalog = createPermissionCatalog([definition] as const);
type ContractAbility = AppAbility<
  (typeof definition.actions)[number],
  typeof definition.subject
>;
declare const ability: ContractAbility;

const server = createServerAbilityAdapter(catalog);
server.assertAbility(ability, "read", "ContractOrder");
// @ts-expect-error unknown action is not part of the bound catalog
server.assertAbility(ability, "remove", "ContractOrder");
// @ts-expect-error unknown subject is not part of the bound catalog
server.assertAbility(ability, "read", "OtherOrder");

const { Permission } = createReactAbilityAdapter(catalog);
export const validPermission = (
  <Permission action="audit" subject="ContractOrder">
    allowed
  </Permission>
);
export const invalidAction = (
  <Permission
    // @ts-expect-error unknown action is not part of the bound catalog
    action="remove"
    subject="ContractOrder"
  >
    denied
  </Permission>
);
export const invalidSubject = (
  <Permission
    action="read"
    // @ts-expect-error unknown subject is not part of the bound catalog
    subject="OtherOrder"
  >
    denied
  </Permission>
);
