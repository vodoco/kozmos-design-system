import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, containerClasses } from "#kozmos-recipes";
import { KozmosBox } from "../Box/Box";
import type { KozmosContainerBlock, KozmosContainerInset } from "./types";

/**
 * Vue's counterpart of React's Container: a page region's full-width box,
 * padded at its sides and centred at the widest page's width, drawn on
 * `KozmosBox` from the same recipe as React's (`containerClasses`).
 * `inset="window"`, the default, steps its side padding 16, 24, 32 with the
 * viewport, which is right for a page; `inset="panel"` keeps 16, which is
 * right inside a fixed-width region. `block` gives it clear space above and
 * below (GAP-116): `sm` 16, `md` 24, `lg` 32, or `{ start, end }` apart.
 */
export const KozmosContainer = defineComponent({
  name: "KozmosContainer",
  inheritAttrs: false,
  props: {
    centered: { type: Boolean, default: true },
    inset: {
      type: String as PropType<KozmosContainerInset>,
      default: "window",
    },
    block: {
      type: [String, Object] as PropType<KozmosContainerBlock>,
      default: undefined,
    },
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws: the region's content. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        KozmosBox,
        {
          class: cn(
            containerClasses({
              centered: props.centered,
              inset: props.inset,
              block: props.block,
            }),
            normalizeClass(className),
          ),
          asChild: props.asChild === true,
          ...rest,
        },
        slots,
      );
    };
  },
});
