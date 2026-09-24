"use client";

import React from "react";
import { AbilityBoundary, type AbilityBoundaryProps } from "@base/authorization";

export interface ActivityBookingAbilityBoundaryProps {
  readonly children: React.ReactNode;
  readonly permissions: AbilityBoundaryProps["permissions"];
}

export function ActivityBookingAbilityBoundary({
  children,
  permissions,
}: ActivityBookingAbilityBoundaryProps) {
  return (
    <AbilityBoundary permissions={permissions}>
      {children}
    </AbilityBoundary>
  );
}
