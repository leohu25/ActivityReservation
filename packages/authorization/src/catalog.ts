export interface PermissionDefinition<
  TResource extends string = string,
  TSubject extends string = string,
  TAction extends string = string,
> {
  resource: TResource;
  subject: TSubject;
  actions: readonly [TAction, ...TAction[]];
}

export type CatalogAction<
  TDefinitions extends readonly PermissionDefinition[],
> = TDefinitions[number]["actions"][number];

export type CatalogSubject<
  TDefinitions extends readonly PermissionDefinition[],
> = TDefinitions[number]["subject"];

export class PermissionCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionCatalogError";
  }
}

/** Runtime validator and Resource -> CASL Subject mapping. */
export class PermissionCatalog<
  const TDefinitions extends readonly PermissionDefinition[],
> {
  private readonly byResource = new Map<string, PermissionDefinition>();

  constructor(readonly definitions: TDefinitions) {
    for (const definition of definitions) {
      if (
        !definition.resource.trim() ||
        !definition.subject.trim() ||
        definition.actions.length === 0
      ) {
        throw new PermissionCatalogError(
          "Permission definitions require resource, subject and actions",
        );
      }
      if (this.byResource.has(definition.resource)) {
        throw new PermissionCatalogError(
          `Duplicate permission resource: ${definition.resource}`,
        );
      }
      if (new Set(definition.actions).size !== definition.actions.length) {
        throw new PermissionCatalogError(
          `Duplicate action in resource: ${definition.resource}`,
        );
      }
      this.byResource.set(definition.resource, definition);
    }
  }

  resolve(resource: string): TDefinitions[number] | undefined {
    return this.byResource.get(resource) as TDefinitions[number] | undefined;
  }

  containsAction(
    definition: TDefinitions[number],
    action: string,
  ): action is CatalogAction<TDefinitions> {
    return definition.actions.includes(action);
  }
}

export function createPermissionCatalog<
  const TDefinitions extends readonly PermissionDefinition[],
>(definitions: TDefinitions): PermissionCatalog<TDefinitions> {
  return new PermissionCatalog(definitions);
}
