import {
  defineComponent,
  h,
  normalizeClass,
  type SlotsType,
  type VNode,
} from "vue";
import { Slot } from "reka-ui";
import { cn } from "#kozmos-recipes";

/**
 * Vue's counterpart of React's Box: the plain block every layout part is
 * drawn on, a `<div>` with the app's classes and attributes. `as-child`
 * draws them on its one child instead, through Reka UI's Slot, as React's
 * Box does through Radix's: the Box's classes before the child's, and its
 * attributes merged onto the child's.
 */
export const KozmosBox = defineComponent({
  name: "KozmosBox",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws: the box's content, or its one child. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const drawn = { class: cn(normalizeClass(className)), ...rest };
      return props.asChild
        ? h(Slot, drawn, slots.default)
        : h("div", drawn, slots.default?.());
    };
  },
});
