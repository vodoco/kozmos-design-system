import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, TIMELINE_CLASSES } from "#kozmos-recipes";
import type { KozmosTimelineDensity } from "./types";

/** The default slot, as React's `children`. */
type Content = SlotsType<{ default?: () => VNode[] }>;

/** A text part's element: React's tag, anatomy attribute and recipe class. */
function drawText(
  tag: string,
  anatomy: string,
  recipe: string,
  attrs: Record<string, unknown>,
  content: VNode[] | undefined,
) {
  const { class: className, ...rest } = attrs;
  return h(
    tag,
    {
      [anatomy]: "true",
      class: cn(recipe, normalizeClass(className)),
      ...rest,
    },
    content,
  );
}

/**
 * Vue's counterpart of React's Timeline: an `<ol>` of events, each a
 * `KozmosTimelineItem` with its marker on a rail that ends at the last one
 * (GAP-247), drawn from the same recipe (`TIMELINE_CLASSES`). `density`
 * `compact` tightens every part inside it. The `data-timeline-*` attributes
 * are its anatomy, written `"true"` as React writes a bare JSX attribute.
 */
export const KozmosTimeline = defineComponent({
  name: "KozmosTimeline",
  inheritAttrs: false,
  props: {
    density: {
      type: String as PropType<KozmosTimelineDensity>,
      default: "default",
    },
  },
  slots: Object as Content,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "ol",
        {
          "data-density": props.density,
          "data-timeline": "true",
          class: cn(
            TIMELINE_CLASSES.root,
            props.density === "compact" && TIMELINE_CLASSES.compact,
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
 * Vue's counterpart of React's TimelineItem: one event, an `<li>` with its
 * marker (hidden from assistive technology) before its content.
 */
export const KozmosTimelineItem = defineComponent({
  name: "KozmosTimelineItem",
  inheritAttrs: false,
  slots: Object as Content,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "li",
        {
          "data-timeline-item": "true",
          class: cn(TIMELINE_CLASSES.item, normalizeClass(className)),
          ...rest,
        },
        [
          h(
            "span",
            {
              "aria-hidden": "true",
              "data-timeline-marker": "true",
              class: TIMELINE_CLASSES.marker,
            },
            [
              h("span", {
                "data-timeline-dot": "true",
                class: TIMELINE_CLASSES.dot,
              }),
            ],
          ),
          slots.default?.(),
        ],
      );
    };
  },
});

/** Vue's counterpart of React's TimelineTime: the event's `<time>`. */
export const KozmosTimelineTime = defineComponent({
  name: "KozmosTimelineTime",
  inheritAttrs: false,
  slots: Object as Content,
  setup(_props, { attrs, slots }) {
    return () =>
      drawText(
        "time",
        "data-timeline-time",
        TIMELINE_CLASSES.time,
        attrs,
        slots.default?.(),
      );
  },
});

/** Vue's counterpart of React's TimelineTitle: the event's `<h3>`. */
export const KozmosTimelineTitle = defineComponent({
  name: "KozmosTimelineTitle",
  inheritAttrs: false,
  slots: Object as Content,
  setup(_props, { attrs, slots }) {
    return () =>
      drawText(
        "h3",
        "data-timeline-title",
        TIMELINE_CLASSES.title,
        attrs,
        slots.default?.(),
      );
  },
});

/** Vue's counterpart of React's TimelineDescription: the event's `<p>`. */
export const KozmosTimelineDescription = defineComponent({
  name: "KozmosTimelineDescription",
  inheritAttrs: false,
  slots: Object as Content,
  setup(_props, { attrs, slots }) {
    return () =>
      drawText(
        "p",
        "data-timeline-description",
        TIMELINE_CLASSES.description,
        attrs,
        slots.default?.(),
      );
  },
});
