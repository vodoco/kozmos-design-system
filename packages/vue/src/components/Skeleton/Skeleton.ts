import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, skeleton } from "#kozmos-recipes";
import { styleAttribute } from "../style";
import type { KozmosSkeletonShape } from "./types";

/**
 * Vue's counterpart of React's Skeleton: a placeholder that holds the space
 * of what is loading, drawn as the `<div>` React's draws from the same
 * recipe (`skeleton`). `shape` is what it stands in
 * for: a `line` of text (16 tall unless told), a `block`, or a `circle`
 * whose `width` is its diameter (40 unless told). `width` and `height` take
 * a number of pixels or any CSS length; the app's own `style` wins. The
 * pulse rests under reduced motion.
 */
export const KozmosSkeleton = defineComponent({
  name: "KozmosSkeleton",
  inheritAttrs: false,
  props: {
    shape: {
      // A line unless told: React's parameter default, which its types
      // do not carry, so it is applied where it draws.
      type: String as PropType<KozmosSkeletonShape>,
      default: undefined,
    },
    width: {
      type: [String, Number] as PropType<number | string>,
      default: undefined,
    },
    height: {
      type: [String, Number] as PropType<number | string>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws inside it. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, style, ...rest } = attrs;
      const shape = props.shape ?? "line";
      const [shapeClass, box] = skeleton(shape, props.width, props.height);
      return h(
        "div",
        {
          class: cn(shapeClass, normalizeClass(className)),
          "data-shape": shape,
          ...styleAttribute(box, style),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});
