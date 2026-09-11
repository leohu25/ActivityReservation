import type { DataScopeType } from "../scopes/data-scope";

/** 单个动作维度的自描述元数据 */
export interface ActionMetadata {
  /** 动作中文显示标签 (如 '查看订单') */
  readonly label?: string;
  /** 该动作允许配置的数据范围类型集合 (如 ['SELF', 'DEPT', 'ALL']) */
  readonly scopes?: readonly DataScopeType[];
  /** 该动作生效或允许控制的字段白名单 */
  readonly fields?: readonly string[];
}

export interface PermissionDefinition<
  TResource extends string = string,
  TSubject extends string = string,
  TAction extends string = string,
> {
  resource: TResource;
  subject: TSubject;
  /** 资源中文显示标签 (如 '采购订单') */
  label?: string;
  actions: readonly [TAction, ...TAction[]];
  /** 动作级别的自描述元数据 (支持的 Scope 列表与敏感字段列表) */
  actionMetadata?: Partial<Record<TAction, ActionMetadata>>;
  /** 实体级支持的全部字段白名单 (供字段矩阵表格渲染使用) */
  fields?: readonly string[];
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

/** 运行时校验器、Resource 到 CASL Subject 映射以及自描述元数据引擎。 */
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

  /**
   * 按 CASL Subject 反查资源定义。
   * 页面契约以 subject 为业务主键，运行时权限探测应走此入口。
   */
  resolveBySubject(subject: string): TDefinitions[number] | undefined {
    return this.definitions.find((d) => d.subject === subject);
  }

  /**
   * 返回某 Subject 在页面契约中声明的全部 action（标准 + 自定义）。
   * 未注册的 Subject 返回空数组（Fail-Closed）。
   */
  getDeclaredActions(subject: string): readonly string[] {
    return this.resolveBySubject(subject)?.actions ?? [];
  }

  containsAction(
    definition: TDefinitions[number],
    action: string,
  ): action is CatalogAction<TDefinitions> {
    return definition.actions.includes(action);
  }

  /**
   * 获取指定资源与动作所支持的可配置数据范围列表。
   * 若未显式配置，则默认返回全局通用范围 ['SELF', 'DEPT', 'DEPT_TREE', 'ALL']。
   */
  getActionScopes(resource: string, action: string): readonly DataScopeType[] {
    const definition = this.resolve(resource);
    if (!definition) {
      return [];
    }
    const meta = definition.actionMetadata?.[action];
    if (meta?.scopes && meta.scopes.length > 0) {
      return meta.scopes;
    }
    return ["SELF", "DEPT", "DEPT_TREE", "ALL"];
  }

  /**
   * 获取指定资源在某动作下受控的字段白名单。
   */
  getActionFields(resource: string, action: string): readonly string[] {
    const definition = this.resolve(resource);
    if (!definition) {
      return [];
    }
    const meta = definition.actionMetadata?.[action];
    if (meta?.fields && meta.fields.length > 0) {
      return meta.fields;
    }
    return definition.fields ?? [];
  }

  /**
   * 自动转换为 Better Auth 所需的 Application Statement。
   * 实现业务模块一处声明，认证与授权两处自动复用。
   */
  toBetterAuthStatement(): Record<string, readonly string[]> {
    const statement: Record<string, readonly string[]> = {};
    for (const def of this.definitions) {
      statement[def.resource] = [...def.actions];
    }
    return statement;
  }
}

export function createPermissionCatalog<
  const TDefinitions extends readonly PermissionDefinition[],
>(definitions: TDefinitions): PermissionCatalog<TDefinitions> {
  return new PermissionCatalog(definitions);
}
