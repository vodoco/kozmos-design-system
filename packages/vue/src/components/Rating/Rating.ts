import {
  defineComponent,
  h,
  normalizeClass,
  ref,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Star01 as Star, ThumbsDown, ThumbsUp } from "@kozmos-ds/icons/vue";
import {
  cn,
  defaultRatingItemLabel,
  defaultRatingValueLabel,
  RATING_CLASS,
  RATING_HALF_CLASSES,
  RATING_THUMB_ICON_CLASS,
  ratingItemClass,
  ratingStarClass,
  ratingThumbClass,
  roundRatingToHalf,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import type { KozmosRatingLabel, KozmosRatingVariant } from "./types";

// React's defaults, typed as Vue's own: a declaration naming the recipe's
// would name a module the package does not ship.
const itemLabelDefault: KozmosRatingLabel = defaultRatingItemLabel;
const valueLabelDefault: KozmosRatingLabel = defaultRatingValueLabel;

/** The mark itself, so the read-only and interactive forms cannot drift. */
function face(filled: boolean, item: number, thumbs: boolean, half = false) {
  if (!thumbs && half)
    // The empty star, and the filled one over it clipped to its inline
    // start half: the left in a left-to-right page, the right in a
    // right-to-left one.
    return h(
      "span",
      { "aria-hidden": "true", class: RATING_HALF_CLASSES.box },
      [
        h(Star, { class: RATING_HALF_CLASSES.empty }),
        h("span", { class: RATING_HALF_CLASSES.clip, "data-rating-half": "" }, [
          h(Star, { class: RATING_HALF_CLASSES.filled }),
        ]),
      ],
    );
  if (!thumbs)
    return h(Star, { "aria-hidden": "true", class: ratingStarClass(filled) });
  return h("span", { "aria-hidden": "true", class: ratingThumbClass(filled) }, [
    h(item === 1 ? ThumbsDown : ThumbsUp, { class: RATING_THUMB_ICON_CLASS }),
  ]);
}

/**
 * Vue's counterpart of React's Rating: the scale React's draws, from the same
 * recipe (`recipes/rating.ts`). `v-model` is React's `value` and `onChange`:
 * 0 is unanswered, and choosing what is already chosen returns to it. On
 * `stars` it is a mark out of `max`; on `thumbs`, a choice of two, 1 down
 * and 2 up, where exactly the one chosen fills.
 *
 * It is a radiogroup named by `label`, one tab stop, its options named by
 * `item-label`; the arrows move and choose as a radiogroup does, in the
 * writing direction, and Home and End reach its ends. A pointer over the
 * stars lights them without touching `aria-checked`. Each choice is
 * reported as `rating_changed`, with React's properties, before
 * `update:modelValue` is emitted.
 *
 * `read-only` is not a control: one image, named by `value-label`, its stars
 * drawn to the nearest half (decision 181).
 */
export const KozmosRating = defineComponent({
  name: "KozmosRating",
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<KozmosRatingVariant>,
      default: "stars",
    },
    /** Ignored when `variant` is `thumbs`, which is always a choice of two. */
    max: { type: Number, default: 5 },
    /** React's `value`: 0 is unanswered. */
    modelValue: { type: Number, default: 0 },
    readOnly: { type: Boolean, default: false },
    /** The group's accessible name. */
    label: { type: String, default: "Rating" },
    /** Each option's accessible name. */
    itemLabel: {
      type: Function as PropType<KozmosRatingLabel>,
      default: itemLabelDefault,
    },
    /** How a chosen rating reads when `read-only`. */
    valueLabel: {
      type: Function as PropType<KozmosRatingLabel>,
      default: valueLabelDefault,
    },
  },
  emits: {
    /** React's `onChange`: the value chosen, 0 when it was cleared. */
    "update:modelValue": (_value: number) => true,
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's Rating draws its own options there. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const hoverValue = ref<number | null>(null);
    const group = ref<HTMLDivElement | null>(null);

    return () => {
      const { class: className, ...rest } = attrs;
      const variant = props.variant;
      const thumbs = variant === "thumbs";
      const max = thumbs ? 2 : props.max;
      const value = props.modelValue;

      // A read-only rating is not a control.
      if (props.readOnly) {
        const shown = thumbs ? value : roundRatingToHalf(value);
        const filled = (item: number) =>
          thumbs ? item === shown : item <= shown;
        return h(
          "div",
          {
            ref: group,
            role: "img",
            "aria-label": props.valueLabel(shown, max, variant),
            class: cn(RATING_CLASS, normalizeClass(className)),
            ...rest,
          },
          Array.from({ length: max }, (_, index) =>
            face(
              filled(index + 1),
              index + 1,
              thumbs,
              !thumbs && index + 0.5 === shown,
            ),
          ),
        );
      }

      const choose = (next: number) => {
        trackEvent("Rating", "rating_changed", { value: next, max, variant });
        emit("update:modelValue", next);
      };
      // Choosing what is already chosen clears it.
      const select = (next: number) => choose(next === value ? 0 : next);
      const move = (from: number, step: number) => {
        const next = Math.min(max, Math.max(1, from + step));
        const options =
          group.value?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        options?.[next - 1]?.focus();
        // A radiogroup selects as it moves.
        if (next !== value) choose(next);
      };
      const onKeydown = (event: KeyboardEvent, item: number) => {
        // Left and right are the writing direction's, not the screen's.
        const rtl =
          group.value && getComputedStyle(group.value).direction === "rtl";
        const forward = rtl ? "ArrowLeft" : "ArrowRight";
        const back = rtl ? "ArrowRight" : "ArrowLeft";
        switch (event.key) {
          case forward:
          case "ArrowDown":
            event.preventDefault();
            move(item, 1);
            break;
          case back:
          case "ArrowUp":
            event.preventDefault();
            move(item, -1);
            break;
          case "Home":
            event.preventDefault();
            move(1, 0);
            break;
          case "End":
            event.preventDefault();
            move(max, 0);
            break;
          default:
            break;
        }
      };

      // One tab stop for the group, not one per option.
      const tabStop = value > 0 ? value : 1;
      // Hover previews the scale; it never touches aria-checked.
      const shown =
        !thumbs && hoverValue.value !== null ? hoverValue.value : value;
      return h(
        "div",
        {
          ref: group,
          role: "radiogroup",
          "aria-label": props.label,
          class: cn(RATING_CLASS, normalizeClass(className)),
          ...rest,
        },
        Array.from({ length: max }, (_, index) => {
          const item = index + 1;
          const filled = thumbs ? item === shown : item <= shown;
          return h(
            "button",
            {
              key: index,
              type: "button",
              role: "radio",
              "aria-checked": item === value,
              "aria-label": props.itemLabel(item, max, variant),
              tabindex: item === tabStop ? 0 : -1,
              class: ratingItemClass(thumbs),
              onClick: () => select(item),
              onKeydown: (event: KeyboardEvent) => onKeydown(event, item),
              onMouseenter: () => {
                if (!thumbs) hoverValue.value = item;
              },
              onMouseleave: () => {
                if (!thumbs) hoverValue.value = null;
              },
            },
            [face(filled, item, thumbs)],
          );
        }),
      );
    };
  },
});
