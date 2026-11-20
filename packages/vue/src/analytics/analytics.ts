import { inject, type InjectionKey } from "vue";

/**
 * What a native Vue part reports an event through, as React's
 * `useKozmosAnalytics().trackEvent`: the part's name, the event's name from
 * `docs/analytics-events.json`, and its properties, as React's sends them.
 */
export interface KozmosAnalytics {
  trackEvent: (
    component: string,
    eventName: string,
    properties?: Record<string, unknown>,
  ) => void;
}

/**
 * The key a Vue analytics provider provides under. It is `Symbol.for`, so
 * the provider can live anywhere — the bridge's (GAP-230) or a native port
 * of React's AnalyticsProvider — and need only this name, not this module:
 * `provide(Symbol.for("@kozmos-ds/vue:analytics"), { trackEvent })`.
 */
export const KozmosAnalyticsKey = Symbol.for(
  "@kozmos-ds/vue:analytics",
) as InjectionKey<KozmosAnalytics>;

/** Outside a provider, events are dropped, as React's are. */
const DROPPED: KozmosAnalytics = { trackEvent: () => {} };

/**
 * The one function a native port calls to report an event (PORTING.md,
 * step 5). Call it in `setup`, and `trackEvent` where React's part does.
 * Internal: the main entry exports no analytics API until a provider for
 * Vue lands, so nothing reports yet unless one is provided.
 */
export function useKozmosAnalytics(): KozmosAnalytics {
  return inject(KozmosAnalyticsKey, DROPPED);
}
