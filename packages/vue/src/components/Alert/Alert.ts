import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  ALERT_DESCRIPTION_CLASS,
  ALERT_TITLE_CLASS,
  alertVariants,
  cn,
  impliedLive,
  LIVE_ROLES,
} from "#kozmos-recipes";
import type {
  KozmosAlertLiveness,
  KozmosAlertTitleLevel,
  KozmosAlertVariant,
} from "./types";

/** The default slot, as React's `children`. */
type Content = SlotsType<{ default?: () => VNode[] }>;

/**
 * Vue's counterpart of React's Alert: a bordered notice, drawn as the
 * `<div>` React's draws from the same recipe (`alertVariants`). An icon
 * first in the default slot sits at the inline start, the title and
 * description beside it. `live` is how hard a screen reader is interrupted:
 * `off` (the default) is no live region, a notice that is part of the page;
 * `polite` is `role="status"`; `assertive` is `role="alert"`, only for what
 * has just gone wrong. A live role says its `aria-live` as well (GAP-193),
 * and an app's own `role` or `aria-live` wins, as in React.
 */
export const KozmosAlert = defineComponent({
  name: "KozmosAlert",
  inheritAttrs: false,
  props: {
    live: { type: String as PropType<KozmosAlertLiveness>, default: "off" },
    variant: {
      type: String as PropType<KozmosAlertVariant>,
      default: undefined,
    },
  },
  slots: Object as Content,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, role, ...rest } = attrs;
      const resolved = (role as string | undefined) ?? LIVE_ROLES[props.live];
      return h(
        "div",
        {
          role: resolved,
          "aria-live": impliedLive(resolved),
          class: cn(
            alertVariants({ variant: props.variant }),
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's AlertTitle: the alert's title, 16 medium. A
 * `<p>` by default (`level="none"`), as on SwiftUI and Compose: a title
 * labels a notice, it does not open a section. Give `level` 2 to 6 when the
 * alert really is a region of the page, the level after the heading above.
 */
export const KozmosAlertTitle = defineComponent({
  name: "KozmosAlertTitle",
  inheritAttrs: false,
  props: {
    level: {
      type: [Number, String] as PropType<KozmosAlertTitleLevel>,
      default: "none",
    },
  },
  slots: Object as Content,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        props.level === "none" ? "p" : `h${props.level}`,
        { class: cn(ALERT_TITLE_CLASS, normalizeClass(className)), ...rest },
        slots.default?.(),
      );
    };
  },
});

/** Vue's counterpart of React's AlertDescription: the alert's words, 14. */
export const KozmosAlertDescription = defineComponent({
  name: "KozmosAlertDescription",
  inheritAttrs: false,
  slots: Object as Content,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          class: cn(ALERT_DESCRIPTION_CLASS, normalizeClass(className)),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});
