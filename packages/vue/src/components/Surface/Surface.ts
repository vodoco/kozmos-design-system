import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, surfaceClass } from "#kozmos-recipes";
import type { KozmosSurfaceVariant } from "./types";

/**
 * Vue's counterpart of React's Surface: solid by default — the background
 * colour with the subtle border — or glass, the theme's glass colour at the
 * token's opacity with what shows through blurred and saturated by the
 * token's numbers and a light edge, drawn from the same recipe as React's
 * (`surfaceClass`). The shape is the caller's (`rounded-container`,
 * `rounded-panel`); the variant is the material. With transparency reduced
 * — the design config's setting or the system's — glass is the plain colour.
 */
export const KozmosSurface = defineComponent({
  name: "KozmosSurface",
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<KozmosSurfaceVariant>,
      default: "solid",
    },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws: what sits on the surface. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          class: cn(surfaceClass(props.variant), normalizeClass(className)),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});
