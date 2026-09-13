import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** Non-entity capability: aggregated control-plane metrics. */
export const PlatformOverviewSubject = "ControlOverview";
export type PlatformOverviewSubject = typeof PlatformOverviewSubject;
export const PlatformOverviewResource = "control.overview";
export type PlatformOverviewResource = typeof PlatformOverviewResource;

export const platformOverviewPageContract: FeaturePagePermissionDescriptor = {
  resource: PlatformOverviewResource,
  subject: PlatformOverviewSubject,
  label: "控制平面运营大盘",
  path: "/overview",
  actions: [
    { action: StandardAction.READ, label: "查看控制平面大盘指标" },
  ],
  configurableFields: [],
} as const;
