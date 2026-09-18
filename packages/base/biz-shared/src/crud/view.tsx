"use client";

import React, { useState } from "react";
import {
  DataTable,
  FormModal,
  useListSearch,
  toast,
  type FormModalMode,
} from "@base/ui";
import type { ResourceListConfig, ResourceListProps } from "./types";

/**
 * 资源列表组件工厂（Element UI 式：默认 chrome + 配置驱动）。
 * 定制：`renderList` 完全接管，或业务自写 List 并只复用 actions。
 */
export function createResourceList<TRow, TOptions = unknown>(
  config: ResourceListConfig<TRow, TOptions>,
) {
  function ResourceList(props: ResourceListProps<TRow, TOptions>) {
    if (config.renderList) {
      return <>{config.renderList(props)}</>;
    }

    const { data, total } = props;
    const list = useListSearch(config.search);

    const [modal, setModal] = useState<{
      open: boolean;
      mode: FormModalMode;
      record?: TRow | null;
    }>({ open: false, mode: "create", record: null });

    const rowId = (row: TRow) => config.rowKey(row);

    const run = async (
      fn: () => Promise<{ success: boolean; error?: string }>,
      okText: string,
    ) => {
      const res = await fn();
      if (res.success) toast.success(okText);
      else toast.error(res.error || "操作失败");
    };

    return (
      <>
        <DataTable<TRow>
          data={data}
          columns={config.columns as never}
          rowKey={config.rowKey}
          subject={config.pageContract.subject}
          title={config.title}
          description={config.description}
          total={total}
          {...list.dataTableProps}
          keywordPlaceholder={config.keywordPlaceholder}
          onExport={
            config.onExport ? () => config.onExport?.(data) : undefined
          }
          onCreate={
            config.actions.create
              ? () => setModal({ open: true, mode: "create" })
              : undefined
          }
          createText={config.createText ?? "新增"}
          statusOptions={config.statusOptions}
          statusValue={String(list.params.status ?? "")}
          onStatusChange={
            config.statusOptions
              ? (v: string) => list.patch({ status: v || "" })
              : undefined
          }
          filterExtra={
            config.filterExtra?.(list.params, list.patch) as never
          }
          contentProps={{ selectable: true }}
        />

        {config.form ? (
          <FormModal<Record<string, unknown>>
            open={modal.open}
            mode={modal.mode}
            subject={config.subject}
            title={config.title}
            schema={config.form.schema as never}
            sections={config.form.sections as never}
            fields={config.form.fields as never}
            initialValues={
              (config.form.toInitialValues?.(
                modal.record ?? null,
                modal.mode,
              ) ?? {}) as Record<string, unknown>
            }
            onClose={() => setModal({ open: false, mode: "create" })}
            onSubmit={async (values) => {
              if (modal.mode === "create" && config.actions.create) {
                const payload =
                  config.form?.buildCreateInput?.(values) ?? values;
                await run(() => config.actions.create!(payload), "创建成功");
              } else if (modal.mode === "edit" && config.actions.update) {
                const payload =
                  config.form?.buildUpdateInput?.(values) ?? values;
                await run(
                  () =>
                    config.actions.update!(
                      rowId(modal.record as TRow),
                      payload,
                    ),
                  "保存成功",
                );
              }
              setModal({ open: false, mode: "create" });
            }}
          />
        ) : null}
      </>
    );
  }

  return ResourceList;
}

/** @deprecated 请使用 `createResourceList` */
export const createCrudView = createResourceList;
