import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Slot } from "reka-ui";
import { cn, textVariants, textWeight } from "#kozmos-recipes";
import type {
  KozmosTextAlign,
  KozmosTextColor,
  KozmosTextSize,
  KozmosTextTag,
  KozmosTextWeight,
} from "./types";

/**
 * Vue's counterpart of React's Text: a run of text on Kozmos's type scale,
 * drawn as the `<p>` React's draws (or the tag `as` names), from the same
 * recipe (`textVariants`). `size`, `weight`, `align` and `color` pick from
 * the scale, aligned to the side reading starts on by default; the display
 * size is bold unless a weight is given (decision 203). `truncate` ends a
 * line that does not fit with an ellipsis. `as-child` draws the recipe on
 * the one child instead, as Radix's Slot does.
 */
export const KozmosText = defineComponent({
  name: "KozmosText",
  inheritAttrs: false,
  props: {
    as: { type: String as PropType<KozmosTextTag>, default: "p" },
    asChild: { type: Boolean, default: false },
    color: { type: String as PropType<KozmosTextColor>, default: undefined },
    align: { type: String as PropType<KozmosTextAlign>, default: undefined },
    size: { type: String as PropType<KozmosTextSize>, default: undefined },
    weight: { type: String as PropType<KozmosTextWeight>, default: undefined },
    truncate: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The text, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const drawn = {
        ...rest,
        class: cn(
          textVariants({
            size: props.size,
            weight: textWeight(props.size, props.weight),
            align: props.align,
            color: props.color,
            truncate: props.truncate,
            className: normalizeClass(className),
          }),
        ),
      };
      return props.asChild
        ? h(Slot, drawn, slots.default)
        : h(props.as, drawn, slots.default?.());
    };
  },
});
