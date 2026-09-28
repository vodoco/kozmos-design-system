import { lazy, type ComponentType } from "react";

/**
 * The examples' components, loaded on demand: the home page's miniatures
 * must not pull every example into its chunk. Keyed by the manifest's slug;
 * the manifest itself stays free of React so the route table can read it in
 * Node.
 */
export const exampleComponents: Record<string, ComponentType> = {
  "account-settings": lazy(() => import("./account-settings/AccountSettings")),
  "venue-explorer": lazy(() => import("./venue-explorer/VenueExplorer")),
  wayfinding: lazy(() => import("./wayfinding/Wayfinding")),
  "phone-search": lazy(() => import("./phone-search/PhoneSearch")),
  "kiosk-directory": lazy(() => import("./kiosk-directory/KioskDirectory")),
  "sign-in": lazy(() => import("./sign-in/SignIn")),
  dashboard: lazy(() => import("./dashboard/Dashboard")),
  booking: lazy(() => import("./booking/Booking")),
  notifications: lazy(() => import("./notifications/Notifications")),
  onboarding: lazy(() => import("./onboarding/Onboarding")),
  states: lazy(() => import("./states/States")),
  "feedback-survey": lazy(() => import("./feedback-survey/FeedbackSurvey")),
  "saved-places": lazy(() => import("./saved-places/SavedPlaces")),
};
