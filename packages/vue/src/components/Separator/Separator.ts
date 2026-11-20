import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Separator } from "reka-ui";
import { cn, separatorClasses } from "#kozmos-recipes";
import type { KozmosSeparatorOrientation } from "./types";

/**
 * Vue's counterpart of React's Separator: a line between groups, drawn on
 * Reka UI's Separator as React's is on Radix's, from the same recipe
 * (`separatorClasses`). Decorative by default (`role="none"`), as React's:
 * give `:decorative="false"` for a separator assistive technology reads,
 * which says its orientation when vertical. `as-child` draws the recipe on
 * the one child instead, as Radix's Slot does.
 */
export const KozmosSeparator = defineComponent({
  name: "KozmosSeparator",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    orientation: {
      type: String as PropType<KozmosSeparatorOrientation>,
      default: "horizontal",
    },
    decorative: { type: Boolean, default: true },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws inside it, which is rarely anything. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        Separator,
        {
          asChild: props.asChild,
          decorative: props.decorative,
          orientation: props.orientation,
          class: cn(
            separatorClasses(props.orientation),
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default,
      );
    };
  },
});
