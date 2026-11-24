import {
  defineComponent,
  h,
  inject,
  normalizeClass,
  useId,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type StyleValue,
  type VNode,
} from "vue";
import {
  cn,
  EMPTY_STATE_PROGRESS_LABELS_CLASS,
  emotionSurfaceVariables,
  emptyStateActionClasses,
  emptyStateClampPercent,
  emptyStateClasses,
  emptyStateDescriptionClasses,
  emptyStateIconClasses,
  emptyStateListClasses,
  emptyStateProgressClasses,
  emptyStateProgressLabelClasses,
  emptyStateProgressValueClasses,
  emptyStateTitleClasses,
} from "#kozmos-recipes";
import { drawn } from "../drawn";
import { KozmosProgress } from "../Progress/Progress";
import { KozmosText } from "../Text/Text";
import type {
  KozmosEmptyStateListItem,
  KozmosEmptyStateProgress,
  KozmosEmptyStateSize,
} from "./types";
import type { KozmosEmotion } from "../Tag/types";

/**
 * The density a surrounding slot asks for, as React's EmptyStateDensity
 * provides it: a slot that already draws a padded box around its child
 * (POIResultList's empty slot) says so, and an explicit `size` still wins.
 * Internal until a ported slot provides it.
 */
export const EMPTY_STATE_DENSITY: InjectionKey<KozmosEmptyStateSize> = Symbol(
  "KozmosEmptyStateDensity",
);

/**
 * Vue's counterpart of React's EmptyState: what a region shows when it has
 * nothing to show, drawn as React's draws it from the same recipe
 * (`recipes/empty-state.ts`): an `icon` on a disc, its `title`, a
 * `description`, a `list` of what to try (GAP-165), a `progress` bar for a
 * wait it explains (GAP-115), and an `action`. `size="compact"` is for a
 * slot that already draws a box around it (GAP-009); `tone` makes it a card
 * of its own in one of Tag's six emotions (GAP-213).
 */
export const KozmosEmptyState = defineComponent({
  name: "KozmosEmptyState",
  inheritAttrs: false,
  props: {
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    /** A wait it explains, drawn under the description and above the action. */
    progress: {
      type: Object as PropType<KozmosEmptyStateProgress>,
      default: undefined,
    },
    /**
     * A list under the description (GAP-165): one item a line, each a line
     * of text or the product's own inline content (a `KozmosLink`, as a
     * VNode). An empty list draws nothing.
     */
    list: {
      type: Array as PropType<KozmosEmptyStateListItem[]>,
      default: undefined,
    },
    /** The list's name, said as a screen reader enters it. */
    listLabel: { type: String, default: undefined },
    size: {
      type: String as PropType<KozmosEmptyStateSize>,
      default: undefined,
    },
    tone: { type: String as PropType<KozmosEmotion>, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The icon, on its disc, as React's `icon`. */
    icon?: () => VNode[];
    /** What to do about it, as React's `action`. */
    action?: () => VNode[];
    /** React's EmptyState takes `children` and draws none; nor does this. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const fromSlot = inject(EMPTY_STATE_DENSITY, undefined);
    const progressLabelId = useId();
    return () => {
      const { class: className, style, ...rest } = attrs;
      const resolved = props.size ?? fromSlot ?? "default";
      const compact = resolved === "compact";
      const toned = !!props.tone;
      const icon = drawn(slots.icon?.());
      const action = drawn(slots.action?.());
      const { description, list, progress } = props;
      // The caller's own style wins, as on Tag: the tone sets a default.
      const drawnStyle = props.tone
        ? [emotionSurfaceVariables(props.tone), style]
        : style;
      return h(
        "div",
        {
          "data-size": resolved,
          "data-tone": props.tone,
          class: cn(
            ...emptyStateClasses(compact, toned),
            normalizeClass(className),
          ),
          ...(drawnStyle === undefined
            ? {}
            : { style: drawnStyle as StyleValue }),
          ...rest,
        },
        [
          icon
            ? h(
                "div",
                { class: cn(...emptyStateIconClasses(compact, toned)) },
                icon,
              )
            : null,
          // Centred on both, explicitly: Text aligns from the start.
          h(
            KozmosText,
            {
              align: "center",
              size: "base",
              weight: "medium",
              class: cn(...emptyStateTitleClasses(compact, toned)),
            },
            () => props.title,
          ),
          description
            ? h(
                KozmosText,
                {
                  align: "center",
                  size: "sm",
                  class: cn(...emptyStateDescriptionClasses(compact, toned)),
                },
                () => description,
              )
            : null,
          // The list's own role is kept where a list-style of none would
          // drop it (WebKit), so it is said as a list of so many items.
          list && list.length > 0
            ? h(
                "ul",
                {
                  role: "list",
                  "aria-label": props.listLabel,
                  "data-empty-state-list": "",
                  class: cn(
                    ...emptyStateListClasses(compact, toned, !!description),
                  ),
                },
                list.map((item) => h("li", null, [item])),
              )
            : null,
          progress
            ? h(
                "div",
                {
                  "data-empty-state-progress": "",
                  class: cn(
                    ...emptyStateProgressClasses(compact, !!description),
                  ),
                },
                [
                  // Hidden, and still the bar's name: aria-labelledby reads
                  // a hidden element, and the label is said once.
                  h(
                    "div",
                    {
                      "aria-hidden": "true",
                      class: EMPTY_STATE_PROGRESS_LABELS_CLASS,
                    },
                    [
                      h(
                        "span",
                        {
                          id: progressLabelId,
                          class: cn(...emptyStateProgressLabelClasses(toned)),
                        },
                        progress.label,
                      ),
                      progress.valueText
                        ? h(
                            "span",
                            {
                              class: cn(
                                ...emptyStateProgressValueClasses(toned),
                              ),
                            },
                            progress.valueText,
                          )
                        : null,
                    ],
                  ),
                  h(KozmosProgress, {
                    value: emptyStateClampPercent(progress.value),
                    "aria-labelledby": progressLabelId,
                    getValueLabel: progress.valueText
                      ? () => progress.valueText!
                      : undefined,
                  }),
                ],
              )
            : null,
          action
            ? h(
                "div",
                { class: cn(...emptyStateActionClasses(compact)) },
                action,
              )
            : null,
        ],
      );
    };
  },
});
