"use client";

import React, { type ReactNode } from "react";
import { AbilityProvider, Can as CaslCan, useAbility } from "@casl/react";
import type {
  CatalogAction,
  CatalogSubject,
  PermissionCatalog,
  PermissionDefinition,
} from "../core/catalog";

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

  /**
   * 强类型当前权限能力钩子
   */
  function usePermission() {
    const ability = useAbility();
    return {
      ability,
      can: (action: Action, subject: Subject, field?: string) =>
        ability.can(action as string, subject as string, field),
      cannot: (action: Action, subject: Subject, field?: string) =>
        ability.cannot(action as string, subject as string, field),
    };
  }

  return { Can, Permission, usePermission };
}
