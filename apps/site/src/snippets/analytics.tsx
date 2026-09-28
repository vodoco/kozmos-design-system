import type { ReactNode } from "react";
import { AnalyticsProvider } from "@kozmos-ds/react";

declare function send(events: readonly unknown[]): void;

export function App({ children }: { children: ReactNode }) {
  // Interaction events arrive in batches, every 2000ms by default.
  return (
    <AnalyticsProvider onDispatch={(events) => send(events)}>
      {children}
    </AnalyticsProvider>
  );
}
