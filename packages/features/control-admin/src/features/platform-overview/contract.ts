export const PlatformOverviewSubject = "ControlOverview";
export const PlatformOverviewResource = "control.overview";

export const platformOverviewPageContract = {
  resource: PlatformOverviewResource,
  subject: PlatformOverviewSubject,
  label: "控制平面运营大盘",
  path: "/overview",
  actions: [{ action: "read", label: "查看控制平面大盘指标" }],
  configurableFields: [],
} as const;
