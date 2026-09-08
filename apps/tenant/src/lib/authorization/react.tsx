"use client";

import { createReactAbilityAdapter } from "@chenrun/authorization/react";
import { applicationPermissionCatalog } from "./catalog";

export const { Can, Permission } = createReactAbilityAdapter(
  applicationPermissionCatalog,
);
export { AbilityContext, useAbility } from "@chenrun/authorization/react";
