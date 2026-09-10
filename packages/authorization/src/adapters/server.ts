import { ForbiddenError } from "@casl/ability";
import type { AppAbility } from "../ability/ability-factory";
import type {
  CatalogAction,
  CatalogSubject,
  PermissionCatalog,
  PermissionDefinition,
} from "../core/catalog";

type AnyAppAbility = AppAbility<string, string>;

export interface AuthorizedInvocation<TAbility extends AnyAppAbility> {
  ability: TAbility;
}

/** Binds all server guard inputs to one concrete permission catalog. */
export function createServerAbilityAdapter<
  const TDefinitions extends readonly PermissionDefinition[],
>(_catalog: PermissionCatalog<TDefinitions>) {
  type Action = CatalogAction<TDefinitions>;
  type Subject = CatalogSubject<TDefinitions>;
  type BoundAbility = AppAbility<Action, Subject>;
  type Invocation = AuthorizedInvocation<BoundAbility>;

  function assertAbility(
    ability: BoundAbility | null | undefined,
    action: NoInfer<Action>,
    subject: NoInfer<Subject>,
  ): void {
    if (!ability) {
      throw new Error("A trusted CASL ability is required");
    }
    ForbiddenError.from(ability as AnyAppAbility).throwUnlessCan(
      action,
      subject,
    );
  }

  function RequireAbility<TArguments extends readonly unknown[], TResult>(
    action: NoInfer<Action>,
    subject: NoInfer<Subject>,
    handler: (
      invocation: Invocation,
      ...args: TArguments
    ) => TResult | Promise<TResult>,
  ): (
    invocation: Invocation | null | undefined,
    ...args: TArguments
  ) => Promise<TResult> {
    return async (invocation, ...args) => {
      assertAbility(invocation?.ability, action, subject);
      return handler(invocation!, ...args);
    };
  }

  return { assertAbility, RequireAbility };
}
