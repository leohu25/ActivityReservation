import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import {
  VenueSubject,
  ActivitySubject,
  AppointmentSubject,
  CampusSyncSubject,
} from "../contract";

export const venuePageContract: FeaturePagePermissionDescriptor = {
  resource: "booking.venue",
  subject: VenueSubject,
  label: "场馆管理",
  path: "/booking/venues",
  actions: [
    { action: StandardAction.READ, label: "查看场馆", supportedScopes: STANDARD_DATA_SCOPES },
    { action: StandardAction.CREATE, label: "新建场馆" },
    { action: StandardAction.UPDATE, label: "编辑场馆" },
    { action: StandardAction.DELETE, label: "删除场馆" },
  ],
  configurableFields: [],
};

export const activityPageContract: FeaturePagePermissionDescriptor = {
  resource: "booking.activity",
  subject: ActivitySubject,
  label: "活动管理",
  path: "/booking/activities",
  actions: [
    { action: StandardAction.READ, label: "查看活动", supportedScopes: STANDARD_DATA_SCOPES },
    { action: StandardAction.CREATE, label: "发布活动" },
    { action: StandardAction.UPDATE, label: "修改活动" },
    { action: StandardAction.DELETE, label: "取消活动" },
  ],
  configurableFields: [],
};

export const appointmentPageContract: FeaturePagePermissionDescriptor = {
  resource: "booking.appointment",
  subject: AppointmentSubject,
  label: "预约审核",
  path: "/booking/appointments",
  actions: [
    { action: StandardAction.READ, label: "查看预约", supportedScopes: STANDARD_DATA_SCOPES },
    { action: StandardAction.UPDATE, label: "审批/驳回" },
    { action: StandardAction.DELETE, label: "取消预约" },
  ],
  configurableFields: [],
};

export const syncPageContract: FeaturePagePermissionDescriptor = {
  resource: "booking.sync",
  subject: CampusSyncSubject,
  label: "校园组织同步",
  path: "/booking/sync",
  actions: [
    { action: StandardAction.READ, label: "查看同步记录", supportedScopes: STANDARD_DATA_SCOPES },
    { action: StandardAction.CREATE, label: "触发同步" },
  ],
  configurableFields: [],
};
