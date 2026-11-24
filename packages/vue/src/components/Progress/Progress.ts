import {
  defineComponent,
  h,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import { Check } from "@kozmos-ds/icons/vue";
import {
  cn,
  PROGRESS_RING_ARC_CLASS,
  PROGRESS_RING_CLASS,
  PROGRESS_RING_DIAL_CLASS,
  PROGRESS_RING_DONE_CLASS,
  PROGRESS_RING_LABEL_CLASS,
  PROGRESS_RING_SVG_CLASS,
  PROGRESS_RING_TRACK_CLASS,
  PROGRESS_TRACK_ACTIVE_CLASS,
  PROGRESS_TRACK_CLASS,
  PROGRESS_TRACK_FLOW_CLASS,
  progressDrawnValue,
  progressRing,
  progressSpanStyle,
  progressTrackSpans,
} from "#kozmos-recipes";
import type { KozmosEmotion } from "../Tag/types";
import { KozmosProgressBar, progressbarAttributes } from "./ProgressBar";
import { styleAttribute } from "../style";
import { slotText } from "./slot-text";
import type {
  KozmosProgressLabelPlacement,
  KozmosProgressPlacement,
  KozmosProgressRange,
  KozmosProgressShape,
  KozmosProgressSize,
  KozmosProgressTrackAppearance,
  KozmosProgressTrackMotion,
  KozmosProgressTrackPositionMode,
} from "./types";

/**
 * Vue's counterpart of React's Progress, drawn as the progressbar React's
 * Radix Progress draws, from the same recipe (`recipes/progress.ts`).
 *
 * `shape="linear"`, the default, is the bar: with a `value` (0 to `max`,
 * 100 by default) it fills from the inline start; with none it waits
 * (GAP-159), sweeping, and says its `label` slot, its `aria-label` or the
 * text its `aria-labelledby` names, else "Loading", once as the wait starts.
 * `placement="top"` is the page's loading bar.
 *
 * `shape="circular"` is a ring (decision 131), `size` `sm`, `md` or `lg`,
 * filling from 12 o'clock clockwise in the `tone`'s colour, with the
 * `label` slot in its hole or, with `label-placement="end"`, beside it. The
 * label names the ring, or describes it when `aria-label` already names it,
 * and is heard once. A whole `sm` ring with no label draws a check and says
 * 100%.
 *
 * A value over the total is all of it. `get-value-label` says the value, as
 * Radix's `getValueLabel` does (`aria-valuetext`).
 */
export const KozmosProgress = defineComponent({
  name: "KozmosProgress",
  inheritAttrs: false,
  props: {
    shape: {
      type: String as PropType<KozmosProgressShape>,
      default: "linear",
    },
    size: {
      type: String as PropType<KozmosProgressSize>,
      default: "md",
    },
    labelPlacement: {
      type: String as PropType<KozmosProgressLabelPlacement>,
      default: "center",
    },
    tone: {
      type: String as PropType<KozmosEmotion>,
      default: "themed",
    },
    placement: {
      type: String as PropType<KozmosProgressPlacement>,
      default: "inline",
    },
    asChild: { type: Boolean, default: undefined },
    value: { type: Number as PropType<number | null>, default: undefined },
    max: { type: Number, default: 100 },
    getValueLabel: {
      type: Function as PropType<(value: number, max: number) => string>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{
    /** What a ring shows, or a waiting bar says: React's `label`. */
    label?: () => VNode[];
    /** React's `children`, which its Progress draws nowhere. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const labelId = useId();
    return () => {
      const [max, value, known, percentage] = progressDrawnValue(
        props.value,
        props.max,
      );
      if (props.shape !== "circular")
        // The bar, a part of its own as React's ProgressBar is, so it
        // starts and ends its wait as it mounts and unmounts.
        return h(
          KozmosProgressBar,
          {
            ...attrs,
            value,
            max: props.max,
            percentage,
            placement: props.placement,
            asChild: props.asChild,
            getValueLabel: props.getValueLabel,
          },
          slots.label ? { label: slots.label } : undefined,
        );
      const {
        class: className,
        style,
        "aria-labelledby": labelledBy,
        "aria-describedby": describedBy,
        ...rest
      } = attrs;
      const label = slots.label?.();
      const text = slotText(label);
      const labelled = !!label && text !== "";
      // Its drawing, its tone and whether it is done: a whole `sm` ring with
      // no label draws a check, and says 100%.
      const [
        diameter,
        stroke,
        centre,
        radius,
        viewBox,
        dasharray,
        transform,
        tone,
        toneVariables,
        done,
      ] = progressRing(
        props.size,
        percentage,
        props.tone,
        labelled,
        value,
        max,
      );
      // The label is the ring's name, or its description when the app has
      // named it already; either way it is said by reference, and the drawn
      // copy is hidden, so a screen reader hears it once.
      const named = attrs["aria-label"] != null || labelledBy != null;
      const beside = props.labelPlacement === "end";
      const drawn = labelled
        ? h(
            "div",
            {
              id: labelId,
              "aria-hidden": "true",
              class: PROGRESS_RING_LABEL_CLASS,
            },
            label,
          )
        : null;
      const { attributes } = progressbarAttributes(
        value,
        props.max,
        props.getValueLabel,
      );
      return h(
        Primitive,
        {
          as: "div",
          asChild: props.asChild,
          ...attributes,
          "data-shape": "circular",
          "data-size": props.size,
          "data-tone": tone,
          "data-label-placement": beside ? "end" : "center",
          class: cn(PROGRESS_RING_CLASS, normalizeClass(className)),
          // The arc's colour, as a property the stylesheet reads, so forced
          // colours can still replace it.
          ...styleAttribute(toneVariables, style),
          "aria-labelledby": labelled && !named ? labelId : labelledBy,
          "aria-describedby":
            labelled && named
              ? [describedBy, labelId].filter(Boolean).join(" ")
              : describedBy,
          ...rest,
          "aria-label": done && !named ? "100%" : attrs["aria-label"],
        },
        () => [
          // One drawing: the track and the arc are strokes of one circle,
          // from 12 o'clock clockwise, never mirrored. With no value the
          // track is drawn alone: a turning ring is Spinner.
          h("div", { class: PROGRESS_RING_DIAL_CLASS }, [
            h(
              "svg",
              {
                "aria-hidden": "true",
                focusable: "false",
                class: PROGRESS_RING_SVG_CLASS,
                width: diameter,
                height: diameter,
                viewBox,
                fill: "none",
                "stroke-width": stroke,
              },
              [
                h("circle", {
                  class: PROGRESS_RING_TRACK_CLASS,
                  cx: centre,
                  cy: centre,
                  r: radius,
                }),
                known
                  ? h("circle", {
                      class: PROGRESS_RING_ARC_CLASS,
                      cx: centre,
                      cy: centre,
                      r: radius,
                      "stroke-dasharray": dasharray,
                      transform,
                    })
                  : null,
              ],
            ),
            beside ? null : drawn,
            done
              ? h(Check, {
                  "aria-hidden": "true",
                  focusable: "false",
                  class: PROGRESS_RING_DONE_CLASS,
                })
              : null,
          ]),
          beside ? drawn : null,
        ],
      );
    };
  },
});

/**
 * Vue's counterpart of React's ProgressTrack: a decorative track, hidden
 * from assistive technology, that paints a selected interval (`static`) or
 * from zero to a live `value` (`live`, the default), each a normalized 0–1
 * position, in the theme or the gradient. `motion="directional"` adds a
 * flow toward the interval's end, which stops while the page is hidden; it
 * never changes the value. The control that owns it says what it means.
 */
export const KozmosProgressTrack = defineComponent({
  name: "KozmosProgressTrack",
  inheritAttrs: false,
  props: {
    activeRange: {
      type: Object as PropType<KozmosProgressRange>,
      default: undefined,
    },
    value: {
      type: [Number, null] as PropType<number | null>,
      required: true,
    },
    appearance: {
      type: String as PropType<KozmosProgressTrackAppearance>,
      default: "theme",
    },
    positionMode: {
      type: String as PropType<KozmosProgressTrackPositionMode>,
      default: "live",
    },
    motion: {
      type: String as PropType<KozmosProgressTrackMotion>,
      default: "none",
    },
  },
  slots: Object as SlotsType<{
    /** React's `children`, which its ProgressTrack draws nowhere. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs }) {
    const visible = ref(true);
    const update = () =>
      (visible.value = document.visibilityState !== "hidden");
    onMounted(() => {
      update();
      document.addEventListener("visibilitychange", update);
    });
    onBeforeUnmount(() =>
      document.removeEventListener("visibilitychange", update),
    );
    return () => {
      const { class: className, ...rest } = attrs;
      const [fill, flow] = progressTrackSpans(
        props.activeRange,
        props.value,
        props.positionMode,
        props.motion,
        visible.value,
      );
      return h(
        "div",
        {
          ...rest,
          "aria-hidden": "true",
          class: cn(PROGRESS_TRACK_CLASS, normalizeClass(className)),
        },
        [
          fill
            ? h("span", {
                "data-testid": "progress-active-range",
                "data-appearance": props.appearance,
                class: PROGRESS_TRACK_ACTIVE_CLASS,
                style: progressSpanStyle(fill),
              })
            : null,
          flow
            ? h("span", {
                "data-testid": "progress-directional-flow",
                "data-mode": props.positionMode,
                class: PROGRESS_TRACK_FLOW_CLASS,
                style: progressSpanStyle(flow),
              })
            : null,
        ],
      );
    };
  },
});
