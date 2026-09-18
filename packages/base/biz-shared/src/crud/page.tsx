import React from "react";
import type { ResourcePageConfig, ResourceListProps } from "./types";
import { createResourceList } from "./view";

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * 资源 RSC 页面工厂。
 * 业务自定义 List 时传 `List`；否则使用 createResourceList(config)。
 */
export function createResourcePage<TRow, TOptions = unknown>(
  config: ResourcePageConfig<TRow, TOptions>,
) {
  const FactoryList =
    config.List ??
    createResourceList<TRow, TOptions>({
      search: config.search,
      subject: config.subject,
      pageContract: config.pageContract,
      title: config.title,
      description: config.description,
      rowKey: config.rowKey,
      columns: config.columns,
      keywordPlaceholder: config.keywordPlaceholder,
      statusOptions: config.statusOptions,
      statusField: config.statusField,
      actions: config.actions ?? {},
      form: config.form,
      renderList: config.renderList,
      filterExtra: config.filterExtra,
      onExport: config.onExport,
      createText: config.createText,
    });

  return async function ResourcePage({
    searchParams,
  }: {
    searchParams: Promise<RawSearchParams>;
  }) {
    const parsed = await config.search.parse(searchParams);

    const [listResult, options] = await Promise.all([
      config.query.list(parsed),
      config.query.options
        ? config.query.options(parsed)
        : Promise.resolve(null),
    ]);

    const listProps: ResourceListProps<TRow, TOptions> = {
      data: listResult.items,
      total: listResult.total,
      options: options as TOptions | null,
    };

    return React.createElement(FactoryList as never, listProps);
  };
}

/** @deprecated 请使用 `createResourcePage` */
export const createCrudPage = createResourcePage;
