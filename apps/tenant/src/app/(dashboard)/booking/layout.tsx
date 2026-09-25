import React from "react";
import {
  ActivitySubject,
  ActivitySessionSubject,
  AppointmentSubject,
  VenueSubject,
  VolunteerSubject,
  CampusSyncSubject,
  NewsSubject,
} from "@domain/activity-booking/shared";
import { ActivityBookingAbilityBoundary } from "@domain/activity-booking/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 活动预约业务切片的统一 CASL Provider 装配边界 (包含志愿者与新闻)
 */
export default async function BookingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [activity, session, appointment, venue, volunteer, sync, news] =
    await Promise.all([
      getTenantSubjectPermissions(ActivitySubject),
      getTenantSubjectPermissions(ActivitySessionSubject),
      getTenantSubjectPermissions(AppointmentSubject),
      getTenantSubjectPermissions(VenueSubject),
      getTenantSubjectPermissions(VolunteerSubject),
      getTenantSubjectPermissions(CampusSyncSubject),
      getTenantSubjectPermissions(NewsSubject),
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
        },
      }}
    >
      {children}
    </ActivityBookingAbilityBoundary>
  );
}
