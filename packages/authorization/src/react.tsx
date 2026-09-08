"use client";

import React, { type ReactNode } from "react";
import { AbilityProvider, Can as CaslCan, useAbility } from "@casl/react";
import type {
  CatalogAction,
  CatalogSubject,
  PermissionCatalog,
  PermissionDefinition,
} from "./catalog";

export const AbilityContext = AbilityProvider;
export { useAbility };

/** Binds React permission props to one concrete permission catalog. */
export function createReactAbilityAdapter<
  const TDefinitions extends readonly PermissionDefinition[],
>(_catalog: PermissionCatalog<TDefinitions>) {
  type Action = CatalogAction<TDefinitions>;
  type Subject = CatalogSubject<TDefinitions>;

  interface BoundCanProps {
    I: NoInfer<Action>;
    a: NoInfer<Subject>;
    children: ReactNode;
  }

  function Can({ I, a, children }: BoundCanProps) {
    return (
      <CaslCan I={I} a={a}>
        {children}
      </CaslCan>
    );
  }

  interface PermissionProps {
    action: NoInfer<Action>;
    subject: NoInfer<Subject>;
    children: ReactNode;
  }

  function Permission({ action, subject, children }: PermissionProps) {
    return (
      <Can I={action} a={subject}>
        {children}
      </Can>
    );
  }

  return { Can, Permission };
}
