import { StandardAction } from "@base/authorization";
import type { TenantFeatureManifest } from "@base/authorization";
import {
  ActivitySubject,
  ActivitySessionSubject,
  AppointmentSubject,
  VenueSubject,
  CampusSyncSubject,
} from "./contract";
import {
  venuePageContract,
  activityPageContract,
  appointmentPageContract,
  syncPageContract,
} from "./shared/page-contracts";

export const activityBookingManifest: TenantFeatureManifest = {
  id: "activity-booking",
  name: "活动预约中心",
  order: 5,
  permissionModules: [
    {
      moduleKey: "booking-management",
      label: "活动与场次管理",
      iconName: "Calendar",
      order: 10,
      pages: [activityPageContract],
    },
    {
      moduleKey: "appointment-center",
      label: "预约审批中枢",
      iconName: "ClipboardCheck",
      order: 20,
      pages: [appointmentPageContract],
    },
    {
      moduleKey: "booking-basic-archives",
      label: "场馆与校园档案",
      iconName: "Building2",
      order: 30,
      pages: [venuePageContract, syncPageContract],
    },
  ],
  pages: [
    {
      pageKey: "booking-activities",
      defaultLabel: "活动管理",
      group: "活动与场次",
      href: "/booking/activities",
      defaultIcon: "Calendar",
      requiredAction: StandardAction.READ,
      requiredSubject: ActivitySubject,
      subjects: [ActivitySubject, ActivitySessionSubject],
    },
    {
      pageKey: "booking-appointments",
      defaultLabel: "预约审核",
      group: "预约审批",
      href: "/booking/appointments",
      defaultIcon: "ClipboardCheck",
      requiredAction: StandardAction.READ,
      requiredSubject: AppointmentSubject,
      subjects: [AppointmentSubject],
    },
    {
      pageKey: "booking-venues",
      defaultLabel: "场馆与空间",
      group: "基础档案",
      href: "/booking/venues",
      defaultIcon: "Building2",
      requiredAction: StandardAction.READ,
      requiredSubject: VenueSubject,
      subjects: [VenueSubject],
    },
    {
      pageKey: "booking-sync",
      defaultLabel: "校园组织同步",
      group: "基础档案",
      href: "/booking/sync",
      defaultIcon: "RefreshCw",
      requiredAction: StandardAction.READ,
      requiredSubject: CampusSyncSubject,
      subjects: [CampusSyncSubject],
    },
  ],
  navSections: [
    {
      id: "activity-booking",
      title: "活动预约中心",
      order: 5,
      items: [
        {
          id: "booking-activities-item",
          label: "活动管理",
          href: "/booking/activities",
          icon: "Calendar",
          requiredAction: StandardAction.READ,
          requiredSubject: ActivitySubject,
        },
        {
          id: "booking-appointments-item",
          label: "预约审核",
          href: "/booking/appointments",
          icon: "ClipboardCheck",
          requiredAction: StandardAction.READ,
          requiredSubject: AppointmentSubject,
        },
        {
          id: "booking-venues-item",
          label: "场馆与空间",
          href: "/booking/venues",
          icon: "Building2",
          requiredAction: StandardAction.READ,
          requiredSubject: VenueSubject,
        },
        {
          id: "booking-sync-item",
          label: "校园组织同步",
          href: "/booking/sync",
          icon: "RefreshCw",
          requiredAction: StandardAction.READ,
          requiredSubject: CampusSyncSubject,
        },
      ],
    },
  ],
};
