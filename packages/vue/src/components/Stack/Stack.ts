import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, stackVariants } from "#kozmos-recipes";
import { KozmosBox } from "../Box/Box";
import type {
  KozmosStackAlign,
  KozmosStackDirection,
  KozmosStackGap,
  KozmosStackJustify,
  KozmosStackWrap,
} from "./types";

/**
 * Vue's counterpart of React's Stack: a flex column by default, or a row,
 * with its items aligned, justified, wrapped and spaced by the layout
 * spacing steps, drawn on `KozmosBox` from the same recipe as React's
 * (`stackVariants`). `as-child` draws it on its one child, as Box does.
 */
export const KozmosStack = defineComponent({
  name: "KozmosStack",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    direction: {
      type: String as PropType<KozmosStackDirection>,
      default: undefined,
    },
    align: { type: String as PropType<KozmosStackAlign>, default: undefined },
    justify: {
      type: String as PropType<KozmosStackJustify>,
      default: undefined,
    },
    wrap: { type: String as PropType<KozmosStackWrap>, default: undefined },
    gap: { type: Number as PropType<KozmosStackGap>, default: undefined },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws: the stacked items. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        KozmosBox,
        {
          class: cn(
            stackVariants({
              direction: props.direction,
              align: props.align,
              justify: props.justify,
              wrap: props.wrap,
              gap: props.gap,
              className: normalizeClass(className),
            }),
          ),
          asChild: props.asChild === true,
          ...rest,
        },
        slots,
      );
    };
  },
});
