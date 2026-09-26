import React from "react";
import {
  ActivitySubject,
  ActivitySessionSubject,
  AppointmentSubject,
  VenueSubject,
  VolunteerSubject,
  CampusSyncSubject,
  NewsSubject,
  QrcodeManagementSubject,
} from "@domain/activity-booking/shared";
import { ActivityBookingAbilityBoundary } from "@domain/activity-booking/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 活动预约业务切片的统一 CASL Provider 装配边界 (包含二维码管理独立授权)
 */
export default async function BookingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [activity, session, appointment, venue, volunteer, sync, news, qrcode] =
    await Promise.all([
      getTenantSubjectPermissions(ActivitySubject),
      getTenantSubjectPermissions(ActivitySessionSubject),
      getTenantSubjectPermissions(AppointmentSubject),
      getTenantSubjectPermissions(VenueSubject),
      getTenantSubjectPermissions(VolunteerSubject),
      getTenantSubjectPermissions(CampusSyncSubject),
      getTenantSubjectPermissions(NewsSubject),
      getTenantSubjectPermissions(QrcodeManagementSubject),
    ]);

  return (
    <ActivityBookingAbilityBoundary
      permissions={{
        subjects: {
          [ActivitySubject]: activity,
          [ActivitySessionSubject]: session,
          [AppointmentSubject]: appointment,
          [VenueSubject]: venue,
          [VolunteerSubject]: volunteer,
          [CampusSyncSubject]: sync,
          [NewsSubject]: news,
          [QrcodeManagementSubject]: qrcode,
        },
      }}
    >
      {children}
    </ActivityBookingAbilityBoundary>
  );
}
