import React from "react";
import {
  ActivitySubject,
  ActivitySessionSubject,
  AppointmentSubject,
  VenueSubject,
  VolunteerSubject,
  CampusSyncSubject,
} from "@domain/activity-booking/shared";
import { ActivityBookingAbilityBoundary } from "@domain/activity-booking/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 活动预约业务切片的统一 CASL Provider 装配边界
 */
export default async function BookingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [activity, session, appointment, venue, volunteer, sync] =
    await Promise.all([
      getTenantSubjectPermissions(ActivitySubject),
      getTenantSubjectPermissions(ActivitySessionSubject),
      getTenantSubjectPermissions(AppointmentSubject),
      getTenantSubjectPermissions(VenueSubject),
      getTenantSubjectPermissions(VolunteerSubject),
      getTenantSubjectPermissions(CampusSyncSubject),
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
        },
      }}
    >
      {children}
    </ActivityBookingAbilityBoundary>
  );
}
