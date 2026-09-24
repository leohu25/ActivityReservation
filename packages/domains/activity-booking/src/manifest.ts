import type { FeatureManifest } from "@base/authorization";
import { activityBookingCatalog } from "./catalog";

export const activityBookingManifest: FeatureManifest = {
  id: "activity-booking",
  name: "活动预约中心",
  description: "提供活动发布、场次管理、移动预约、预约审核与校园组织数据同步",
  catalog: activityBookingCatalog,
  routes: [
    {
      path: "/booking/activities",
      title: "活动管理",
      subject: "Activity",
      action: "read",
    },
    {
      path: "/booking/appointments",
      title: "预约审核",
      subject: "Appointment",
      action: "read",
    },
    {
      path: "/booking/venues",
      title: "场馆管理",
      subject: "Venue",
      action: "read",
    },
    {
      path: "/booking/volunteers",
      title: "志愿者审核",
      subject: "VolunteerApplication",
      action: "read",
    },
    {
      path: "/booking/sync",
      title: "校园数据同步",
      subject: "CampusSyncRecord",
      action: "read",
    },
  ],
};
