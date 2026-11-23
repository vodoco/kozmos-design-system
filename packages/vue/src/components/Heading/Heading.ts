import {
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { headingSizes, headingTags } from "#kozmos-recipes";
import { KozmosText } from "../Text/Text";
import type { KozmosTextAlign, KozmosTextColor } from "../Text/types";
import type { KozmosHeadingLevel, KozmosHeadingTag } from "./types";

/**
 * Vue's counterpart of React's Heading: a bold KozmosText at its level's
 * size and tag (H1 is 4xl, down to H6 at the body's size), from the same
 * recipe (`headingSizes`, `headingTags`), as React's Heading draws a bold
 * Text. `as` draws another tag at the level's size; `:level="null"` draws
 * the body's size. `size="display"` draws the one display size, 48 on 54
 * lines (decision 203), for a marketing-style headline; `level` stays its
 * rank.
 */
export const KozmosHeading = defineComponent({
  name: "KozmosHeading",
  inheritAttrs: false,
  props: {
    level: {
      type: Number as PropType<KozmosHeadingLevel | null>,
      default: 1,
    },
    as: { type: String as PropType<KozmosHeadingTag>, default: undefined },
    size: { type: String as PropType<"display">, default: undefined },
    color: { type: String as PropType<KozmosTextColor>, default: undefined },
    asChild: { type: Boolean, default: undefined },
    align: { type: String as PropType<KozmosTextAlign>, default: undefined },
    truncate: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The heading's words, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const level = props.level;
      return h(
        KozmosText,
        {
          as: props.as ?? headingTags[level ?? 1],
          size: props.size ?? (level === null ? "base" : headingSizes[level]),
          weight: "bold",
          color: props.color,
          asChild: props.asChild,
          align: props.align,
          truncate: props.truncate,
          ...attrs,
        },
        slots.default,
      );
    };
  },
});
