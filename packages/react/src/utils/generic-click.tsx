import React from "react";

/**
 * Whether a Core Button reports its generic `button_clicked`. A Product / SDK
 * component turns it off around a control whose press it already reports
 * with its own, more specific event, so one press is one event (Olcay,
 * 2026-10-04). Internal: not exported from the package.
 */
export const GenericClickTracking = React.createContext(true);

/** Around a control whose press the component reports with its own event. */
export function WithoutGenericClick({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GenericClickTracking.Provider value={false}>
      {children}
    </GenericClickTracking.Provider>
  );
}
