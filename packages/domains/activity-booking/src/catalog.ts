import type { FeatureCatalog } from "@base/authorization";
import {
  VenueSubject,
  ActivitySubject,
  ActivitySessionSubject,
  AppointmentSubject,
  VolunteerSubject,
  CampusSyncSubject,
  NewsSubject,
  QrcodeManagementSubject,
} from "./contract";

export const activityBookingCatalog: FeatureCatalog = {
  id: "activity-booking",
  title: "活动预约中心",
  description: "宁卫场馆预约、活动发布、排班场次、预约审批、通行码核销、新闻发布与校园组织同步",
  subjects: [
    {
      name: VenueSubject,
      label: "场馆管理",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: ActivitySubject,
      label: "活动管理",
      actions: ["create", "read", "update", "delete", "publish"],
    },
    {
      name: ActivitySessionSubject,
      label: "场次排班",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: AppointmentSubject,
      label: "预约审批与内部预约",
      actions: ["create", "read", "update", "delete", "approve", "reject", "checkin"],
    },
    {
      name: VolunteerSubject,
      label: "志愿者管理",
      actions: ["create", "read", "update", "delete", "approve"],
    },
    {
      name: CampusSyncSubject,
      label: "校园组织同步",
      actions: ["create", "read", "update", "delete", "sync"],
    },
    {
      name: NewsSubject,
      label: "新闻资讯管理",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: QrcodeManagementSubject,
      label: "通行码与现场核销 (运维专属)",
      actions: ["read", "update", "checkin", "export"],
    },
  ],
};
