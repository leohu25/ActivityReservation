import { revalidatePath } from "next/cache";
import { StandardAction, assertEditableFields } from "@base/authorization";
import type { AnyMongoAbility } from "@casl/ability";
import { defineServerAction } from "@base/shared";
import type { ResourceActionsConfig } from "./types";

function extractControlledPayload(
  input: Record<string, unknown>,
  controlledFields: readonly string[],
): Record<string, unknown> {
  const allowed = new Set(controlledFields);
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && allowed.has(k)) payload[k] = v;
  }
  return payload;
}

function revalidateAll(paths: readonly string[]) {
  for (const p of paths) revalidatePath(p);
}

/**
 * 资源 Server Action 工厂（`@base/biz-shared`，不单开 CRUD 包）。
 * 切片 `"use server"` 文件中调用后 **平铺 re-export** 各异步函数。
 *
 * @example
 * const actions = createResourceActions({...});
 * export const createCustomerAction = actions.create;
 */
export function createResourceActions<TCreate, TUpdate, TRow>(
  config: ResourceActionsConfig<TCreate, TUpdate, TRow>,
) {
  const {
    getContext,
    subject,
    controlledFields,
    assertAbility,
    revalidatePaths,
    schemas,
    service,
    toggleAction = "toggle_status",
    toggleExtraRevalidatePaths = [],
    errorMessages,
    onBeforeCreate,
    onBeforeUpdate,
  } = config;

  const assertFields = (ability: unknown, input: unknown) => {
    if (!input || typeof input !== "object") return;
    const payload = extractControlledPayload(
      input as Record<string, unknown>,
      controlledFields,
    );
    if (Object.keys(payload).length === 0) return;
    assertEditableFields(
      ability as unknown as AnyMongoAbility,
      subject,
      payload,
    );
  };

  const create = service.create
    ? defineServerAction(async (rawInput: unknown) => {
        const ctx = await getContext();
        assertAbility(ctx.ability, StandardAction.CREATE, subject);
        let input = schemas?.create ? schemas.create(rawInput) : rawInput;
        if (onBeforeCreate) input = await onBeforeCreate(input as TCreate, ctx);
        assertFields(ctx.ability, input);
        const created = await service.create!(ctx.client, input as TCreate, {
          userId: ctx.userId,
          deptId: ctx.deptId ?? null,
        });
        revalidateAll(revalidatePaths);
        return created;
      }, errorMessages?.create ?? "创建失败")
    : undefined;

  const update = service.update
    ? defineServerAction(async (id: string, rawInput: unknown) => {
        const ctx = await getContext();
        assertAbility(ctx.ability, StandardAction.UPDATE, subject);
        let input = schemas?.update ? schemas.update(rawInput) : rawInput;
        if (onBeforeUpdate) {
          input = await onBeforeUpdate(id, input as TUpdate, ctx);
        }
        assertFields(ctx.ability, input);
        const updated = await service.update!(
          ctx.client,
          id,
          input as TUpdate,
          { userId: ctx.userId },
        );
        revalidateAll(revalidatePaths);
        return updated;
      }, errorMessages?.update ?? "更新失败")
    : undefined;

  const remove = service.remove
    ? defineServerAction(async (id: string) => {
        const ctx = await getContext();
        assertAbility(ctx.ability, StandardAction.DELETE, subject);
        const deleted = await service.remove!(ctx.client, id, {
          userId: ctx.userId,
        });
        revalidateAll(revalidatePaths);
        return deleted;
      }, errorMessages?.delete ?? "删除失败")
    : undefined;

  const toggleStatus = service.toggleStatus
    ? defineServerAction(async (id: string, status: string) => {
        const ctx = await getContext();
        assertAbility(ctx.ability, toggleAction, subject);
        const updated = await service.toggleStatus!(ctx.client, id, status, {
          userId: ctx.userId,
        });
        revalidateAll([...revalidatePaths, ...toggleExtraRevalidatePaths]);
        return updated;
      }, errorMessages?.toggle ?? "状态更新失败")
    : undefined;

  return { create, update, remove, toggleStatus };
}

/** @deprecated 请使用 `createResourceActions` */
export const createCrudActions = createResourceActions;
