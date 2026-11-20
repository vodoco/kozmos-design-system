import {
  defineComponent,
  inject,
  onBeforeUnmount,
  provide,
  type SlotsType,
  type VNode,
} from "vue";
import {
  AnalyticsKey,
  type KozmosAnalytics,
  type KozmosAnalyticsEvent,
} from "../../theme/injection";

/**
 * Vue's counterpart of React's AnalyticsProvider (GAP-230, decision 172):
 * the parts inside report their events to it, and it hands them on in
 * batches, as `dispatch`, `batchDelayMs` after the first event of each
 * (2000 by default), with every event reported meanwhile, in order; what is
 * left is handed on when it unmounts. A nested provider takes its own
 * subtree's events.
 *
 * The parts of the main entry report through it (`KozmosButton`'s
 * `button_clicked`), and so does every part `@kozmos-ds/vue/react-bridge`
 * draws inside it: the bridge gives each a React AnalyticsProvider that hands
 * its events here. It draws no element of its own.
 */
export const KozmosAnalyticsProvider = defineComponent({
  name: "KozmosAnalyticsProvider",
  inheritAttrs: false,
  props: {
    /** How long to wait before flushing the queue (defaults to 2000ms) */
    batchDelayMs: { type: Number, default: 2000 },
  },
  emits: {
    /** The queue's batch, as React's `onDispatch` is given it. */
    dispatch: (events: KozmosAnalyticsEvent[]) => !!events,
  },
  /** What reports to it, as React's required `children`. */
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const queue: KozmosAnalyticsEvent[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      clearTimeout(timer);
      timer = undefined;
      if (queue.length) emit("dispatch", queue.splice(0));
    };
    const push = (events: KozmosAnalyticsEvent[]) => {
      queue.push(...events);
      timer ??= setTimeout(flush, props.batchDelayMs);
    };
    provide(AnalyticsKey, {
      push,
      trackEvent: (component, eventName, properties) =>
        push([{ eventName, component, properties, timestamp: Date.now() }]),
    });
    onBeforeUnmount(flush);
    return () => slots.default?.();
  },
});

const none: KozmosAnalytics["trackEvent"] = () => {};

/**
 * The nearest KozmosAnalyticsProvider's `trackEvent`, as React's
 * `useKozmosAnalytics`, for a product's own events to join the parts'
 * batches. Outside every provider, an event goes nowhere.
 */
export function useKozmosAnalytics() {
  return { trackEvent: inject(AnalyticsKey, undefined)?.trackEvent ?? none };
}
